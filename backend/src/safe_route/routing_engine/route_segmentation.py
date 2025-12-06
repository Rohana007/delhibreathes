"""
Route Segmentation
Segments routes into configurable length segments with AQI and speed data
"""
import logging
from typing import List, Dict, Tuple, Optional
try:
    from .utils import decode_polyline, haversine_distance, interpolate_coords
    from .aqi_grid_loader import AQIGridLoader
    from .google_client import GoogleClient
except ImportError:
    # Fallback for absolute imports
    from routing_engine.utils import decode_polyline, haversine_distance, interpolate_coords
    from routing_engine.aqi_grid_loader import AQIGridLoader
    from routing_engine.google_client import GoogleClient

logger = logging.getLogger(__name__)

class RouteSegmenter:
    """Segments routes into smaller segments for AQI analysis"""
    
    def __init__(
        self, 
        aqi_loader: AQIGridLoader,
        google_client: GoogleClient,
        segment_length_m: float = 15.0
    ):
        self.aqi_loader = aqi_loader
        self.google_client = google_client
        self.segment_length_m = segment_length_m
    
    def segment_route(
        self, 
        route: Dict,
        speeds: Optional[List[float]] = None
    ) -> List[Dict]:
        """
        Segment a route into smaller segments with AQI and speed data
        
        Args:
            route: Route dict with 'polyline' and 'steps'
            speeds: Optional list of speeds per segment (from Roads API)
        
        Returns:
            List of segment dicts with structure:
            {
                'centroid': (lat, lng),
                'length_m': float,
                'duration_s': float,
                'aqi': float,
                'pm25': float,
                'forecast_1hr': float,
                'speed_ms': float,
                'start_coord': (lat, lng),
                'end_coord': (lat, lng)
            }
        """
        # Decode polyline
        coords = decode_polyline(route['polyline'])
        
        if len(coords) < 2:
            logger.warning("Route has insufficient coordinates")
            return []
        
        segments = []
        current_idx = 0
        segment_coords = []
        segment_start = coords[0]
        
        # Get speeds if not provided
        if speeds is None:
            speeds = self.google_client.get_segment_speeds(coords)
        
        speed_idx = 0
        
        for i in range(1, len(coords)):
            segment_coords.append(coords[i-1])
            dist = haversine_distance(coords[i-1], coords[i])
            
            # If accumulated distance exceeds segment length, create segment
            accumulated_dist = sum([
                haversine_distance(segment_coords[j], segment_coords[j+1])
                for j in range(len(segment_coords) - 1)
            ])
            
            if accumulated_dist >= self.segment_length_m or i == len(coords) - 1:
                # Finalize current segment
                segment_coords.append(coords[i])
                
                # Calculate segment properties
                segment_length = accumulated_dist if accumulated_dist < self.segment_length_m else self.segment_length_m
                
                # Centroid (midpoint)
                mid_idx = len(segment_coords) // 2
                centroid = segment_coords[mid_idx]
                
                # Get AQI at centroid
                aqi_data = self.aqi_loader.get_nearest_aqi(centroid[0], centroid[1])
                
                # Calculate duration (use speed if available, else estimate)
                if speed_idx < len(speeds) and speeds[speed_idx] > 0:
                    speed_ms = speeds[speed_idx]
                    duration_s = segment_length / speed_ms
                else:
                    # Default speed estimate (50 km/h = 13.89 m/s)
                    speed_ms = 13.89
                    duration_s = segment_length / speed_ms
                
                segment = {
                    'centroid': centroid,
                    'length_m': segment_length,
                    'duration_s': duration_s,
                    'aqi': aqi_data['aqi'],
                    'pm25': aqi_data['pm25'],
                    'forecast_1hr': aqi_data['forecast_1hr'],
                    'speed_ms': speed_ms,
                    'start_coord': segment_coords[0],
                    'end_coord': segment_coords[-1],
                    'segment_id': len(segments)
                }
                
                segments.append(segment)
                
                # Reset for next segment
                segment_start = coords[i]
                segment_coords = [coords[i]]
                speed_idx += 1
        
        # Handle any remaining coordinates
        if len(segment_coords) > 1:
            segment_length = sum([
                haversine_distance(segment_coords[j], segment_coords[j+1])
                for j in range(len(segment_coords) - 1)
            ])
            
            mid_idx = len(segment_coords) // 2
            centroid = segment_coords[mid_idx]
            aqi_data = self.aqi_loader.get_nearest_aqi(centroid[0], centroid[1])
            
            if speed_idx < len(speeds) and speeds[speed_idx] > 0:
                speed_ms = speeds[speed_idx]
            else:
                speed_ms = 13.89
            
            duration_s = segment_length / speed_ms
            
            segment = {
                'centroid': centroid,
                'length_m': segment_length,
                'duration_s': duration_s,
                'aqi': aqi_data['aqi'],
                'pm25': aqi_data['pm25'],
                'forecast_1hr': aqi_data['forecast_1hr'],
                'speed_ms': speed_ms,
                'start_coord': segment_coords[0],
                'end_coord': segment_coords[-1],
                'segment_id': len(segments)
            }
            segments.append(segment)
        
        logger.info(f"Segmented route into {len(segments)} segments")
        return segments

