# gamification_server.py
"""
Standalone FastAPI server for DelhiBreathes Gamification Engine.
Run this alongside the Node.js backend.
"""
import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager

# Add gamification_engine to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.gamification_routes import router as gamification_router
from api.alerts_routes import router as alerts_router
from gamification_engine.seed import seed_all

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Ensure JWT_SECRET is set (required for alerts authentication)
if not os.getenv("JWT_SECRET"):
    # Try to load from backend/.env if not in root .env
    backend_env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
    if os.path.exists(backend_env_path):
        from dotenv import dotenv_values
        backend_env = dotenv_values(backend_env_path)
        if backend_env.get("JWT_SECRET"):
            os.environ["JWT_SECRET"] = backend_env["JWT_SECRET"]
    
    # Set default if still not found
    if not os.getenv("JWT_SECRET"):
        default_secret = "localtestsecret"
        os.environ["JWT_SECRET"] = default_secret
        print(f"[WARN] JWT_SECRET not found in environment. Using default: {default_secret}")
        print("[INFO] For production, set JWT_SECRET in .env file")

# Also set VERIFICATION_TOKEN_SECRET if not present (for compatibility)
if not os.getenv("VERIFICATION_TOKEN_SECRET"):
    os.environ["VERIFICATION_TOKEN_SECRET"] = os.getenv("JWT_SECRET", "localtestsecret")

# MongoDB connection
mongo_client = None
db = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    global mongo_client, db
    
    # Startup
    print("[STARTUP] Starting Gamification Engine...")
    
    # Connect to MongoDB
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/delhi_breathes")
    print(f"[INFO] Connecting to MongoDB: {mongodb_uri}")
    
    try:
        mongo_client = AsyncIOMotorClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        db_name = mongodb_uri.split("/")[-1].split("?")[0]
        db = mongo_client[db_name]
        
        # Test connection with timeout
        await mongo_client.admin.command('ping')
        print("[OK] MongoDB connected successfully!")
        
        # Store db in app state
        app.state.db = db
        
        # Seed badges, rewards, and challenges
        print("[INFO] Seeding badges, rewards, and challenges...")
        await seed_all(db)
        print("[OK] Seeding complete!")
        
        # Create index for user_settings collection
        print("[INFO] Creating indexes for user_settings...")
        try:
            await db.user_settings.create_index("user_key", unique=True)
            print("[OK] Index created: user_settings.user_key (unique)")
        except Exception as e:
            print(f"[WARNING] Index creation failed (may already exist): {e}")
        
        print("\n" + "="*60)
        print("GAMIFICATION ENGINE READY")
        print("="*60)
        print(f"Server running on: http://localhost:8000")
        print(f"API Docs: http://localhost:8000/docs")
        print(f"ReDoc: http://localhost:8000/redoc")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        print("[WARNING] Make sure MongoDB is running!")
        print("[INFO] Server cannot start without database connection.")
        sys.exit(1)
    
    yield
    
    # Shutdown
    print("\n[SHUTDOWN] Shutting down Gamification Engine...")
    if mongo_client:
        mongo_client.close()
    print("[OK] Shutdown complete!")


# Create FastAPI app
app = FastAPI(
    title="DelhiBreathes Gamification Engine",
    description="Gamification system for DelhiBreathes SIH project",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(gamification_router)
app.include_router(alerts_router)

# Health check
@app.get("/")
async def root():
    return {
        "name": "DelhiBreathes Gamification Engine",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "event": "/gamification/event",
            "summary": "/gamification/summary",
            "leaderboard": "/gamification/leaderboard",
            "rewards": "/gamification/rewards",
            "redeem": "/gamification/redeem",
            "redemptions": "/gamification/redemptions",
            "alerts_enable": "/user/alerts/enable",
            "alerts_status": "/user/alerts/status",
            "alerts_disable": "/user/alerts/disable",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health(request: Request):
    """Health check endpoint."""
    try:
        db = request.app.state.db
        if db:
            await db.command('ping')
            return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
    return {"status": "unhealthy", "database": "disconnected"}


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("GAMIFICATION_PORT", 8000))
    host = os.getenv("GAMIFICATION_HOST", "0.0.0.0")
    
    print(f"\n[INFO] Starting Gamification Engine on {host}:{port}\n")
    
    uvicorn.run(
        "gamification_server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )

