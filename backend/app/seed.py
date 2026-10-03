"""
Database seeder — run with: python -m app.seed
Seeds admin user, roles, permissions, default settings, leave types, and complaint categories.
"""
import asyncio
from app.database import engine, AsyncSessionLocal, Base
from app.models import *  # noqa: F401, F403 — import all models to register with Base
from app.utils.security import hash_password


# All 96 permission codes grouped by module
PERMISSION_CODES = [
    # Auth
    ("auth.read.self", "Read own session info"),
    # Directory
    ("directory.read.all", "View all employees"),
    ("directory.read.self", "View own profile"),
    ("directory.write.all", "Create/edit employees"),
    ("directory.delete", "Deactivate employees"),
    # Attendance
    ("attendance.read.self", "View own attendance"),
    ("attendance.read.all", "View all attendance"),
    ("attendance.checkin.self", "Check in"),
    ("attendance.checkout.self", "Check out"),
    ("attendance.manage", "Manage/recompute attendance"),
    ("attendance.corrections.submit", "Submit correction"),
    ("attendance.corrections.review", "Review corrections"),
    ("attendance.qr.generate", "Generate QR tokens"),
    # Tasks
    ("tasks.read.self", "View assigned tasks"),
    ("tasks.read.all", "View all tasks"),
    ("tasks.create", "Create tasks"),
    ("tasks.update", "Edit tasks"),
    ("tasks.delete", "Delete tasks"),
    ("tasks.assign", "Assign tasks"),
    ("tasks.submit.self", "Submit task completion"),
    ("tasks.review", "Review task submissions"),
    # Orders
    ("orders.read.all", "View all orders"),
    ("orders.read.self", "View own claimed orders"),
    ("orders.create", "Create orders"),
    ("orders.broadcast", "Broadcast orders"),
    ("orders.claim", "Claim orders"),
    ("orders.update.status", "Update order status"),
    ("orders.cancel", "Cancel orders"),
    ("orders.pod.verify", "Verify proof of delivery"),
    # Leaves
    ("leave.read.self", "View own leaves"),
    ("leave.read.all", "View all leave requests"),
    ("leave.apply.self", "Apply for leave"),
    ("leave.approve", "Approve/reject leave"),
    ("leave.balance.manage", "Manage leave balances"),
    # Ledger
    ("ledger.read.self", "View own ledger"),
    ("ledger.read.all", "View all ledgers"),
    ("ledger.advance.request", "Request advance"),
    ("ledger.advance.approve", "Approve/disburse advances"),
    ("ledger.entries.create", "Create ledger entries"),
    # Complaints
    ("complaints.read.self", "View own complaints"),
    ("complaints.read.all", "View all complaints"),
    ("complaints.create.self", "Submit complaints"),
    ("complaints.manage", "Manage complaint status"),
    ("complaints.comment", "Add internal comments"),
    # Payroll
    ("payroll.read", "View payroll runs"),
    ("payroll.run", "Create/generate payroll"),
    ("payroll.approve", "Approve payroll"),
    ("payroll.payslips.view", "View payslips"),
    # RBAC
    ("rbac.roles.read", "View roles"),
    ("rbac.roles.write", "Create/edit roles"),
    ("rbac.permissions.read", "View permissions"),
    ("rbac.users.assign", "Assign roles to users"),
    # Settings
    ("settings.read", "View business settings"),
    ("settings.write", "Modify business settings"),
    # Audit
    ("audit.read", "View audit logs"),
]

# Employee role gets these permissions
EMPLOYEE_PERMISSIONS = [
    "auth.read.self",
    "directory.read.self",
    "attendance.read.self",
    "attendance.checkin.self",
    "attendance.checkout.self",
    "attendance.corrections.submit",
    "tasks.read.self",
    "tasks.submit.self",
    "orders.read.self",
    "orders.claim",
    "orders.update.status",
    "leave.read.self",
    "leave.apply.self",
    "ledger.read.self",
    "ledger.advance.request",
    "complaints.read.self",
    "complaints.create.self",
    "payroll.payslips.view",
]

