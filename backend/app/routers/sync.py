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
_push_subscriptions: Dict[str, Dict[str, Any]] = {}


def _get_initial_clean_store() -> Dict[str, Any]:
    today_str = datetime.now().strftime("%b %d, %Y")
    return {
        "settings": {
            "shopName": "Mahesh Enterprises (Tata Tiscon)",
            "ownerName": "somesh sharma",
            "phone": "9214843291",
            "email": "somesh9497@gmail.com",
            "address": "near tehsil office , kuchaman road , parbatsar 341512",
            "latitude": 26.893062,
            "longitude": 74.76912,
            "geofenceRadiusM": 10,
            "shiftStart": "08:00",
            "shiftEnd": "20:00",
            "requiredDailyHours": 12,
            "allowedBreakMinutes": 60,
            "gracePeriodMinutes": 20,
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
                        "sickLeaves": 8
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
                        "joined": "Oct 06, 2026",
                        "phone": "08005567626",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 35000,
                        "bankAccount": "112233445566",
                        "bankIfsc": "SBIN0004321",
                        "upiId": "bharat@oksbi",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1791725684341",
                        "code": "E002",
                        "name": "somesh sharma",
                        "email": "somesh9497@gmail.com",
                        "department": "Operations",
                        "designation": "Supervisor",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 11, 2026",
                        "phone": "7878999502",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 10,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1791724305953",
                        "code": "E010",
                        "name": "DASHRATH SINGH",
                        "email": "pbcpbc8066@gmail.com",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 11, 2026",
                        "phone": "8003037662",
                        "initialPassword": "Dashrath@1234",
                        "baseSalary": 15500,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1791724537706",
                        "code": "E009",
                        "name": "Shiv prasad gaur",
                        "email": "shivasharmapbc@gmail.com",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 11, 2026",
                        "phone": "6350026162",
                        "initialPassword": "Dalpat@1234",
                        "baseSalary": 15000,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1791725001655",
                        "code": "E008",
                        "name": "yashwant prajapat",
                        "email": "yash6094raj@gmail.com",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 11, 2026",
                        "phone": "9587292722",
                        "initialPassword": "Yashwant@1234",
                        "baseSalary": 20000,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1791725535511",
                        "code": "E004",
                        "name": "Sunil kachawa",
                        "email": "ajjukachchhawa@gmail.com",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 11, 2026",
                        "phone": "7790907655",
                        "initialPassword": "Sunil@1234",
                        "baseSalary": 15500,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1791797390214",
                        "code": "EMPPAS15",
                        "name": "daulat malakara",
                        "email": "daulat2256@gmail.com",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 12, 2026",
                        "phone": "8949947250",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 16500,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1792064000053",
                        "code": "R001",
                        "name": "RAHUL NAYAK",
                        "email": "RAHUL@GMAIL.COM",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 15, 2026",
                        "phone": "—",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 15000,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1792064404787",
                        "code": "EMP09",
                        "name": "LAL CHAND",
                        "email": "LAL@GMAIL.COM",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 15, 2026",
                        "phone": "—",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 28000,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1792064480091",
                        "code": "EMP20",
                        "name": "SHAITAN",
                        "email": "SHAITAN@GMAIL.COM",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 15, 2026",
                        "phone": "—",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 28000,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1792067186918",
                        "code": "EMP30",
                        "name": "DINESH",
                        "email": "DINU@GMAIL.COM",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 15, 2026",
                        "phone": "—",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 28000,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1792137600076",
                        "code": "EMP50",
                        "name": "Pawan kumar",
                        "email": "pawan@gmail.com",
                        "department": "Operations",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 16, 2026",
                        "phone": "—",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 28000,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
            },
            {
                        "id": "1792210088389",
                        "code": "EMP035",
                        "name": "Tikam banjara",
                        "email": "tikambanjara375@gmail.com",
                        "department": "Delivery",
                        "designation": "Staff",
                        "type": "Full Time",
                        "status": "Active",
                        "joined": "Oct 17, 2026",
                        "phone": "9157358865",
                        "initialPassword": "Emp@2026",
                        "baseSalary": 28000,
                        "bankAccount": "",
                        "bankIfsc": "",
                        "upiId": "",
                        "casualLeaves": 12,
                        "sickLeaves": 8
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
        "deletedOrderIds": [],
        "roles": [
            {"id": "1", "name": "ADMIN", "isAdmin": True, "usersCount": 1, "permissions": ["*"]},
            {"id": "2", "name": "SUPERVISOR", "isAdmin": False, "usersCount": 3, "permissions": ["attendance.read.all", "attendance.qr.generate", "attendance.corrections.approve", "orders.read.all", "orders.broadcast", "orders.edit", "tasks.create", "tasks.review", "leaves.read.all", "leaves.approve"]},
            {"id": "3", "name": "EMPLOYEE", "isAdmin": False, "usersCount": 18, "permissions": ["attendance.checkin.self", "orders.claim", "orders.read.self", "orders.broadcast", "tasks.read.self", "tasks.submit.self", "leaves.apply.self", "ledger.read.self"]},
            {"id": "4", "name": "ACCOUNTS_LEAD", "isAdmin": False, "usersCount": 2, "permissions": ["attendance.read.all", "ledger.read.all", "ledger.post_entry", "payroll.run", "payroll.approve", "leaves.read.all"]},
            {"id": "5", "name": "DISPATCH_MANAGER", "isAdmin": False, "usersCount": 2, "permissions": ["orders.read.all", "orders.broadcast", "orders.edit", "orders.pod.verify", "attendance.read.all"]}
        ],
    }



def _sanitize_orders(orders_list: list) -> list:
    """Shrinks any oversized receiptPhoto (e.g. > 200KB raw base64) to prevent cloud sync stall."""
    if not isinstance(orders_list, list):
        return []
    cleaned = []
    for item in orders_list:
        if isinstance(item, dict):
            item_copy = dict(item)
            photo = item_copy.get("receiptPhoto")
            if photo and isinstance(photo, str) and len(photo) > 200000:
                item_copy["receiptPhoto"] = "uploaded_parchi.jpg"
            photos = item_copy.get("receiptPhotos")
            if isinstance(photos, list):
                item_copy["receiptPhotos"] = [
                    p if (isinstance(p, str) and len(p) <= 200000) else "uploaded_parchi.jpg"
                    for p in photos
                ]
            cleaned.append(item_copy)
    return cleaned


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


def _load_store_from_disk():
    global _store_cache, _store_version, _store_updated_at
    if os.path.exists(STORE_FILE_PATH):
        try:
            with open(STORE_FILE_PATH, "r", encoding="utf-8") as f:
                payload = json.load(f)
                data = payload.get("data", {})
                if isinstance(data, dict):
                    if isinstance(data.get("orders"), list):
                        data["orders"] = _sanitize_orders(data["orders"])
                    if not data.get("employees") or not isinstance(data.get("employees"), list) or len(data.get("employees")) == 0:
                        data["employees"] = _get_initial_clean_store()["employees"]
                    _store_cache = data
                    _store_version = payload.get("version", 1)
                    _store_updated_at = payload.get("updated_at", datetime.now(timezone.utc).isoformat())
                    subs = data.get("_push_subscriptions")
                    if isinstance(subs, dict):
                        _push_subscriptions.update(subs)
                    return
        except Exception as e:
            print(f"[Sync] Error reading store from disk: {e}")
    
    # Initialize defaults
    _store_cache = _get_initial_clean_store()
    _store_version = 1
    _store_updated_at = datetime.now(timezone.utc).isoformat()
    _save_store_to_disk()


# Initialize store cache immediately upon module loading
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

    for item in existing_list:
        if isinstance(item, dict):
            item_id = str(item.get(key_field) or item.get("code") or item.get("id") or "")
            if item_id and item_id not in del_set and not item.get("isDeleted"):
                merged_map[item_id] = item

    for item in incoming_list:
        if isinstance(item, dict):
            item_id = str(item.get(key_field) or item.get("code") or item.get("id") or "")
            if item_id:
                if item_id in del_set or item.get("isDeleted"):
                    merged_map.pop(item_id, None)
                else:
                    if item_id in merged_map and "receiptPhoto" in merged_map[item_id] and not item.get("receiptPhoto"):
                        item["receiptPhoto"] = merged_map[item_id]["receiptPhoto"]
                    merged_map[item_id] = item

    items = list(merged_map.values())
    if any("orderCode" in it or "itemsCount" in it for it in items if isinstance(it, dict)):
        def _get_sort_key(it):
            if not isinstance(it, dict):
                return 0.0
            if isinstance(it.get("_updatedTimestamp"), (int, float)):
                return float(it["_updatedTimestamp"])
            if isinstance(it.get("_createdTimestamp"), (int, float)):
                return float(it["_createdTimestamp"])
            code_num = "".join(filter(str.isdigit, str(it.get("orderCode") or it.get("id") or "")))
            return float(code_num) if code_num else 0.0
        items.sort(key=_get_sort_key, reverse=True)
    return items


async def load_store_from_postgres() -> bool:
    """Loads latest sync store from persistent PostgreSQL table if available, union-merging safely."""
    global _store_cache, _store_version, _store_updated_at, _push_subscriptions
    try:
        from app.database import AsyncSessionLocal, CloudSyncStore
        from sqlalchemy import select
        async with AsyncSessionLocal() as session:
            stmt = select(CloudSyncStore).where(CloudSyncStore.id == "default")
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()
            if record and isinstance(record.data, dict):
                pg_data = record.data
                merged_orders = _merge_item_lists(
                    _store_cache.get("orders", []),
                    pg_data.get("orders", []),
                    key_field="id"
                )
                merged_employees = _merge_item_lists(
                    _store_cache.get("employees", []),
                    pg_data.get("employees", []),
                    key_field="code"
                )
                merged_attendance = _merge_item_lists(
                    _store_cache.get("attendance", []),
                    pg_data.get("attendance", []),
                    key_field="id"
                )
                merged_shifts = {
                    **pg_data.get("activeShifts", {}),
                    **_store_cache.get("activeShifts", {}),
                }

                _store_cache = {
                    **pg_data,
                    **_store_cache,
                    "orders": _sanitize_orders(merged_orders),
                    "employees": merged_employees if merged_employees else _store_cache.get("employees", []),
                    "attendance": merged_attendance,
                    "activeShifts": merged_shifts,
                    "settings": {**(pg_data.get("settings") or {}), **(_store_cache.get("settings") or {})},
                }
                _store_version = max(_store_version, record.version or 1)
                _store_updated_at = record.updated_at or _store_updated_at

                subs = pg_data.get("_push_subscriptions")
                if isinstance(subs, dict):
                    _push_subscriptions.update(subs)
                _save_store_to_disk()
                print(f"[Sync-Postgres] Successfully loaded and merged store v{_store_version} from database.")
                return True
    except Exception as e:
        print(f"[Sync-Postgres] Postgres read note: {e}")
        if not _store_cache or not _store_cache.get("employees"):
            _load_store_from_disk()
    return False


async def save_store_to_postgres() -> bool:
    """Saves sync store to persistent PostgreSQL table with non-destructive union merge."""
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
                existing_data = record.data if isinstance(record.data, dict) else {}
                merged_orders = _merge_item_lists(
                    existing_data.get("orders", []),
                    _store_cache.get("orders", []),
                    key_field="id"
                )
                merged_employees = _merge_item_lists(
                    existing_data.get("employees", []),
                    _store_cache.get("employees", []),
                    key_field="code"
                )
                merged_attendance = _merge_item_lists(
                    existing_data.get("attendance", []),
                    _store_cache.get("attendance", []),
                    key_field="id"
                )
                merged_payload = {
                    **existing_data,
                    **_store_cache,
                    "orders": _sanitize_orders(merged_orders),
                    "employees": merged_employees,
                    "attendance": merged_attendance,
                }
                record.version = max(record.version or 1, _store_version)
                record.updated_at = _store_updated_at
                record.data = merged_payload
            await session.commit()
            print(f"[Sync-Postgres] Successfully persisted merged store v{_store_version} to PostgreSQL database.")
            return True
    except Exception as e:
        print(f"[Sync-Postgres] Postgres write error: {e}")
    return False


def _merge_active_shifts(existing_shifts: dict, incoming_shifts: dict) -> dict:
    today_str = datetime.now().strftime("%b %d, %Y")
    now_ts = time.time() * 1000
    if not isinstance(existing_shifts, dict):
        existing_shifts = {}
    if not isinstance(incoming_shifts, dict):
        incoming_shifts = {}
    
    merged = dict(existing_shifts)
    for emp_code, shift in incoming_shifts.items():
        if isinstance(shift, dict):
            shift_date = str(shift.get("date") or "")
            shift_ts = float(shift.get("checkInTimestamp") or 0)
            is_recent = shift_ts > 0 and (now_ts - shift_ts < 24 * 3600 * 1000)
            is_today = (shift_date == today_str) or (today_str in shift_date) or is_recent

            if is_today:
                existing = merged.get(emp_code)
                if existing and isinstance(existing, dict):
                    existing_ts = float(existing.get("checkInTimestamp") or 0)
                    if shift_ts >= existing_ts:
                        merged[emp_code] = shift
                else:
                    merged[emp_code] = shift

    # Keep shifts that belong to today or were checked in within 24 hours
    cleaned = {}
    for emp_code, shift in merged.items():
        if isinstance(shift, dict):
            shift_date = str(shift.get("date") or "")
            shift_ts = float(shift.get("checkInTimestamp") or 0)
            is_recent = shift_ts > 0 and (now_ts - shift_ts < 24 * 3600 * 1000)
            is_today = (shift_date == today_str) or (today_str in shift_date) or is_recent
            if is_today:
                cleaned[emp_code] = shift
    return cleaned


class SyncPushPayload(BaseModel):
    data: Dict[str, Any]
    client_version: Optional[int] = None
    client_id: Optional[str] = None
    deleted_task_ids: Optional[list[str]] = None
    deleted_order_ids: Optional[list[str]] = None


# --- Web Push Notifications for Closed Mobile Phones ---
VAPID_PUBLIC_KEY = os.environ.get(
    "VAPID_PUBLIC_KEY",
    "BIYt7ALGeT9f89rRzL6tAldELMO9kt7P-D3ZDAE8Af23y1fq5MX_pl-owRktAeaAhTe4IX0uqcaSw0mIfZJDRQQ"
)
VAPID_PRIVATE_KEY = os.environ.get(
    "VAPID_PRIVATE_KEY",
    "B639hmVe340fo8HTwAgUeC4IHZMJQ7lTgkcISnkzq70"
)
VAPID_CLAIMS = {"sub": "mailto:bharatvyas@crm.com"}

_push_subscriptions: Dict[str, Dict[str, Any]] = {}


class PushSubscriptionPayload(BaseModel):
    subscription: Dict[str, Any]
    employeeCode: Optional[str] = "ALL"
    userAgent: Optional[str] = None


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"publicKey": VAPID_PUBLIC_KEY}


