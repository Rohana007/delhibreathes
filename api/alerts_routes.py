# api/alerts_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, Any
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import jwt
import os

router = APIRouter(prefix="/user/alerts", tags=["Alerts"])


def get_db(request: Request) -> AsyncIOMotorDatabase:
    """Get database from app state."""
    return request.app.state.db


async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Get current user from JWT token.
    Returns dict with email and/or user_id.
    """
    try:
        import jwt
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PyJWT library not installed. Install with: pip install PyJWT"
        )
    
    # Get Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        # Use the same JWT secret as the Node.js backend
        secret = os.getenv("JWT_SECRET") or os.getenv("VERIFICATION_TOKEN_SECRET")
        if not secret:
            # Fallback to default for local development
            secret = "localtestsecret"
            print(f"[WARN] JWT_SECRET not configured. Using default secret for local development.")
            print("[INFO] Set JWT_SECRET in .env file for production.")
        
        # Decode JWT token
        decoded = jwt.decode(token, secret, algorithms=["HS256"])
        
        # Extract user identifiers from token
        user_email = decoded.get("email") or decoded.get("userEmail")
        user_id = decoded.get("userId") or decoded.get("user_id")
        
        if not user_email and not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user identifier"
            )
        
        return {
            "email": user_email,
            "user_id": user_id,
            "user_key": user_email or user_id  # Use email as primary key, fallback to user_id
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )


class EnableAlerts(BaseModel):
    region: str
    health_category: str


@router.get("/status")
async def get_alert_status(
    user: Dict[str, Any] = Depends(get_current_user),
    request: Request = None
):
    """
    Get alerts status for the current user.
    Uses user_key (email or user_id) from JWT authentication.
    """
    db = get_db(request)
    user_key = user["user_key"]  # email or user_id
    
    try:
        doc = await db.user_settings.find_one({"user_key": user_key})
        
        if not doc:
            return {
                "alerts_enabled": False,
                "region": None,
                "health_category": None,
            }
        
        return {
            "alerts_enabled": doc.get("alerts_enabled", False),
            "region": doc.get("region"),
            "health_category": doc.get("health_category"),
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get alerts status: {str(e)}"
        )


@router.post("/enable")
async def enable_alerts(
    body: EnableAlerts,
    user: Dict[str, Any] = Depends(get_current_user),
    request: Request = None
):
    """
    Enable personalized alerts for a user.
    Uses user_key (email or user_id) from JWT authentication (no OTP required).
    """
    db = get_db(request)
    user_key = user["user_key"]  # email or user_id
    
    try:
        now = datetime.utcnow()
        
        # Upsert user settings
        await db.user_settings.update_one(
            {"user_key": user_key},
            {
                "$set": {
                    "alerts_enabled": True,
                    "region": body.region,
                    "health_category": body.health_category,
                    "updated_at": now
                },
                "$setOnInsert": {
                    "user_key": user_key,
                    "created_at": now
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "alerts_enabled": True,
            "region": body.region,
            "health_category": body.health_category,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enable alerts: {str(e)}"
        )


@router.post("/disable")
async def disable_alerts(
    user: Dict[str, Any] = Depends(get_current_user),
    request: Request = None
):
    """
    Disable personalized alerts for a user.
    Uses user_key (email or user_id) from JWT authentication.
    """
    db = get_db(request)
    user_key = user["user_key"]  # email or user_id
    
    try:
        now = datetime.utcnow()
        
        await db.user_settings.update_one(
            {"user_key": user_key},
            {
                "$set": {
                    "alerts_enabled": False,
                    "updated_at": now
                }
            }
        )
        
        return {
            "success": True,
            "alerts_enabled": False
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disable alerts: {str(e)}"
        )