# Default business settings
DEFAULT_SETTINGS = [
    # Attendance
    ("attendance.verification_mode", "GPS_OR_QR", "attendance", "string", "Verification Mode", "GPS_AND_QR, GPS_OR_QR, GPS_ONLY, QR_ONLY"),
    ("attendance.geofence_latitude", "28.6139", "attendance", "number", "Geofence Latitude", "Shop GPS latitude"),
    ("attendance.geofence_longitude", "77.2090", "attendance", "number", "Geofence Longitude", "Shop GPS longitude"),
    ("attendance.geofence_radius_meters", "200", "attendance", "number", "Geofence Radius (m)", "Allowed distance from shop"),
    ("attendance.gps_accuracy_max_m", "100", "attendance", "number", "Max GPS Accuracy (m)", "Maximum allowed GPS accuracy"),
    ("attendance.location_max_age_seconds", "60", "attendance", "number", "Location Max Age (s)", "Maximum age of GPS reading"),
    ("attendance.qr_rotation_seconds", "45", "attendance", "number", "QR Rotation Interval (s)", "How often QR nonce rotates"),
    ("attendance.shift_start_time", "09:00", "attendance", "string", "Shift Start Time", "Daily shift start"),
    ("attendance.shift_end_time", "19:00", "attendance", "string", "Shift End Time", "Daily shift end"),
    ("attendance.full_day_hours", "10", "attendance", "number", "Full Day Hours", "Hours required for full day"),
    ("attendance.half_day_hours", "5", "attendance", "number", "Half Day Hours", "Hours required for half day"),
    ("attendance.late_grace_minutes", "10", "attendance", "number", "Late Grace (min)", "Late check-in grace period"),
    ("attendance.early_checkout_grace_minutes", "10", "attendance", "number", "Early Checkout Grace (min)", "Early checkout grace"),
    ("attendance.overtime_threshold_hours", "10", "attendance", "number", "Overtime Threshold (h)", "Hours after which overtime starts"),
    ("attendance.overtime_max_hours", "4", "attendance", "number", "Max Overtime (h/day)", "Maximum overtime per day"),
    ("attendance.overtime_block_minutes", "30", "attendance", "number", "Overtime Block (min)", "Minimum overtime block"),
    # Orders
    ("orders.max_active_claims_per_employee", "3", "orders", "number", "Max Active Claims", "Maximum concurrent order claims"),
    ("orders.claim_timeout_minutes", "30", "orders", "number", "Claim Timeout (min)", "Auto-release after this period"),
    # Payroll
    ("payroll.overtime_rate_multiplier", "1.5", "payroll", "number", "Overtime Rate Multiplier", "Overtime pay multiplier"),
    ("payroll.working_days_per_month", "26", "payroll", "number", "Working Days/Month", "Standard working days"),
    ("payroll.max_advance_deduction_percent", "25", "payroll", "number", "Max Advance Deduction (%)", "Max salary % for advance deduction"),
    # General
    ("general.company_name", "Workforce CRM", "general", "string", "Company Name", "Business name"),
    ("general.currency", "INR", "general", "string", "Currency", "Default currency"),
    ("general.timezone", "Asia/Kolkata", "general", "string", "Timezone", "Business timezone"),
]

# Default leave types
DEFAULT_LEAVE_TYPES = [
    ("Casual Leave", "CL", 12, True, "Annual casual leave entitlement"),
    ("Sick Leave", "SL", 8, True, "Annual sick leave entitlement"),
    ("Unpaid Leave", "UL", 0, False, "Unpaid leave (no limit)"),
]

# Default complaint categories
DEFAULT_COMPLAINT_CATEGORIES = [
    ("Workplace Safety", "Issues related to workplace safety and health"),
    ("Harassment", "Harassment or discrimination complaints"),
    ("Work Conditions", "Working conditions and environment"),
    ("Equipment Issues", "Problems with tools and equipment"),
    ("Policy Concerns", "Concerns about company policies"),
    ("General Feedback", "General feedback and suggestions"),
]


