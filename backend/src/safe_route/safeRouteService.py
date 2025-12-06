"""
Safe Route Service - Python service wrapper for Node.js integration
This service can be called from Node.js via subprocess or HTTP
"""
import sys
import os
import json
import logging
from pathlib import Path

# Add safe_route directory to path for proper module resolution
current_dir = Path(__file__).parent.absolute()
routing_engine_dir = current_dir / 'routing_engine'

# Add both directories to path
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(routing_engine_dir))

# Import routing engine modules
# Note: Modules use relative imports, so we import them directly
# The routing_engine directory acts as a package
try:
    # Try importing as a package first
    import routing_engine
    from routing_engine.google_client import GoogleClient
    from routing_engine.aqi_grid_loader import AQIGridLoader
    from routing_engine.route_segmentation import RouteSegmenter
    from routing_engine.exposure import ExposureCalculator
    from routing_engine.scoring import RouteScorer
    from routing_engine.colorizer import RouteColorizer
    from routing_engine.cache import RouteCache
except ImportError:
    # Fallback: Import modules directly using importlib
    import importlib.util
    
    def load_module(name, file_path):
        """Load a module from file path"""
        spec = importlib.util.spec_from_file_location(name, file_path)
        module = importlib.util.module_from_spec(spec)
        # Register in sys.modules for relative imports
        sys.modules[name] = module
        sys.modules[f'routing_engine.{name}'] = module
        spec.loader.exec_module(module)
        return module
    
    # Load utils first (needed by other modules)
    utils_path = routing_engine_dir / 'utils.py'
    utils_module = load_module('utils', utils_path)
    sys.modules['routing_engine.utils'] = utils_module
    
    # Load other modules
    GoogleClient = load_module('google_client', routing_engine_dir / 'google_client.py').GoogleClient
    AQIGridLoader = load_module('aqi_grid_loader', routing_engine_dir / 'aqi_grid_loader.py').AQIGridLoader
    RouteSegmenter = load_module('route_segmentation', routing_engine_dir / 'route_segmentation.py').RouteSegmenter
    ExposureCalculator = load_module('exposure', routing_engine_dir / 'exposure.py').ExposureCalculator
    RouteScorer = load_module('scoring', routing_engine_dir / 'scoring.py').RouteScorer
    RouteColorizer = load_module('colorizer', routing_engine_dir / 'colorizer.py').RouteColorizer
    RouteCache = load_module('cache', routing_engine_dir / 'cache.py').RouteCache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
google_client = None
aqi_loader = None
route_segmenter = None
exposure_calc = ExposureCalculator()
route_scorer = RouteScorer()
route_cache = None

def initialize_service():
    """Initialize the safe route service with environment variables"""
    global google_client, aqi_loader, route_segmenter, route_cache
    
    try:
        # Get environment variables (from Node.js .env)
        api_key_raw = os.getenv("GOOGLE_MAPS_API_KEY", "")
        api_key = api_key_raw.strip() if api_key_raw else ""
        
        # Debug logging (without exposing full key)
        logger.info(f"Python: Received GOOGLE_MAPS_API_KEY, length: {len(api_key_raw) if api_key_raw else 0}")
        logger.info(f"Python: After strip, length: {len(api_key)}")
        
        if not api_key:
            error_msg = "GOOGLE_MAPS_API_KEY not set or empty. Please set it in backend/.env file."
            logger.error(error_msg)
            logger.error(f"Environment variable GOOGLE_MAPS_API_KEY raw value length: {len(api_key_raw) if api_key_raw else 0}")
            logger.error(f"All env vars containing 'GOOGLE': {[k for k in os.environ.keys() if 'GOOGLE' in k.upper()]}")
            print(json.dumps({"success": False, "error": error_msg}), file=sys.stderr)
            return False
        
        google_client = GoogleClient(api_key)
        
        # Initialize AQI loader with MongoDB URI from environment
        mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/delhi_breathes"
        aqi_loader = AQIGridLoader(mongo_uri)
        try:
            aqi_loader.initialize(build_kdtree=True)
        except Exception as e:
            logger.warning(f"Failed to initialize AQI grid (may not have data): {e}")
            # Continue anyway - service can work without AQI grid
        
        # Initialize route segmenter
        segment_length = float(os.getenv("ROUTE_SEGMENT_LENGTH_M", "15.0"))
        route_segmenter = RouteSegmenter(aqi_loader, google_client, segment_length)
        
        # Initialize cache with Redis URL from environment
        redis_url = os.getenv("REDIS_URL") or "redis://localhost:6379"
        cache_ttl = int(os.getenv("CACHE_TTL_SECONDS", "300"))
        try:
            route_cache = RouteCache(redis_url, cache_ttl)
        except Exception as e:
            logger.warning(f"Redis cache not available (caching disabled): {e}")
            route_cache = None  # Continue without cache
        
        logger.info("Safe Route Service initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Safe Route Service: {e}", exc_info=True)
        return False

def get_safe_route(source_lat, source_lng, dest_lat, dest_lng, weight_distance=0.6, weight_pollution=0.3, weight_traffic=0.1):
    """
    Get safe route - main function called from Node.js
    
    Returns JSON-serializable dict with route data
    """
    try:
        if not google_client:
            return {
                "success": False,
                "error": "Google Maps API key not configured"
            }
        
        # Check rate limiting
        client_ip = "unknown"  # Will be set by Node.js layer
        if route_cache and not route_cache.check_rate_limit(client_ip, max_requests=10):
            return {
                "success": False,
                "error": "Rate limit exceeded"
            }
        
        # Build cache key
        weights = {
            'distance': weight_distance,
            'pollution': weight_pollution,
            'traffic': weight_traffic
        }
        cache_key = route_cache.cache_key_for_route(
            source_lat, source_lng, dest_lat, dest_lng, weights
        )
        
        # Check cache
        cached_result = route_cache.get(cache_key) if route_cache else None
        if cached_result:
            logger.info(f"Returning cached route for {cache_key}")
            return {
                "success": True,
                "data": cached_result,
                "cached": True
            }
        
        # Get directions from Google
        source = (float(source_lat), float(source_lng))
        destination = (float(dest_lat), float(dest_lng))
        try:
            routes = google_client.get_directions(source, destination, alternatives=3)
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to get directions: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
        
        if not routes:
            return {
                "success": False,
                "error": "No routes found between the specified locations"
            }
        
        # Process each route
        processed_routes = []
        for route in routes:
            segments = route_segmenter.segment_route(route)
            if not segments:
                continue
            
            exposure_data = exposure_calc.calculate_time_weighted_exposure(segments)
            colorized = RouteColorizer.colorize_route(segments)
            
            route_data = {
                'route_id': route['route_id'],
                'distance_m': route['distance_m'],
                'duration_s': route['duration_s'],
                'summary': route.get('summary', ''),
                'exposure': exposure_data['pm25_exposure'],
                'exposure_data': exposure_data,
                'segments': segments,
                'polylines_by_color': colorized['polylines_by_color'],
                'color_stats': colorized['color_stats'],
                'steps': route.get('steps', [])
            }
            processed_routes.append(route_data)
        
        if not processed_routes:
            return {
                "success": False,
                "error": "Failed to process routes"
            }
        
        # Rank routes using combined scoring:
        # score = (exposure * 0.7) + (distance_km * 0.3)
        ranked_routes = []
        for route in processed_routes:
            distance_km = route['distance_m'] / 1000.0
            exposure_val = route['exposure']
            score = (0.7 * exposure_val) + (0.3 * distance_km)
            route_with_score = route.copy()
            route_with_score['distance_km'] = distance_km
            route_with_score['duration_min'] = route['duration_s'] / 60.0
            route_with_score['score'] = round(score, 4)
            ranked_routes.append(route_with_score)

        # Sort by score (lower is better)
        ranked_routes.sort(key=lambda r: r['score'])
        recommended_route = ranked_routes[0]
        
        # Calculate comparison metrics
        fastest_route = min(processed_routes, key=lambda x: x['duration_s'])
        exposure_reduction = fastest_route['exposure'] - recommended_route['exposure']
        exposure_reduction_pct = (exposure_reduction / fastest_route['exposure'] * 100) if fastest_route['exposure'] > 0 else 0
        distance_diff = recommended_route['distance_m'] - fastest_route['distance_m']
        distance_diff_pct = (distance_diff / fastest_route['distance_m'] * 100) if fastest_route['distance_m'] > 0 else 0
        time_diff = recommended_route['duration_s'] - fastest_route['duration_s']
        
        reason = f"Exposure {exposure_reduction_pct:.1f}% lower"
        if distance_diff > 0:
            reason += f"; distance {distance_diff_pct:.1f}% longer"
        if time_diff > 0:
            reason += f"; {time_diff/60:.1f} min longer"
        
        result = {
            'recommended_route': recommended_route,
            'all_routes': ranked_routes,
            'reason': reason,
            'comparison': {
                'exposure_reduction_pct': round(exposure_reduction_pct, 2),
                'distance_diff_pct': round(distance_diff_pct, 2),
                'time_diff_seconds': round(time_diff, 2),
                'fastest_route_id': fastest_route['route_id']
            }
        }
        
        # Cache result
        if route_cache:
            route_cache.set(cache_key, result)
        
        return {
            "success": True,
            "data": result,
            "cached": False
        }
        
    except Exception as e:
        logger.error(f"Error processing route: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }

# Initialize on import
if __name__ != "__main__":
    initialize_service()

# CLI interface for Node.js subprocess calls
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Invalid arguments"}), file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "init":
        result = initialize_service()
        print(json.dumps({"success": result}))
    elif command == "route":
        # Initialize service first if not already initialized
        if not google_client or not aqi_loader:
            init_result = initialize_service()
            if not init_result:
                print(json.dumps({"success": False, "error": "Failed to initialize service"}), file=sys.stderr)
                sys.exit(1)
        
        if len(sys.argv) < 7:
            print(json.dumps({"success": False, "error": "Missing route parameters"}), file=sys.stderr)
            sys.exit(1)
        
        try:
            source_lat = float(sys.argv[2])
            source_lng = float(sys.argv[3])
            dest_lat = float(sys.argv[4])
            dest_lng = float(sys.argv[5])
            weight_distance = float(sys.argv[6]) if len(sys.argv) > 6 else 0.6
            weight_pollution = float(sys.argv[7]) if len(sys.argv) > 7 else 0.3
            weight_traffic = float(sys.argv[8]) if len(sys.argv) > 8 else 0.1
            
            result = get_safe_route(source_lat, source_lng, dest_lat, dest_lng, weight_distance, weight_pollution, weight_traffic)
            print(json.dumps(result))
        except ValueError as e:
            print(json.dumps({"success": False, "error": f"Invalid parameter format: {str(e)}"}), file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            logger.exception("Error in route command")
            print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
            sys.exit(1)
    else:
        print(json.dumps({"success": False, "error": "Unknown command"}), file=sys.stderr)
        sys.exit(1)

