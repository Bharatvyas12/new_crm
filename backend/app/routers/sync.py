import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Body, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/sync", tags=["sync"])

# Path for persistent JSON storage on backend
STORE_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "crm_cloud_store.json")

# In-memory store cache for high throughput
_store_cache: Dict[str, Any] = {}
_store_version: int = 1
_store_updated_at: str = datetime.now(timezone.utc).isoformat()


def _get_initial_clean_store() -> Dict[str, Any]:
    today_str = datetime.now().strftime("%b %d, %Y")
    return {
        "settings": {
            "shopName": "Vyas Enterprises & Wholesale Hub",
            "ownerName": "Bharat Vyas",
            "phone": "9829012345",
            "email": "contact@vyasenterprises.com",
            "address": "Plot 42, Wholesale Trade Center, Ring Road",
            "latitude": 26.9124,
            "longitude": 75.7873,
            "geofenceRadiusM": 200,
            "shiftStart": "09:00",
            "shiftEnd": "19:00",
            "requiredDailyHours": 10,
            "gracePeriodMinutes": 15,
            "qrRotationSeconds": 45,
            "lastUpdated": today_str,
        },
        "activeShifts": {},
        "employees": [
            {
                "id": "1",
                "code": "ADMIN001",
                "name": "System Administrator",
                "email": "admin@crm.com",
                "department": "Management",
                "designation": "Administrator",
                "type": "Full Time",
                "status": "Active",
                "joined": "Oct 01, 2026",
                "phone": "9999999999",
                "initialPassword": "admin123",
                "baseSalary": 75000,
                "bankAccount": "987654321098",
                "bankIfsc": "HDFC0001234",
                "upiId": "admin@okhdfc",
                "casualLeaves": 12,
                "sickLeaves": 8,
            },
            {
                "id": "2",
                "code": "E001",
                "name": "Bharat vyas",
                "email": "bharat1@crm.com",
                "department": "Operations",
                "designation": "Supervisor",
                "type": "Full Time",
                "status": "Active",
                "joined": "Oct 01, 2026",
                "phone": "08005567626",
                "initialPassword": "Emp@2026",
                "baseSalary": 35000,
                "bankAccount": "112233445566",
                "bankIfsc": "SBIN0004321",
                "upiId": "bharat@oksbi",
                "casualLeaves": 8,
                "sickLeaves": 6.5,
            },
            {
                "id": "3",
                "code": "EMP002",
                "name": "Priya Sharma",
                "email": "priya@crm.com",
                "department": "Sales",
                "designation": "Senior Sales Lead",
                "type": "Full Time",
                "status": "Active",
                "joined": "Jan 15, 2025",
                "phone": "9876501234",
                "initialPassword": "Emp@2026",
                "baseSalary": 32000,
                "bankAccount": "998877665544",
                "bankIfsc": "HDFC0001234",
                "upiId": "priya@okhdfc",
                "casualLeaves": 10,
                "sickLeaves": 8,
            },
        ],
        "advances": [],
        "ledger": [],
        "orders": [],
        "tasks": [],
        "attendance": [],
        "corrections": [],
        "leaves": [],
        "complaints": [],
    }


def _load_store_from_disk():
    global _store_cache, _store_version, _store_updated_at
    if os.path.exists(STORE_FILE_PATH):
        try:
            with open(STORE_FILE_PATH, "r", encoding="utf-8") as f:
                payload = json.load(f)
                _store_cache = payload.get("data", _get_initial_clean_store())
                _store_version = payload.get("version", 1)
                _store_updated_at = payload.get("updated_at", datetime.now(timezone.utc).isoformat())
                return
        except Exception as e:
            print(f"[Sync] Error reading store from disk: {e}")
    
    # Initialize defaults
    _store_cache = _get_initial_clean_store()
    _store_version = 1
    _store_updated_at = datetime.now(timezone.utc).isoformat()
    _save_store_to_disk()


def _save_store_to_disk():
    try:
        payload = {
            "version": _store_version,
            "updated_at": _store_updated_at,
            "data": _store_cache,
        }
        with open(STORE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
    except Exception as e:
        print(f"[Sync] Error saving store to disk: {e}")


# Initialize store on module load
_load_store_from_disk()


class SyncPushPayload(BaseModel):
    data: Dict[str, Any]
    client_version: Optional[int] = None
    client_id: Optional[str] = None


@router.get("/store")
async def get_cloud_store():
    """Returns the latest real-time CRM store and version."""
    return {
        "status": "ok",
        "version": _store_version,
        "updated_at": _store_updated_at,
        "data": _store_cache,
    }


@router.get("/version")
async def get_cloud_store_version():
    """Ultra-fast ping to check if client is up to date."""
    return {
        "version": _store_version,
        "updated_at": _store_updated_at,
    }


@router.post("/store")
async def update_cloud_store(payload: SyncPushPayload):
    """Atomically updates the cloud store and broadcasts new version."""
    global _store_cache, _store_version, _store_updated_at
    
    incoming_data = payload.data
    if not isinstance(incoming_data, dict):
        raise HTTPException(status_code=400, detail="Invalid data payload")
    
    # Merge / Replace store cache
    _store_cache = incoming_data
    _store_version += 1
    _store_updated_at = datetime.now(timezone.utc).isoformat()
    
    # Persist to disk
    _save_store_to_disk()
    
    return {
        "status": "ok",
        "version": _store_version,
        "updated_at": _store_updated_at,
    }


@router.post("/reset")
async def reset_cloud_store():
    """Resets the cloud store to clean baseline state."""
    global _store_cache, _store_version, _store_updated_at
    _store_cache = _get_initial_clean_store()
    _store_version += 1
    _store_updated_at = datetime.now(timezone.utc).isoformat()
    _save_store_to_disk()
    return {
        "status": "ok",
        "version": _store_version,
        "updated_at": _store_updated_at,
        "data": _store_cache,
    }