async def seed():
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        try:
            from sqlalchemy import select

            # 1. Seed Permissions
            print("Seeding permissions...")
            from app.models.rbac import Permission, Role, RolePermission, UserRole

            for code, desc in PERMISSION_CODES:
                existing = await db.execute(select(Permission).where(Permission.code == code))
                if not existing.scalars().first():
                    db.add(Permission(code=code, description=desc))
            await db.flush()

            # 2. Seed Roles
            print("Seeding roles...")
            admin_role_result = await db.execute(select(Role).where(Role.name == "ADMIN"))
            admin_role = admin_role_result.scalars().first()
            if not admin_role:
                admin_role = Role(name="ADMIN", description="Full system access", is_admin=True)
                db.add(admin_role)
                await db.flush()

            emp_role_result = await db.execute(select(Role).where(Role.name == "EMPLOYEE"))
            emp_role = emp_role_result.scalars().first()
            if not emp_role:
                emp_role = Role(name="EMPLOYEE", description="Standard employee access", is_admin=False)
                db.add(emp_role)
                await db.flush()

            # Assign permissions to EMPLOYEE role
            for perm_code in EMPLOYEE_PERMISSIONS:
                perm_result = await db.execute(select(Permission).where(Permission.code == perm_code))
                perm = perm_result.scalars().first()
                if perm:
                    existing_rp = await db.execute(
                        select(RolePermission).where(
                            RolePermission.role_id == emp_role.id,
                            RolePermission.permission_id == perm.id,
                        )
                    )
                    if not existing_rp.scalars().first():
                        db.add(RolePermission(role_id=emp_role.id, permission_id=perm.id))
            await db.flush()

            # 3. Seed Admin User
            print("Seeding admin user...")
            from app.models.user import User
            from app.models.employee import Employee

            admin_result = await db.execute(select(User).where(User.email == "admin@crm.com"))
            admin_user = admin_result.scalars().first()
            if not admin_user:
                admin_user = User(
                    email="admin@crm.com",
                    hashed_password=hash_password("admin123"),
                    full_name="System Administrator",
                    is_active=True,
                    is_superuser=True,
                )
                db.add(admin_user)
                await db.flush()

                # Create admin employee profile
                admin_emp = Employee(
                    user_id=admin_user.id,
                    employee_code="EMP001",
                    full_name="System Administrator",
                    department="Administration",
                    designation="Admin",
                    base_salary=0,
                )
                db.add(admin_emp)
                await db.flush()

                # Assign admin role
                db.add(UserRole(user_id=admin_user.id, role_id=admin_role.id))
                await db.flush()

            # 4. Seed Business Settings
            print("Seeding business settings...")
            from app.models.settings import BusinessSetting

            for key, value, category, dtype, label, desc in DEFAULT_SETTINGS:
                existing = await db.execute(select(BusinessSetting).where(BusinessSetting.key == key))
                if not existing.scalars().first():
                    db.add(BusinessSetting(
                        key=key, value=value, category=category,
                        data_type=dtype, label=label, description=desc,
                        default_value=value,
                    ))
            await db.flush()

            # 5. Seed Leave Types + Admin Balances
            print("Seeding leave types...")
            from app.models.leave import LeaveType, LeaveBalance
            from datetime import datetime, timezone

            for name, code, quota, is_paid, desc in DEFAULT_LEAVE_TYPES:
                existing = await db.execute(select(LeaveType).where(LeaveType.code == code))
                if not existing.scalars().first():
                    lt = LeaveType(
                        name=name, code=code, annual_quota=quota,
                        is_paid=is_paid, description=desc,
                    )
                    db.add(lt)
            await db.flush()

            # 6. Seed Complaint Categories
            print("Seeding complaint categories...")
            from app.models.complaint import ComplaintCategory

            for name, desc in DEFAULT_COMPLAINT_CATEGORIES:
                existing = await db.execute(select(ComplaintCategory).where(ComplaintCategory.name == name))
                if not existing.scalars().first():
                    db.add(ComplaintCategory(name=name, description=desc))
            await db.flush()

            await db.commit()
            print("\n[SUCCESS] Database seeded successfully!")
            print("   Admin login: admin@crm.com / admin123")

        except Exception as e:
            await db.rollback()
            print(f"\n[ERROR] Seed failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())