"""
AQI Grid Loader
Loads AQI data from MongoDB with geospatial queries and optional KD-tree caching
"""
import os
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.collection import Collection
import numpy as np
from scipy.spatial import cKDTree

logger = logging.getLogger(__name__)

class AQIGridLoader:
    """Loads AQI data from MongoDB aqi_grid collection with geospatial indexing"""
    
    def __init__(self, mongo_uri: str, cache_ttl: int = 300):
        self.mongo_uri = mongo_uri
        self.cache_ttl = cache_ttl
        self.client: Optional[MongoClient] = None
        self.db = None
        self.collection: Optional[Collection] = None
        self.kdtree: Optional[cKDTree] = None
        self.kdtree_data: list = []
        self.kdtree_updated: Optional[datetime] = None
        
    def connect(self):
        """Connect to MongoDB and ensure geospatial index exists"""
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client.get_database()
            self.collection = self.db.aqi_grid
            
            # Ensure geospatial index on location field
            try:
                self.collection.create_index([("loc", "2dsphere")])
                logger.info("Geospatial index on 'loc' field created/verified")
            except Exception as e:
                logger.warning(f"Index creation warning (may already exist): {e}")
            
            # Test connection
            self.client.admin.command('ping')
            logger.info("Connected to MongoDB for AQI grid")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def _build_kdtree(self):
        """Build in-memory KD-tree for fast nearest neighbor lookup"""
        try:
            # Fetch all grid points
            cursor = self.collection.find(
                {"loc": {"$exists": True}},
                {"loc": 1, "aqi": 1, "pm25": 1, "forecast_1hr": 1, "updated_at": 1}
            )
            
            points = []
            data = []
            
            for doc in cursor:
                if 'loc' in doc and isinstance(doc['loc'], dict):
                    coords = doc['loc'].get('coordinates', [])
                    if len(coords) >= 2:
                        # MongoDB GeoJSON: [lng, lat]
                        lng, lat = coords[0], coords[1]
                        points.append([lat, lng])
                        data.append({
                            'aqi': doc.get('aqi', 0),
                            'pm25': doc.get('pm25', 0),
                            'forecast_1hr': doc.get('forecast_1hr', doc.get('aqi', 0)),
                            'updated_at': doc.get('updated_at', datetime.now())
                        })
            
            if points:
                self.kdtree = cKDTree(points)
                self.kdtree_data = data
                self.kdtree_updated = datetime.now()
                logger.info(f"Built KD-tree with {len(points)} AQI grid points")
            else:
                logger.warning("No AQI grid points found in database")
                
        except Exception as e:
            logger.error(f"Failed to build KD-tree: {e}")
            self.kdtree = None
    
    def get_nearest_aqi(self, lat: float, lng: float, use_kdtree: bool = True) -> Dict:
        """
        Get nearest AQI data point for given coordinates
        
        Args:
            lat: Latitude
            lng: Longitude
            use_kdtree: Use in-memory KD-tree if available (faster)
        
        Returns:
            Dict with keys: aqi, pm25, forecast_1hr, updated_at
        """
        # Check if KD-tree needs refresh (older than cache_ttl)
        if self.kdtree and self.kdtree_updated:
            age = (datetime.now() - self.kdtree_updated).total_seconds()
            if age > self.cache_ttl:
                logger.info("KD-tree cache expired, rebuilding...")
                self._build_kdtree()
        
        # Try KD-tree first if enabled
        if use_kdtree and self.kdtree and self.kdtree_data:
            try:
                dist, idx = self.kdtree.query([lat, lng], k=1)
                if idx < len(self.kdtree_data):
                    result = self.kdtree_data[idx].copy()
                    result['distance_m'] = dist * 111000  # Approximate meters
                    return result
            except Exception as e:
                logger.warning(f"KD-tree lookup failed, falling back to MongoDB: {e}")
        
        # Fallback to MongoDB geospatial query
        try:
            if not self.collection:
                self.connect()
            
            # MongoDB GeoJSON format: {type: "Point", coordinates: [lng, lat]}
            query = {
                "loc": {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [lng, lat]
                        },
                        "$maxDistance": 5000  # 5km max
                    }
                }
            }
            
            result = self.collection.find_one(query)
            
            if result:
                return {
                    'aqi': result.get('aqi', 0),
                    'pm25': result.get('pm25', 0),
                    'forecast_1hr': result.get('forecast_1hr', result.get('aqi', 0)),
                    'updated_at': result.get('updated_at', datetime.now()),
                    'distance_m': 0  # MongoDB doesn't return distance in find_one
                }
            else:
                # Return default values if no data found
                logger.warning(f"No AQI data found near ({lat}, {lng})")
                return {
                    'aqi': 100,  # Moderate default
                    'pm25': 50,
                    'forecast_1hr': 100,
                    'updated_at': datetime.now(),
                    'distance_m': 0
                }
                
        except Exception as e:
            logger.error(f"Failed to query AQI from MongoDB: {e}")
            # Return safe defaults
            return {
                'aqi': 100,
                'pm25': 50,
                'forecast_1hr': 100,
                'updated_at': datetime.now(),
                'distance_m': 0
            }
    
    def initialize(self, build_kdtree: bool = True):
        """Initialize connection and optionally build KD-tree"""
        try:
            self.connect()
            if build_kdtree:
                self._build_kdtree()
        except Exception as e:
            logger.warning(f"Failed to initialize AQI grid loader: {e}. Service will continue with default AQI values.")
            # Set defaults so service can still work
            self.kdtree = None
            self.kdtree_data = []
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

