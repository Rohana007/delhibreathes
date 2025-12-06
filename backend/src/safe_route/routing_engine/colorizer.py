"""
Route Colorization
Maps AQI values to colors and groups segments by color
"""
import logging
from typing import List, Dict, Tuple
try:
    from .utils import decode_polyline
except ImportError:
    from routing_engine.utils import decode_polyline

logger = logging.getLogger(__name__)

class RouteColorizer:
    """Colorizes route segments based on AQI thresholds"""
    
    # AQI color thresholds
    COLOR_THRESHOLDS = {
        'green': {'max': 80, 'color': '#2ecc71'},      # Good
        'yellow': {'max': 149, 'color': '#f1c40f'},   # Moderate
        'orange': {'max': 249, 'color': '#e67e22'},   # Unhealthy for Sensitive
        'red': {'max': float('inf'), 'color': '#e74c3c'}  # Unhealthy+
    }
    
    @staticmethod
    def aqi_to_color(aqi: float) -> str:
        """
        Map AQI value to color hex code
        
        Args:
            aqi: AQI value
        
        Returns:
            Hex color code
        """
        if aqi < 80:
            return '#2ecc71'  # green
        elif aqi < 150:
            return '#f1c40f'  # yellow
        elif aqi < 250:
            return '#e67e22'  # orange
        else:
            return '#e74c3c'  # red
    
    @staticmethod
    def group_segments_by_color(segments: List[Dict]) -> List[Dict]:
        """
        Group consecutive segments with same color into polylines
        
        Args:
            segments: List of segment dicts with 'start_coord', 'end_coord', 'aqi'
        
        Returns:
            List of color group dicts:
            {
                'color': str (hex),
                'segments': List[Dict],
                'polyline_coords': List[Tuple],
                'avg_aqi': float,
                'total_length_m': float,
                'total_duration_s': float
            }
        """
        if not segments:
            return []
        
        color_groups = []
        current_group = None
        
        for segment in segments:
            color = RouteColorizer.aqi_to_color(segment.get('aqi', 0))
            
            if current_group is None or current_group['color'] != color:
                # Start new group
                if current_group is not None:
                    color_groups.append(current_group)
                
                current_group = {
                    'color': color,
                    'segments': [],
                    'polyline_coords': [],
                    'aqi_values': [],
                    'lengths': [],
                    'durations': []
                }
            
            # Add segment to current group
            current_group['segments'].append(segment)
            current_group['polyline_coords'].append(segment['start_coord'])
            current_group['aqi_values'].append(segment.get('aqi', 0))
            current_group['lengths'].append(segment.get('length_m', 0))
            current_group['durations'].append(segment.get('duration_s', 0))
        
        # Add last group
        if current_group is not None:
            # Add final coordinate
            if current_group['segments']:
                last_segment = current_group['segments'][-1]
                current_group['polyline_coords'].append(last_segment['end_coord'])
            
            color_groups.append(current_group)
        
        # Calculate stats for each group
        for group in color_groups:
            if group['aqi_values']:
                group['avg_aqi'] = round(sum(group['aqi_values']) / len(group['aqi_values']), 2)
            else:
                group['avg_aqi'] = 0
            
            group['total_length_m'] = round(sum(group['lengths']), 2)
            group['total_duration_s'] = round(sum(group['durations']), 2)
            
            # Remove intermediate lists
            del group['aqi_values']
            del group['lengths']
            del group['durations']
        
        logger.info(f"Grouped segments into {len(color_groups)} color groups")
        return color_groups
    
    @staticmethod
    def encode_polyline_from_coords(coords: List[Tuple[float, float]]) -> str:
        """
        Encode list of coordinates to Google polyline string
        
        Args:
            coords: List of (lat, lng) tuples
        
        Returns:
            Encoded polyline string
        """
        if not coords:
            return ""
        
        def encode_number(num):
            """Encode a number for polyline"""
            num = int(round(num * 1e5))
            num = num << 1
            if num < 0:
                num = ~num
            encoded = ""
            while num >= 0x20:
                encoded += chr((0x20 | (num & 0x1f)) + 63)
                num >>= 5
            encoded += chr(num + 63)
            return encoded
        
        polyline = ""
        prev_lat = 0
        prev_lng = 0
        
        for lat, lng in coords:
            dlat = int(round((lat - prev_lat) * 1e5))
            dlng = int(round((lng - prev_lng) * 1e5))
            
            polyline += encode_number(dlat)
            polyline += encode_number(dlng)
            
            prev_lat = lat
            prev_lng = lng
        
        return polyline
    
    @classmethod
    def colorize_route(cls, segments: List[Dict]) -> Dict:
        """
        Colorize a route and return polylines by color
        
        Args:
            segments: List of route segments
        
        Returns:
            Dict with 'polylines_by_color' list and 'color_stats'
        """
        color_groups = cls.group_segments_by_color(segments)
        
        polylines_by_color = []
        for group in color_groups:
            # Encode polyline for this color group
            polyline = cls.encode_polyline_from_coords(group['polyline_coords'])
            
            polylines_by_color.append({
                'color': group['color'],
                'polyline': polyline,
                'coords': group['polyline_coords'],
                'avg_aqi': group['avg_aqi'],
                'total_length_m': group['total_length_m'],
                'total_duration_s': group['total_duration_s'],
                'segment_count': len(group['segments'])
            })
        
        # Calculate overall color distribution
        color_stats = {}
        for group in color_groups:
            color = group['color']
            if color not in color_stats:
                color_stats[color] = {
                    'length_m': 0,
                    'duration_s': 0,
                    'segment_count': 0
                }
            color_stats[color]['length_m'] += group['total_length_m']
            color_stats[color]['duration_s'] += group['total_duration_s']
            color_stats[color]['segment_count'] += len(group['segments'])
        
        return {
            'polylines_by_color': polylines_by_color,
            'color_stats': color_stats
        }

