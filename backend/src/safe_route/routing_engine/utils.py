"""
Utility functions for polyline decoding and coordinate calculations
"""
import math
from typing import List, Tuple

def decode_polyline(polyline: str) -> List[Tuple[float, float]]:
    """
    Decode Google encoded polyline string to list of (lat, lng) tuples
    
    Args:
        polyline: Encoded polyline string
    
    Returns:
        List of (lat, lng) tuples
    """
    coords = []
    index = 0
    lat = 0
    lng = 0
    
    while index < len(polyline):
        # Decode latitude
        shift = 0
        result = 0
        while True:
            b = ord(polyline[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat
        
        # Decode longitude
        shift = 0
        result = 0
        while True:
            b = ord(polyline[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng
        
        coords.append((lat / 1e5, lng / 1e5))
    
    return coords

def haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    
    Args:
        coord1: (lat, lng) tuple
        coord2: (lat, lng) tuple
    
    Returns:
        Distance in meters
    """
    R = 6371000  # Earth radius in meters
    
    lat1, lng1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lng2 = math.radians(coord2[0]), math.radians(coord2[1])
    
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def interpolate_coords(start: Tuple[float, float], end: Tuple[float, float], num_points: int) -> List[Tuple[float, float]]:
    """
    Interpolate coordinates between two points
    
    Args:
        start: Starting (lat, lng)
        end: Ending (lat, lng)
        num_points: Number of points to generate (including start and end)
    
    Returns:
        List of interpolated coordinates
    """
    if num_points < 2:
        return [start, end]
    
    coords = []
    for i in range(num_points):
        t = i / (num_points - 1)
        lat = start[0] + (end[0] - start[0]) * t
        lng = start[1] + (end[1] - start[1]) * t
        coords.append((lat, lng))
    
    return coords

def calculate_bearing(start: Tuple[float, float], end: Tuple[float, float]) -> float:
    """
    Calculate bearing (direction) from start to end point
    
    Args:
        start: Starting (lat, lng)
        end: Ending (lat, lng)
    
    Returns:
        Bearing in degrees (0-360)
    """
    lat1, lng1 = math.radians(start[0]), math.radians(start[1])
    lat2, lng2 = math.radians(end[0]), math.radians(end[1])
    
    dlng = lng2 - lng1
    
    y = math.sin(dlng) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlng)
    
    bearing = math.atan2(y, x)
    bearing = math.degrees(bearing)
    bearing = (bearing + 360) % 360
    
    return bearing

