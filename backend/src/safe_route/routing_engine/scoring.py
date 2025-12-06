"""
Route Scoring
Computes weighted scores for routes based on distance, pollution, and traffic
"""
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class RouteScorer:
    """Scores and ranks routes based on multiple factors"""
    
    def __init__(
        self,
        weight_distance: float = 0.6,
        weight_pollution: float = 0.3,
        weight_traffic: float = 0.1
    ):
        """
        Initialize scorer with weights
        
        Args:
            weight_distance: Weight for distance factor (0-1)
            weight_pollution: Weight for pollution factor (0-1)
            weight_traffic: Weight for traffic factor (0-1)
        """
        self.weight_distance = weight_distance
        self.weight_pollution = weight_pollution
        self.weight_traffic = weight_traffic
        
        # Normalize weights to sum to 1
        total = weight_distance + weight_pollution + weight_traffic
        if total > 0:
            self.weight_distance /= total
            self.weight_pollution /= total
            self.weight_traffic /= total
    
    def normalize_distance(self, distance_m: float, min_dist: float, max_dist: float) -> float:
        """
        Normalize distance to 0-1 scale (lower is better)
        
        Args:
            distance_m: Distance in meters
            min_dist: Minimum distance among routes
            max_dist: Maximum distance among routes
        
        Returns:
            Normalized score 0-1 (0 = best, 1 = worst)
        """
        if max_dist == min_dist:
            return 0.5
        
        normalized = (distance_m - min_dist) / (max_dist - min_dist)
        return max(0, min(1, normalized))
    
    def normalize_pollution(self, exposure: float, min_exp: float, max_exp: float) -> float:
        """
        Normalize pollution exposure to 0-1 scale (lower is better)
        
        Args:
            exposure: PM2.5 exposure value
            min_exp: Minimum exposure among routes
            max_exp: Maximum exposure among routes
        
        Returns:
            Normalized score 0-1 (0 = best, 1 = worst)
        """
        if max_exp == min_exp:
            return 0.5
        
        normalized = (exposure - min_exp) / (max_exp - min_exp)
        return max(0, min(1, normalized))
    
    def normalize_traffic(self, duration_s: float, min_dur: float, max_dur: float) -> float:
        """
        Normalize traffic/duration to 0-1 scale (lower is better)
        
        Args:
            duration_s: Duration in seconds
            min_dur: Minimum duration among routes
            max_dur: Maximum duration among routes
        
        Returns:
            Normalized score 0-1 (0 = best, 1 = worst)
        """
        if max_dur == min_dur:
            return 0.5
        
        normalized = (duration_s - min_dur) / (max_dur - min_dur)
        return max(0, min(1, normalized))
    
    def score_route(
        self,
        route_data: Dict,
        min_distance: float,
        max_distance: float,
        min_exposure: float,
        max_exposure: float,
        min_duration: float,
        max_duration: float
    ) -> float:
        """
        Calculate composite score for a route
        
        Args:
            route_data: Route dict with 'distance_m', 'exposure', 'duration_s'
            min_distance, max_distance: Range for normalization
            min_exposure, max_exposure: Range for normalization
            min_duration, max_duration: Range for normalization
        
        Returns:
            Composite score (lower is better)
        """
        distance_score = self.normalize_distance(
            route_data.get('distance_m', 0),
            min_distance,
            max_distance
        )
        
        pollution_score = self.normalize_pollution(
            route_data.get('exposure', 0),
            min_exposure,
            max_exposure
        )
        
        traffic_score = self.normalize_traffic(
            route_data.get('duration_s', 0),
            min_duration,
            max_duration
        )
        
        final_score = (
            self.weight_distance * distance_score +
            self.weight_pollution * pollution_score +
            self.weight_traffic * traffic_score
        )
        
        return round(final_score, 4)
    
    def rank_routes(self, routes: List[Dict], weights: Optional[Dict] = None) -> List[Dict]:
        """
        Rank routes by composite score and return ordered list
        
        Args:
            routes: List of route dicts with distance_m, exposure, duration_s
            weights: Optional dict to override default weights
        
        Returns:
            List of routes sorted by score (best first), each with 'score' and 'rank' added
        """
        if not routes:
            return []
        
        # Override weights if provided
        if weights:
            self.weight_distance = weights.get('distance', self.weight_distance)
            self.weight_pollution = weights.get('pollution', self.weight_pollution)
            self.weight_traffic = weights.get('traffic', self.weight_traffic)
        
        # Find min/max for normalization
        distances = [r.get('distance_m', 0) for r in routes]
        exposures = [r.get('exposure', 0) for r in routes]
        durations = [r.get('duration_s', 0) for r in routes]
        
        min_dist, max_dist = min(distances), max(distances)
        min_exp, max_exp = min(exposures), max(exposures)
        min_dur, max_dur = min(durations), max(durations)
        
        # Score each route
        scored_routes = []
        for route in routes:
            score = self.score_route(
                route,
                min_dist, max_dist,
                min_exp, max_exp,
                min_dur, max_dur
            )
            route_copy = route.copy()
            route_copy['score'] = score
            scored_routes.append(route_copy)
        
        # Sort by score (lower is better)
        scored_routes.sort(key=lambda x: x['score'])
        
        # Add rank
        for idx, route in enumerate(scored_routes):
            route['rank'] = idx + 1
        
        logger.info(f"Ranked {len(scored_routes)} routes, best score: {scored_routes[0]['score']}")
        return scored_routes

