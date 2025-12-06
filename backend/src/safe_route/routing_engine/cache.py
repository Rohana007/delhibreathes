"""
Redis Cache Wrapper
Caching for Google Directions API responses and computed routes
"""
import os
import json
import hashlib
import logging
from typing import Optional, Dict, Any
import redis
from redis.exceptions import ConnectionError, TimeoutError

logger = logging.getLogger(__name__)

class RouteCache:
    """Redis cache wrapper for route data"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379", default_ttl: int = 300):
        """
        Initialize Redis cache
        
        Args:
            redis_url: Redis connection URL
            default_ttl: Default TTL in seconds (5 minutes)
        """
        self.redis_url = redis_url
        self.default_ttl = default_ttl
        self.client: Optional[redis.Redis] = None
        self._connect()
    
    def _connect(self):
        """Connect to Redis"""
        try:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            # Test connection
            self.client.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except (ConnectionError, TimeoutError) as e:
            logger.warning(f"Redis connection failed: {e}. Caching disabled.")
            self.client = None
        except Exception as e:
            logger.error(f"Unexpected Redis error: {e}")
            self.client = None
    
    def cache_key_for_route(
        self,
        source_lat: float,
        source_lng: float,
        dest_lat: float,
        dest_lng: float,
        weights: Optional[Dict] = None
    ) -> str:
        """
        Generate cache key for route request
        
        Args:
            source_lat, source_lng: Source coordinates
            dest_lat, dest_lng: Destination coordinates
            weights: Optional scoring weights
        
        Returns:
            Cache key string
        """
        # Use explicit safe route key pattern with rounded coordinates
        origin_lat = round(source_lat, 4)
        origin_lng = round(source_lng, 4)
        dest_lat_r = round(dest_lat, 4)
        dest_lng_r = round(dest_lng, 4)

        key = f"safe_route:{origin_lat}:{origin_lng}:{dest_lat_r}:{dest_lng_r}"

        # Include weights hash to distinguish different scoring configurations
        if weights:
            weights_str = json.dumps(weights, sort_keys=True)
            suffix = hashlib.md5(weights_str.encode()).hexdigest()[:8]
            key = f"{key}:{suffix}"

        return key
    
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached value
        
        Args:
            key: Cache key
        
        Returns:
            Cached dict or None if not found
        """
        if not self.client:
            return None
        
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        
        return None
    
    def set(self, key: str, value: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """
        Set cached value
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: TTL in seconds (uses default if None)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.client:
            return False
        
        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value)
            self.client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete cached value"""
        if not self.client:
            return False
        
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Cache delete error: {e}")
            return False
    
    def increment_rate_counter(self, ip_address: str, window_seconds: int = 60) -> int:
        """
        Increment rate counter for IP address (simple token bucket)
        
        Args:
            ip_address: Client IP address
            window_seconds: Time window in seconds
        
        Returns:
            Current count for this window
        """
        if not self.client:
            return 0
        
        try:
            key = f"rate_limit:{ip_address}"
            count = self.client.incr(key)
            if count == 1:
                # Set expiration on first increment
                self.client.expire(key, window_seconds)
            return count
        except Exception as e:
            logger.warning(f"Rate counter error: {e}")
            return 0
    
    def check_rate_limit(self, ip_address: str, max_requests: int = 10) -> bool:
        """
        Check if IP has exceeded rate limit
        
        Args:
            ip_address: Client IP address
            max_requests: Maximum requests per window
        
        Returns:
            True if within limit, False if exceeded
        """
        count = self.increment_rate_counter(ip_address)
        return count <= max_requests