@router.post("/push-subscribe")
async def subscribe_to_push(payload: PushSubscriptionPayload):
    endpoint = payload.subscription.get("endpoint")
    if endpoint:
        _push_subscriptions[endpoint] = {
            "subscription": payload.subscription,
            "employeeCode": payload.employeeCode,
            "userAgent": payload.userAgent,
            "subscribed_at": datetime.now(timezone.utc).isoformat(),
        }
        # Persist across restarts
        _store_cache["_push_subscriptions"] = _push_subscriptions
        _save_store_to_disk()
        try:
            await save_store_to_postgres()
        except Exception:
            pass

    return {"status": "subscribed", "count": len(_push_subscriptions)}


@router.post("/test-push")
async def trigger_test_push():
    """Manually test web push to all subscribed phones with vibration & sound."""
    sent = broadcast_web_push(
        "🔔 Workforce CRM Alert!",
        "Live test alert! Push notification & sound are fully active on this device.",
        "/app"
    )
    return {
        "status": "dispatched",
        "registered_subscribers": len(_push_subscriptions),
        "sent_count": sent,
    }



def broadcast_web_push(title: str, body: str, url: str = "/app", target_code: Optional[str] = None) -> int:
    """Sends background Web Push to devices even when the app is completely closed."""
    global _push_subscriptions
    if not _push_subscriptions and isinstance(_store_cache.get("_push_subscriptions"), dict):
        _push_subscriptions.update(_store_cache["_push_subscriptions"])

    if not _push_subscriptions:
        print("[WebPush] No registered push subscriptions to send to.")
        return 0

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        print("[WebPush] pywebpush not installed in environment, push skipped")
        return 0

    payload_data = json.dumps({
        "title": title,
        "body": body,
        "url": url,
        "tag": f"wcrm-{int(time.time())}",
    })

    sent_count = 0
    expired_endpoints = []
    for endpoint, item in list(_push_subscriptions.items()):
        if target_code and item.get("employeeCode") not in (target_code, "ALL"):
            continue
        try:
            webpush(
                subscription_info=item["subscription"],
                data=payload_data,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
                timeout=5,
            )
            sent_count += 1
        except WebPushException as ex:
            if hasattr(ex, "response") and ex.response and ex.response.status_code in (404, 410):
                expired_endpoints.append(endpoint)
            else:
                print(f"[WebPush] Failed for endpoint: {ex}")
        except Exception as e:
            print(f"[WebPush] Error dispatching push: {e}")

    for ep in expired_endpoints:
        _push_subscriptions.pop(ep, None)

    if expired_endpoints:
        _store_cache["_push_subscriptions"] = _push_subscriptions
        _save_store_to_disk()

    print(f"[WebPush] Dispatched push to {sent_count} device(s) successfully.")
    return sent_count



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
    """Returns the latest real-time CRM store and version instantly without hanging on suspended DB."""
    if not _store_cache or not _store_cache.get("employees"):
        _load_store_from_disk()
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

    prev_orders = list(_store_cache.get("orders", []))
    prev_tasks = list(_store_cache.get("tasks", []))
    prev_order_map = {str(o.get("id")): o for o in prev_orders if isinstance(o, dict) and o.get("id")}
    
    # Merge active shifts
    merged_shifts = _merge_active_shifts(
        _store_cache.get("activeShifts", {}),
        incoming.get("activeShifts", {})
    )

    # Maintain cumulative deleted order tombstones
    existing_deleted_orders = set(_store_cache.get("deletedOrderIds", []))
    if payload.deleted_order_ids:
        for d in payload.deleted_order_ids:
            existing_deleted_orders.add(str(d))
    all_deleted_orders = list(existing_deleted_orders)

    # Merge list collections intelligently without cross-device data loss
    merged_orders = _merge_item_lists(
        _store_cache.get("orders", []),
        incoming.get("orders", []),
        key_field="id",
        deleted_ids=all_deleted_orders
    )
    merged_orders = _sanitize_orders(merged_orders)
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
        "roles": incoming.get("roles", _store_cache.get("roles", baseline["roles"])),
        "deletedOrderIds": all_deleted_orders,
        "_push_subscriptions": _push_subscriptions,
    }

    _store_cache = merged
    _store_version += 1
    _store_updated_at = datetime.now(timezone.utc).isoformat()
    
    # Persist to disk and PostgreSQL
    _save_store_to_disk()
    await save_store_to_postgres()

    # Detect newly added orders OR orders that transitioned to "Broadcasted" or direct "Claimed"
    new_broadcasted_orders = []
    direct_assigned_orders = []
    for ord_item in merged_orders:
        if isinstance(ord_item, dict):
            oid = str(ord_item.get("id"))
            status = ord_item.get("status")
            prev_ord = prev_order_map.get(oid)
            if status == "Broadcasted":
                if not prev_ord or prev_ord.get("status") != "Broadcasted":
                    new_broadcasted_orders.append(ord_item)
            elif status == "Claimed" and ord_item.get("broadcastTarget") == "SPECIFIC":
                if not prev_ord:
                    direct_assigned_orders.append(ord_item)

    # Trigger background Web Push for new broadcasted orders to ALL employees
    for n_ord in new_broadcasted_orders:
        code = n_ord.get("orderCode") or "New Order"
        cust = n_ord.get("customerName") or "Customer"
        cnt = n_ord.get("itemsCount") or 1
        broadcast_web_push(
            f"📦 New Order in Pool: {code}",
            f"{cust} • {cnt} item(s) available in shop pool. Tap to claim!",
            "/app/orders"
        )
    
    # Trigger direct push if assigned to specific employee
    for d_ord in direct_assigned_orders:
        code = d_ord.get("orderCode") or "New Order"
        cust = d_ord.get("customerName") or "Customer"
        target_code = d_ord.get("assignedToCode")
        broadcast_web_push(
            f"📦 New Order Assigned: {code}",
            f"{cust} • Assigned directly to you. Tap to view & dispatch.",
            "/app/orders",
            target_code=target_code
        )

    # Fallback push if order count increased but not caught above
    if len(merged_orders) > len(prev_orders) and not new_broadcasted_orders and not direct_assigned_orders:
        broadcast_web_push(
            "📦 New Order in Pool!",
            "A new wholesale order is available in the pool. Tap to view.",
            "/app/orders"
        )

    if len(merged_tasks) > len(prev_tasks):
        broadcast_web_push(
            "📋 New Work Task Assigned!",
            "Admin assigned or updated tasks. Tap to open tasks.",
            "/app/tasks"
        )
    
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
