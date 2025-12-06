"""
Google Maps API Client
Handles Directions API and Roads/Traffic API calls with retry logic
"""
import os
import time
import random
import logging
from typing import List, Dict, Optional, Tuple
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

class GoogleClient:
    """Client for Google Maps APIs with exponential backoff and retry logic"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.directions_url = "https://maps.googleapis.com/maps/api/directions/json"
        self.roads_url = "https://roads.googleapis.com/v1/snapToRoads"
        self.speed_limits_url = "https://roads.googleapis.com/v1/speedLimits"
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session = requests.Session()
        self.session.mount("https://", adapter)
    
    def _exponential_backoff(self, attempt: int, base_delay: float = 1.0) -> float:
        """Calculate exponential backoff with jitter"""
        delay = base_delay * (2 ** attempt)
        jitter = random.uniform(0, 0.3 * delay)
        return delay + jitter
    
    def get_directions(
        self, 
        source: Tuple[float, float], 
        destination: Tuple[float, float], 
        alternatives: int = 3
    ) -> List[Dict]:
        """
        Get directions from Google Directions API with alternatives
        
        Args:
            source: (lat, lng) tuple
            destination: (lat, lng) tuple
            alternatives: Number of alternative routes (max 3)
        
        Returns:
            List of route objects with structure:
            {
                'route_id': str,
                'polyline': str (encoded),
                'legs': List[Dict],
                'steps': List[Dict],
                'distance_m': float,
                'duration_s': float,
                'summary': str
            }
        """
        source_str = f"{source[0]},{source[1]}"
        dest_str = f"{destination[0]},{destination[1]}"
        
        params = {
            'origin': source_str,
            'destination': dest_str,
            'alternatives': 'true' if alternatives > 1 else 'false',
            'key': self.api_key,
            'mode': 'driving',
            'avoid': 'tolls',  # Can be extended to avoid highways, ferries
            'units': 'metric'
        }
        
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                response = self.session.get(self.directions_url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                if data['status'] != 'OK':
                    error_msg = data.get('error_message', f"Directions API error: {data['status']}")
                    logger.error(f"Google Directions API error: {data['status']} - {error_msg}")
                    
                    # Handle specific error cases
                    if data['status'] == 'REQUEST_DENIED':
                        raise Exception("Google Maps API key is invalid or missing. Please check GOOGLE_MAPS_API_KEY in backend/.env and ensure Directions API is enabled in Google Cloud Console.")
                    elif data['status'] == 'OVER_QUERY_LIMIT':
                        if attempt < max_attempts - 1:
                            delay = self._exponential_backoff(attempt)
                            logger.warning(f"Rate limited, retrying after {delay:.2f}s")
                            time.sleep(delay)
                            continue
                        raise Exception("Google Maps API quota exceeded. Please check your API usage limits.")
                    elif data['status'] == 'ZERO_RESULTS':
                        raise Exception("No routes found between the specified locations.")
                    else:
                        raise Exception(f"Google Directions API error: {data['status']} - {error_msg}")
                
                routes = []
                for idx, route in enumerate(data.get('routes', [])):
                    route_obj = {
                        'route_id': f"route_{idx}",
                        'polyline': route['overview_polyline']['points'],
                        'legs': route.get('legs', []),
                        'steps': [],
                        'distance_m': 0,
                        'duration_s': 0,
                        'summary': route.get('summary', '')
                    }
                    
                    # Extract steps and aggregate distance/duration
                    for leg in route.get('legs', []):
                        route_obj['distance_m'] += leg['distance']['value']
                        route_obj['duration_s'] += leg['duration']['value']
                        route_obj['steps'].extend(leg.get('steps', []))
                    
                    routes.append(route_obj)
                
                logger.info(f"Retrieved {len(routes)} route(s) from Google Directions API")
                return routes
                
            except requests.exceptions.RequestException as e:
                if attempt < max_attempts - 1:
                    delay = self._exponential_backoff(attempt)
                    logger.warning(f"Request failed, retrying after {delay:.2f}s: {e}")
                    time.sleep(delay)
                else:
                    logger.error(f"Failed to get directions after {max_attempts} attempts: {e}")
                    raise
        
        return []
    
    def get_segment_speeds(self, coords_list: List[Tuple[float, float]]) -> List[float]:
        """
        Get speed limits/speeds for route segments using Google Roads API
        
        Args:
            coords_list: List of (lat, lng) tuples along the route
        
        Returns:
            List of speeds in m/s for each segment
        """
        if not coords_list or len(coords_list) < 2:
            return []
        
        # Google Roads API has limits, so we sample points if too many
        max_points = 100
        if len(coords_list) > max_points:
            step = len(coords_list) // max_points
            coords_list = coords_list[::step]
        
        # Build path string
        path_str = '|'.join([f"{lat},{lng}" for lat, lng in coords_list])
        
        params = {
            'path': path_str,
            'key': self.api_key
        }
        
        try:
            response = self.session.get(self.speed_limits_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            speeds = []
            for speed_limit in data.get('speedLimits', []):
                # Convert km/h to m/s
                kmh = speed_limit.get('speedLimit', 50)  # Default 50 km/h
                ms = (kmh * 1000) / 3600
                speeds.append(ms)
            
            # If we got fewer speeds than segments, interpolate
            if len(speeds) < len(coords_list) - 1:
                # Repeat last known speed or use default
                default_speed = speeds[-1] if speeds else 13.89  # 50 km/h in m/s
                while len(speeds) < len(coords_list) - 1:
                    speeds.append(default_speed)
            
            return speeds[:len(coords_list) - 1]
            
        except Exception as e:
            logger.warning(f"Failed to get segment speeds from Roads API: {e}")
            # Return default speeds (50 km/h = 13.89 m/s)
            return [13.89] * (len(coords_list) - 1)

