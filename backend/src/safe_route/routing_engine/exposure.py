"""
Exposure Calculation
Computes time-weighted PM2.5 exposure for routes
"""
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class ExposureCalculator:
    """Calculates time-weighted pollution exposure"""
    
    @staticmethod
    def calculate_time_weighted_exposure(segments: List[Dict]) -> Dict:
        """
        Calculate time-weighted PM2.5 exposure for route segments
        
        Formula: exposure = sum(segment.pm25 * time_on_segment) / sum(time_on_segment)
        
        Args:
            segments: List of segment dicts with 'pm25' and 'duration_s'
        
        Returns:
            Dict with keys:
            - pm25_exposure: Time-weighted PM2.5 exposure
            - total_duration_s: Total route duration
            - max_pm25: Maximum PM2.5 encountered
            - min_pm25: Minimum PM2.5 encountered
            - avg_pm25: Simple average PM2.5
        """
        if not segments:
            return {
                'pm25_exposure': 0,
                'total_duration_s': 0,
                'max_pm25': 0,
                'min_pm25': 0,
                'avg_pm25': 0
            }
        
        total_weighted_pm25 = 0
        total_duration = 0
        pm25_values = []
        
        for segment in segments:
            pm25 = segment.get('pm25', 0)
            duration = segment.get('duration_s', 0)
            
            if duration > 0:
                total_weighted_pm25 += pm25 * duration
                total_duration += duration
                pm25_values.append(pm25)
        
        if total_duration > 0:
            exposure = total_weighted_pm25 / total_duration
        else:
            exposure = 0
        
        return {
            'pm25_exposure': round(exposure, 2),
            'total_duration_s': round(total_duration, 2),
            'max_pm25': max(pm25_values) if pm25_values else 0,
            'min_pm25': min(pm25_values) if pm25_values else 0,
            'avg_pm25': round(sum(pm25_values) / len(pm25_values), 2) if pm25_values else 0
        }
    
    @staticmethod
    def normalize_exposure(exposure: float, max_exposure: float = 300) -> float:
        """
        Normalize exposure to 0-100 scale
        
        Args:
            exposure: PM2.5 exposure value
            max_exposure: Maximum expected exposure (default 300 µg/m³)
        
        Returns:
            Normalized value 0-100
        """
        if max_exposure <= 0:
            return 0
        
        normalized = (exposure / max_exposure) * 100
        return min(100, max(0, round(normalized, 2)))
    
    @staticmethod
    def calculate_aqi_exposure(segments: List[Dict]) -> Dict:
        """
        Calculate time-weighted AQI exposure (alternative metric)
        
        Args:
            segments: List of segment dicts with 'aqi' and 'duration_s'
        
        Returns:
            Dict with aqi_exposure and related metrics
        """
        if not segments:
            return {
                'aqi_exposure': 0,
                'total_duration_s': 0,
                'max_aqi': 0,
                'min_aqi': 0,
                'avg_aqi': 0
            }
        
        total_weighted_aqi = 0
        total_duration = 0
        aqi_values = []
        
        for segment in segments:
            aqi = segment.get('aqi', 0)
            duration = segment.get('duration_s', 0)
            
            if duration > 0:
                total_weighted_aqi += aqi * duration
                total_duration += duration
                aqi_values.append(aqi)
        
        if total_duration > 0:
            exposure = total_weighted_aqi / total_duration
        else:
            exposure = 0
        
        return {
            'aqi_exposure': round(exposure, 2),
            'total_duration_s': round(total_duration, 2),
            'max_aqi': max(aqi_values) if aqi_values else 0,
            'min_aqi': min(aqi_values) if aqi_values else 0,
            'avg_aqi': round(sum(aqi_values) / len(aqi_values), 2) if aqi_values else 0
        }

