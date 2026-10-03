# Workforce CRM & Employee Operations Platform

A production-grade, mobile-first Workforce CRM designed for small-to-medium businesses (1 Admin, ~20-40 Employees).

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 16+ (or local instance)

---

### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env (ensure PostgreSQL is running)
# Edit DATABASE_URL in .env if needed

# Seed database (creates tables, admin user, permissions, settings, leave types)
python -m app.seed

# Start FastAPI server
python run.py
# Server runs on http://localhost:8000
# API Docs: http://localhost:8000/api/v1/docs
```

**Default Admin Credentials:**
- **Email**: `admin@crm.com`
- **Password**: `admin123`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
# App runs on http://localhost:3000
```

---

## 🏗️ Architecture Overview

```
new_crm/
├── backend/                  # FastAPI + SQLAlchemy 2.0 Async
│   ├── app/
│   │   ├── config.py         # Dynamic environment settings
│   │   ├── database.py       # Async engine & sessionmaker
│   │   ├── dependencies.py   # RBAC & session auth checks
│   │   ├── exceptions.py     # Custom typed exception hierarchy
│   │   ├── main.py           # FastAPI app factory & CORS
│   │   ├── seed.py           # 56 permissions, 24 settings, admin seed
│   │   ├── models/           # 12 SQLAlchemy models
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── services/         # 11 business logic services
│   │   ├── routers/          # 11 API routers (76 routes)
│   │   └── utils/            # Security (Argon2id) & Geo (Haversine)
│   ├── requirements.txt
│   └── run.py
│
└── frontend/                 # Next.js 15 (App Router, Tailwind CSS)
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Login page (Industrial Warmth design)
    │   │   ├── admin/        # Admin Panel (9 sub-pages)
    │   │   │   ├── page.tsx  # Dashboard
    │   │   │   ├── attendance/
    │   │   │   ├── complaints/
    │   │   │   ├── employees/
    │   │   │   ├── leaves/
    │   │   │   ├── orders/
    │   │   │   ├── payroll/
    │   │   │   └── settings/
    │   │   └── app/          # Employee PWA Mobile Panel
    │   │       ├── page.tsx  # Check-in / Check-out widget
    │   │       ├── complaints/
    │   │       ├── leaves/
    │   │       ├── orders/
    │   │       └── tasks/
    │   ├── components/ui/    # Badge, Button, Input, Modal, etc.
    │   ├── lib/              # API client, Auth Context, React Query
    │   └── types/            # TypeScript interfaces
    └── public/manifest.json  # PWA manifest
```

---

## 🎨 Design Direction: "Industrial Warmth"

- **Typography**: `DM Serif Display` for headings, `Satoshi` for body
- **Color Palette**:
  - Primary: `#e8611a` (Burnt Orange)
  - Success: `#7d8f69` (Muted Sage)
  - Background: `#faf7f2` (Warm Cream)
  - Text: `#1a1a2e` (Deep Charcoal)
- **Atmosphere**: Subtle grain texture overlay, editorial grid layouts, generous negative space, no generic AI templates.

---

## 🔒 Key Engineering Features

1. **Zero Hardcoded Rules**: All shop GPS coords, shift timings, overtime caps, and claim timeouts are database-driven via `SettingsService`.
2. **Atomic Order Claiming**: Uses `SELECT ... FOR UPDATE skip_locked=True` to guarantee race-condition-free claiming when multiple employees click simultaneously.
3. **Haversine Geofencing**: Server-side mathematical validation of GPS coordinates against shop location.
4. **Day Classification & Overtime**: Auto-computes FULL_DAY (≥10h), HALF_DAY (≥5h), PARTIAL_DAY (<5h), ABSENT (<0.5h), with overtime accrued in 30-minute blocks (capped at 4h).
5. **Double-Entry Ledger**: Tracks advances, disbursements, salary credits, and repayments with running balances.
6. **Immutable Payroll Runs**: Freezes active business rules into `PayrollRuleSnapshot` before computing net salaries.
