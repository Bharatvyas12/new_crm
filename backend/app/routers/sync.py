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
            }
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
                data = payload.get("data", {})
                if isinstance(data, dict) and "employees" in data:
                    _store_cache = data
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


async def load_store_from_postgres() -> bool:
    """Loads latest sync store from persistent PostgreSQL table if available."""
    global _store_cache, _store_version, _store_updated_at
    try:
        from app.database import AsyncSessionLocal, CloudSyncStore
        from sqlalchemy import select
        async with AsyncSessionLocal() as session:
            stmt = select(CloudSyncStore).where(CloudSyncStore.id == "default")
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()
            if record and isinstance(record.data, dict) and "employees" in record.data:
                _store_cache = record.data
                _store_version = record.version
                _store_updated_at = record.updated_at
                print(f"[Sync-Postgres] Successfully loaded store v{_store_version} from database.")
                return True
    except Exception as e:
        # Fallback to in-memory/disk store gracefully
        print(f"[Sync-Postgres] Postgres read note: {e}")
    return False


async def save_store_to_postgres() -> bool:
    """Saves sync store to persistent PostgreSQL table."""
    global _store_cache, _store_version, _store_updated_at
    try:
        from app.database import AsyncSessionLocal, CloudSyncStore
        from sqlalchemy import select
        async with AsyncSessionLocal() as session:
            stmt = select(CloudSyncStore).where(CloudSyncStore.id == "default")
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()
            if not record:
                record = CloudSyncStore(
                    id="default",
                    version=_store_version,
                    updated_at=_store_updated_at,
                    data=_store_cache
                )
                session.add(record)
            else:
                record.version = _store_version
                record.updated_at = _store_updated_at
                record.data = _store_cache
            await session.commit()
            print(f"[Sync-Postgres] Successfully persisted store v{_store_version} to PostgreSQL database.")
            return True
    except Exception as e:
        print(f"[Sync-Postgres] Postgres write error: {e}")
    return False


# Initialize store on module load
_load_store_from_disk()


def _merge_item_lists(existing_list: list, incoming_list: list, key_field: str = "id", deleted_ids: Optional[list] = None) -> list:
    """
    Intelligently merges two lists of dicts by ID without losing data from either device.
    If an item has the same ID, incoming overrides existing.
    Items present in existing but absent in incoming are preserved.
    Items in deleted_ids or marked isDeleted are filtered out.
    """
    if not isinstance(existing_list, list):
        existing_list = []
    if not isinstance(incoming_list, list):
        incoming_list = []
    del_set = set(str(d) for d in (deleted_ids or []))

    merged_map = {}
    
    # 1. Load existing items
    for item in existing_list:
        if isinstance(item, dict):
            item_id = str(item.get(key_field) or item.get("code") or item.get("id") or "")
            if item_id and item_id not in del_set and not item.get("isDeleted"):
                merged_map[item_id] = item

    # 2. Overlay incoming items
    for item in incoming_list:
        if isinstance(item, dict):
            item_id = str(item.get(key_field) or item.get("code") or item.get("id") or "")
            if item_id:
                if item_id in del_set or item.get("isDeleted"):
                    merged_map.pop(item_id, None)
                else:
                    # Preserve high-res receiptPhoto if incoming omitted it
                    if item_id in merged_map and "receiptPhoto" in merged_map[item_id] and not item.get("receiptPhoto"):
                        item["receiptPhoto"] = merged_map[item_id]["receiptPhoto"]
                    merged_map[item_id] = item

    return list(merged_map.values())


def _merge_active_shifts(existing_shifts: dict, incoming_shifts: dict) -> dict:
    if not isinstance(existing_shifts, dict):
        existing_shifts = {}
    if not isinstance(incoming_shifts, dict):
        incoming_shifts = {}
    
    merged = dict(existing_shifts)
    for emp_code, shift in incoming_shifts.items():
        if isinstance(shift, dict):
            existing = merged.get(emp_code)
            if existing and isinstance(existing, dict):
                incoming_ts = shift.get("checkInTimestamp", 0)
                existing_ts = existing.get("checkInTimestamp", 0)
                if incoming_ts >= existing_ts:
                    merged[emp_code] = shift
            else:
                merged[emp_code] = shift
    return merged


class SyncPushPayload(BaseModel):
    data: Dict[str, Any]
    client_version: Optional[int] = None
    client_id: Optional[str] = None
    deleted_task_ids: Optional[list[str]] = None
    deleted_order_ids: Optional[list[str]] = None


@router.get("/db-status")
async def get_db_status():
    """Diagnostic check to confirm PostgreSQL connectivity and sync status."""
    from app.database import engine, CLEAN_DB_URL, AsyncSessionLocal, CloudSyncStore
    from sqlalchemy import select, text
    db_type = "postgresql" if "postgres" in CLEAN_DB_URL else "sqlite"
    connected = False
    error_msg = None
    pg_record = None

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            stmt = select(CloudSyncStore).where(CloudSyncStore.id == "default")
            res = await session.execute(stmt)
            row = res.scalar_one_or_none()
            if row:
                pg_record = {"version": row.version, "updated_at": row.updated_at, "keys": list(row.data.keys()) if row.data else []}
            connected = True
    except Exception as e:
        error_msg = str(e)

    return {
        "status": "ok" if connected else "error",
        "database_type": db_type,
        "is_connected": connected,
        "error": error_msg,
        "in_memory_version": _store_version,
        "postgres_record": pg_record,
    }


@router.get("/store")
async def get_cloud_store():
    """Returns the latest real-time CRM store and version."""
    await load_store_from_postgres()
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
    """Atomically updates the cloud store and broadcasts new version with multi-device union merge."""
    global _store_cache, _store_version, _store_updated_at
    
    incoming = payload.data
    if not isinstance(incoming, dict):
        raise HTTPException(status_code=400, detail="Invalid data payload")
    
    baseline = _get_initial_clean_store()

    # Pre-fetch latest from postgres if another instance/reboot occurred
    await load_store_from_postgres()
    
    # Merge active shifts
    merged_shifts = _merge_active_shifts(
        _store_cache.get("activeShifts", {}),
        incoming.get("activeShifts", {})
    )

    # Merge list collections intelligently without cross-device data loss
    merged_orders = _merge_item_lists(
        _store_cache.get("orders", []),
        incoming.get("orders", []),
        key_field="id",
        deleted_ids=payload.deleted_order_ids
    )
    merged_tasks = _merge_item_lists(
        _store_cache.get("tasks", []),
        incoming.get("tasks", []),
        key_field="id",
        deleted_ids=payload.deleted_task_ids
    )
    merged_attendance = _merge_item_lists(
        _store_cache.get("attendance", []),
        incoming.get("attendance", []),
        key_field="id"
    )
    merged_advances = _merge_item_lists(
        _store_cache.get("advances", []),
        incoming.get("advances", []),
        key_field="id"
    )
    merged_leaves = _merge_item_lists(
        _store_cache.get("leaves", []),
        incoming.get("leaves", []),
        key_field="id"
    )
    merged_corrections = _merge_item_lists(
        _store_cache.get("corrections", []),
        incoming.get("corrections", []),
        key_field="id"
    )
    merged_complaints = _merge_item_lists(
        _store_cache.get("complaints", []),
        incoming.get("complaints", []),
        key_field="id"
    )
    merged_ledger = _merge_item_lists(
        _store_cache.get("ledger", []),
        incoming.get("ledger", []),
        key_field="id"
    )
    merged_employees = _merge_item_lists(
        _store_cache.get("employees", baseline["employees"]),
        incoming.get("employees", []),
        key_field="code"
    )

    merged = {
        "settings": incoming.get("settings", _store_cache.get("settings", baseline["settings"])),
        "employees": merged_employees if merged_employees else baseline["employees"],
        "activeShifts": merged_shifts,
        "orders": merged_orders,
        "tasks": merged_tasks,
        "attendance": merged_attendance,
        "corrections": merged_corrections,
        "leaves": merged_leaves,
        "advances": merged_advances,
        "ledger": merged_ledger,
        "complaints": merged_complaints,
    }

    _store_cache = merged
    _store_version += 1
    _store_updated_at = datetime.now(timezone.utc).isoformat()
    
    # Persist to disk and PostgreSQL
    _save_store_to_disk()
    await save_store_to_postgres()
    
    return {
        "status": "ok",
        "version": _store_version,
        "updated_at": _store_updated_at,
        "data": _store_cache,
    }


@router.post("/reset")
async def reset_cloud_store():
    """Resets the cloud store to clean baseline state."""
    global _store_cache, _store_version, _store_updated_at
    _store_cache = _get_initial_clean_store()
    _store_version += 1
    _store_updated_at = datetime.now(timezone.utc).isoformat()
    _save_store_to_disk()
    await save_store_to_postgres()
    return {
        "status": "ok",
        "version": _store_version,
        "updated_at": _store_updated_at,
        "data": _store_cache,
    }
