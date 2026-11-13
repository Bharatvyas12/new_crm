"use client";
import restoredOrdersData from "./restoredOrders.json";


// SINGLE DEVICE SESSION LOCK ENGINE
export const registerActiveSessionInStore = (data: {
  employeeCode: string;
  employeeName: string;
  deviceName?: string;
}): ActiveSessionItem => {
  const store = getCRMStore();
  if (!store.activeSessions) store.activeSessions = {};

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const sessionItem: ActiveSessionItem = {
    sessionId,
    employeeCode: data.employeeCode,
    employeeName: data.employeeName,
    deviceName: data.deviceName || "Mobile Phone",
    loginTimestamp: Date.now(),
    lastPingTimestamp: Date.now(),
  };

  store.activeSessions[data.employeeCode] = sessionItem;
  // Also index by uppercase code
  store.activeSessions[data.employeeCode.toUpperCase()] = sessionItem;

  saveCRMStore(store);
  return sessionItem;
};

// Touch employee activity timestamp for Proof-of-Work tracking
export const touchEmployeeActivityInStore = (
  employeeCode: string,
  description: string,
  location?: { lat: number; lng: number; acc?: number }
) => {
  if (!employeeCode) return;
  const store = getCRMStore();
  const shift = findActiveShiftInStore(store, employeeCode);
  if (!shift) return;

  shift.lastActivityTimestamp = Date.now();
  shift.lastActivityDescription = description;
  if (location && typeof location.lat === "number" && typeof location.lng === "number") {
    shift.latitude = location.lat;
    shift.longitude = location.lng;
    if (location.acc) shift.accuracyM = location.acc;
  }

  saveCRMStore(store);
};

// Check for Inactive on Duty staff (e.g. 2+ hours with no actions)
export interface InactiveStaffItem {
  employeeCode: string;
  employeeName: string;
  department: string;
  checkInTime: string;
  inactiveMinutes: number;
  lastActivityDescription: string;
  latitude?: number;
  longitude?: number;
  distanceM?: number;
}

export const getInactiveStaffList = (store: CRMStoreData, thresholdHours: number = 2): InactiveStaffItem[] => {
  const list: InactiveStaffItem[] = [];
  const now = Date.now();
  const thresholdMs = thresholdHours * 60 * 60 * 1000;

  if (!store.activeShifts) return list;

  const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const processedCodes = new Set<string>();

  Object.values(store.activeShifts).forEach((shift) => {
    if (!shift || !shift.employeeCode || processedCodes.has(shift.employeeCode)) return;
    processedCodes.add(shift.employeeCode);

    if (shift.date === todayStr && shift.shiftState === "ACTIVE") {
      const lastActionTs = shift.lastActivityTimestamp || shift.checkInTimestamp;
      const diffMs = now - lastActionTs;
      if (diffMs >= thresholdMs) {
        list.push({
          employeeCode: shift.employeeCode,
          employeeName: shift.employeeName,
          department: shift.department,
          checkInTime: shift.checkInTime,
          inactiveMinutes: Math.floor(diffMs / (1000 * 60)),
          lastActivityDescription: shift.lastActivityDescription || "Check-In",
          latitude: shift.latitude,
          longitude: shift.longitude,
          distanceM: shift.distanceM,
        });
      }
    }
  });

  return list;
};

// Centralized Reactive Client Store with Real-Time Cross-Device Cloud Sync
import { pushStoreToCloud, initCloudSync } from "./syncEngine";

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusM: number;
  shiftStart: string;
  shiftEnd: string;
  requiredDailyHours: number;
  allowedBreakMinutes?: number;
  gracePeriodMinutes: number;
  qrRotationSeconds: number;
  lastUpdated: string;
}

export interface EmployeeItem {
  id: string;
  code: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  type: string;
  status: "Active" | "Inactive";
  joined: string;
  phone: string;
  initialPassword?: string;
  baseSalary: number;
  bankAccount?: string;
  bankIfsc?: string;
  upiId?: string;
  emergencyContact?: string;
  address?: string;
  casualLeaves: number;
  sickLeaves: number;
}

export type Employee = EmployeeItem;

export interface AdvanceRequest {
  id: string;
  employeeId: string;
  employee: string;
  code: string;
  department: string;
  amount: number;
  outstanding: number;
  reason: string;
  mode: "SALARY_DEDUCTION" | "INSTALLMENTS" | "CASH";
  status: "Pending Approval" | "Disbursed" | "Rejected";
  requestedAt: string;
  disbursedAt?: string;
}

export interface LedgerEntry {
  id: string;
  employeeName: string;
  employeeCode: string;
  type: "ADVANCE_DISBURSEMENT" | "ADVANCE_REPAYMENT" | "SALARY_CREDIT" | "BONUS_INCENTIVE" | "DEDUCTION_PENALTY" | "EXPENSE_REIMBURSEMENT";
  amount: number;
  paymentMode: "Cash" | "Bank Transfer" | "UPI" | "Salary Deduction";
  referenceNo?: string;
  description: string;
  date: string;
  runningBalance: number;
}

export interface OrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  address?: string;
  itemsCount: number;
  itemsDescription?: string;
  priority?: "Normal" | "High" | "Urgent";
  receiptPhoto?: string;
  receiptPhotos?: string[];
  status: "Draft" | "Broadcasted" | "Claimed" | "Packing" | "Packed" | "Ready" | "In Transit" | "Delivered" | "Cancelled";
  packedBy?: string;
  packedAt?: string;
  deliveryMode?: "DRIVER" | "CUSTOMER_PICKUP";
  assignedDriverName?: string;
  assignedDriverCode?: string;
  assignedDriverPhone?: string;
  assignedVehicleNumber?: string;
  inTransitAt?: string;
  handoverToCustomerAt?: string;
  deliveryNotes?: string;
  claimedBy?: string;
  claimedAt?: string;
  deliveredAt?: string;
  notes?: string;
  created: string;
  broadcastTarget?: "ALL" | "SPECIFIC";
  assignedToCode?: string;
  assignedToName?: string;
  createdByName?: string;
  createdByRole?: "ADMIN" | "EMPLOYEE";
  isDeleted?: boolean;
  _createdTimestamp?: number;
  _updatedTimestamp?: number;
  updatedAt?: string;
  _localPendingSync?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workedHours: number;
  overtimeHours: number;
  classification: "FULL_DAY" | "HALF_DAY" | "PARTIAL_DAY" | "ABSENT";
  status: "Present" | "Late" | "Absent" | "On Break";
  distanceM: number;
}

export interface CorrectionItem {
  id: string;
  employee: string;
  code: string;
  department: string;
  date: string;
  originalTime: string;
  requestedTime: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: "Casual Leave" | "Sick Leave" | "Unpaid Leave" | "Emergency Leave";
  startDate: string;
  endDate: string;
  period: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string;
  balanceRemaining: number;
  totalEntitlement: number;
}

export interface ComplaintComment {
  author: string;
  role: "ADMIN" | "EMPLOYEE";
  text: string;
  time: string;
}

export interface ComplaintItem {
  id: string;
  category: "Workplace Safety" | "Equipment & Tools" | "Salary & Payroll" | "Facility / Cleanliness" | "Work Conditions" | "General Feedback";
  subject: string;
  description: string;
  raisedBy: string;
  employeeCode: string;
  department: string;
  visibility: "EMPLOYEE_PRIVATE" | "PUBLIC" | "ADMIN_ONLY";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "UNDER_INVESTIGATION" | "RESOLVED" | "REJECTED";
  createdAt: string;
  comments: ComplaintComment[];
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: "Normal" | "High" | "Urgent";
  status: "Assigned" | "In Progress" | "Submitted" | "Completed";
  due: string;
  assignee: string;
  assigneeCode?: string;
  created: string;
  evidenceNote?: string;
  evidenceFile?: string;
}

export interface ActiveSessionItem {
  sessionId: string;
  employeeCode: string;
  employeeName: string;
  deviceName?: string;
  loginTimestamp: number;
  lastPingTimestamp: number;
}

export interface ActiveShiftState {
  employeeCode: string;
  employeeName: string;
  department: string;
  shiftState: "NOT_STARTED" | "ACTIVE" | "ON_BREAK" | "COMPLETED";
  checkInTime: string;
  checkInTimestamp: number;
  checkOutTime?: string;
  checkOutTimestamp?: number;
  breakStartedAt?: number;
  breakStartTime?: string;
  breakEndTime?: string;
  totalBreakSeconds: number;
  date: string;
  distanceM: number;
  latitude?: number;
  longitude?: number;
  accuracyM?: number;
  lastActivityTimestamp?: number;
  lastActivityDescription?: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description: string;
  isAdmin: boolean;
  usersCount: number;
  permissions: string[];
}

export const initialRoles: RoleItem[] = [
  {
    id: "1",
    name: "ADMIN",
    description: "Super Administrator with full, unrestricted authority across all operations, financial ledgers, and configurations.",
    isAdmin: true,
    usersCount: 1,
    permissions: ["*"],
  },
  {
    id: "2",
    name: "SUPERVISOR",
    description: "Shift operations lead responsible for monitoring attendance, assigning operational tasks, broadcasting orders, and approving leaves.",
    isAdmin: false,
    usersCount: 3,
    permissions: [
      "attendance.read.all",
      "attendance.qr.generate",
      "attendance.corrections.approve",
      "orders.read.all",
      "orders.broadcast",
      "orders.edit",
      "tasks.create",
      "tasks.review",
      "leaves.read.all",
      "leaves.approve",
    ],
  },
  {
    id: "3",
    name: "EMPLOYEE",
    description: "Standard field and shop floor workforce member with self-service attendance, order pool claiming, order broadcasting, and task execution.",
    isAdmin: false,
    usersCount: 18,
    permissions: [
      "attendance.checkin.self",
      "orders.claim",
      "orders.read.self",
      "orders.broadcast",
      "tasks.read.self",
      "tasks.submit.self",
      "leaves.apply.self",
      "ledger.read.self",
    ],
  },
  {
    id: "4",
    name: "ACCOUNTS_LEAD",
    description: "Finance and accounts officer handling double-entry advance disbursements, bonus postings, and monthly payroll processing.",
    isAdmin: false,
    usersCount: 2,
    permissions: [
      "attendance.read.all",
      "ledger.read.all",
      "ledger.post_entry",
      "payroll.run",
      "payroll.approve",
      "leaves.read.all",
    ],
  },
  {
    id: "5",
    name: "DISPATCH_MANAGER",
    description: "Logistics coordinator focused on customer order intake, dispatching, driver assignment, and delivery proof verification.",
    isAdmin: false,
    usersCount: 2,
    permissions: [
      "orders.read.all",
      "orders.broadcast",
      "orders.edit",
      "orders.pod.verify",
      "attendance.read.all",
    ],
  },
];

export interface CRMStoreData {
  settings: ShopSettings;
  employees: EmployeeItem[];
  advances: AdvanceRequest[];
  ledger: LedgerEntry[];
  orders: OrderItem[];
  tasks: TaskItem[];
  attendance: AttendanceRecord[];
  activeShifts: Record<string, ActiveShiftState>;
  activeSessions?: Record<string, ActiveSessionItem>;
  corrections: CorrectionItem[];
  leaves: LeaveRequest[];
  complaints: ComplaintItem[];
  roles: RoleItem[];
  deletedOrderIds?: string[];
  deletedTaskIds?: string[];
}

// Clean baseline store data for clean real-time operational use
export const cleanBaselineStore: CRMStoreData = {
  settings: {
    shopName: "Mahesh Enterprises (Tata Tiscon)",
    ownerName: "somesh sharma",
    phone: "9214843291",
    email: "somesh9497@gmail.com",
    address: "near tehsil office , kuchaman road , parbatsar 341512",
    latitude: 26.893062,
    longitude: 74.76912,
    geofenceRadiusM: 10,
    shiftStart: "08:00",
    shiftEnd: "20:00",
    requiredDailyHours: 12,
    allowedBreakMinutes: 60,
    gracePeriodMinutes: 20,
    qrRotationSeconds: 45,
    lastUpdated: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  },
  activeShifts: {},
  employees: [
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
  advances: [],
  ledger: [],
  orders: (restoredOrdersData || []) as OrderItem[],
  tasks: [],
  attendance: [],
  corrections: [],
  leaves: [],
  complaints: [],
  roles: initialRoles,
  deletedOrderIds: [],
};

export const STORAGE_KEY = "wcrm_unified_store_v4";
export const DELETED_ORDERS_KEY = "wcrm_deleted_order_ids";

export const getDeletedOrderIds = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_ORDERS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
};

export const addDeletedOrderId = (orderId: string) => {
  if (typeof window === "undefined" || !orderId) return;
  try {
    const set = getDeletedOrderIds();
    set.add(orderId);
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(arr));
  } catch {}
};

export const getCRMStore = (): CRMStoreData => {
  if (typeof window === "undefined") return cleanBaselineStore;
  try {
    // Purge deprecated v1, v2 and v3 test caches
    ["wcrm_unified_store_v1", "wcrm_unified_store_v2", "wcrm_unified_store_v3", "wcrm_store_version", "wcrm_store_version_v3", "wcrm_store_updated_at", "wcrm_store_updated_at_v3"].forEach((k) => {
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanBaselineStore));
      return cleanBaselineStore;
    }
    const parsed = JSON.parse(raw);
    const deletedSet = getDeletedOrderIds();
    if (Array.isArray(parsed.deletedOrderIds)) {
      parsed.deletedOrderIds.forEach((id: string) => deletedSet.add(id));
    }
    const rawOrders = parsed.orders || [];
    const filteredOrders = rawOrders.filter(
      (o: any) => o && o.id && !deletedSet.has(o.id) && !o.isDeleted
    );

    // If local storage has 0 orders but clean baseline has the 138 restored orders, auto-fill them!
    const effectiveOrders = (filteredOrders.length > 0)
      ? filteredOrders
      : (cleanBaselineStore.orders || []);

    const effectiveEmployees = (Array.isArray(parsed.employees) && parsed.employees.length > 1)
      ? parsed.employees
      : cleanBaselineStore.employees;

    const result = {
      ...cleanBaselineStore,
      ...parsed,
      activeShifts: parsed.activeShifts || {},
      activeSessions: parsed.activeSessions || {},
      orders: effectiveOrders,
      tasks: (parsed.tasks && parsed.tasks.length > 0) ? parsed.tasks : (cleanBaselineStore.tasks || []),
      attendance: (parsed.attendance && parsed.attendance.length > 0) ? parsed.attendance : (cleanBaselineStore.attendance || []),
      corrections: parsed.corrections || [],
      complaints: parsed.complaints || [],
      advances: parsed.advances || [],
      leaves: parsed.leaves || [],
      ledger: parsed.ledger || [],
      employees: effectiveEmployees,
      settings: (() => {
        const rawSettings = { ...cleanBaselineStore.settings, ...(parsed.settings || {}) };
        if (rawSettings.latitude === 26.9124 || !rawSettings.latitude) {
          rawSettings.latitude = 26.893062;
          rawSettings.longitude = 74.76912;
          rawSettings.address = "near tehsil office , kuchaman road , parbatsar 341512";
          rawSettings.shopName = "Mahesh Enterprises (Tata Tiscon)";
          rawSettings.ownerName = "somesh sharma";
          rawSettings.phone = "9214843291";
        }
        if (rawSettings.geofenceRadiusM === 250 || !rawSettings.geofenceRadiusM) {
          rawSettings.geofenceRadiusM = 10;
        }
        return rawSettings;
      })(),
      roles: parsed.roles || cleanBaselineStore.roles,
      deletedOrderIds: Array.from(deletedSet),
    };

    if (filteredOrders.length === 0 && (cleanBaselineStore.orders || []).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch {}
    }

    return result;
  } catch (err) {
    console.error("Failed to load store:", err);
    return cleanBaselineStore;
  }
};

export const saveCRMStore = (
  data: CRMStoreData,
  options?: { deletedTaskIds?: string[]; deletedOrderIds?: string[] }
) => {
  if (typeof window === "undefined") return;
  try {
    const deletedSet = getDeletedOrderIds();
    if (options?.deletedOrderIds) {
      options.deletedOrderIds.forEach((id) => deletedSet.add(id));
    }
    if (Array.isArray(data.deletedOrderIds)) {
      data.deletedOrderIds.forEach((id) => deletedSet.add(id));
    }
    const allDeleted = Array.from(deletedSet);
    data.deletedOrderIds = allDeleted;

    // Filter out deleted orders from data.orders
    if (Array.isArray(data.orders)) {
      data.orders = data.orders.filter(
        (o) => o && o.id && !deletedSet.has(o.id) && !o.isDeleted
      );
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("wcrm_store_updated"));

    // Broadcast across all open browser tabs and windows
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const bc = new BroadcastChannel("wcrm_sync_channel");
        bc.postMessage({ type: "SYNC", timestamp: Date.now() });
        bc.close();
      } catch (e) {}
    }

    // Push asynchronously to the cloud backend for cross-device sync
    pushStoreToCloud(data, {
      deletedTaskIds: options?.deletedTaskIds,
      deletedOrderIds: allDeleted,
    });
  } catch (err) {
    console.error("Failed to save store:", err);
  }
};

export const resetCRMStoreToClean = () => {
  if (typeof window === "undefined") return cleanBaselineStore;
  saveCRMStore(cleanBaselineStore);
  return cleanBaselineStore;
};

// Cross-tab & Cross-Device Reactive Store Subscription Listener
export const subscribeToCRMStore = (callback: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};

  // Initialize cloud background synchronization
  initCloudSync();

  const handleCustom = () => {
    callback();
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || !e.key) {
      callback();
    }
  };

  window.addEventListener("wcrm_store_updated", handleCustom);
  window.addEventListener("storage", handleStorage);

  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      bc = new BroadcastChannel("wcrm_sync_channel");
      bc.onmessage = () => {
        callback();
      };
    } catch (e) {}
  }

  return () => {
    window.removeEventListener("wcrm_store_updated", handleCustom);
    window.removeEventListener("storage", handleStorage);
    if (bc) {
      try {
        bc.close();
      } catch (e) {}
    }
  };
};

// ADVANCE ACTIONS
export const disburseAdvanceInStore = (advanceId: string): { success: boolean; message: string } => {
  const store = getCRMStore();
  const advance = store.advances.find((a) => a.id === advanceId);
  if (!advance) return { success: false, message: "Advance record not found" };

  advance.status = "Disbursed";
  advance.disbursedAt = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lastLedger = store.ledger.filter((l) => l.employeeCode === advance.code).pop();
  const prevBalance = lastLedger ? lastLedger.runningBalance : 25000;
  const newBalance = prevBalance - advance.amount;

  const newEntry: LedgerEntry = {
    id: `led-${Date.now()}`,
    employeeName: advance.employee,
    employeeCode: advance.code,
    type: "ADVANCE_DISBURSEMENT",
    amount: advance.amount,
    paymentMode: "Cash",
    referenceNo: `ADV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    description: `Advance Disbursed: ${advance.reason} (${advance.mode})`,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    runningBalance: newBalance,
  };

  store.ledger = [newEntry, ...store.ledger];
  saveCRMStore(store);

  return {
    success: true,
    message: `✓ ₹${advance.amount.toLocaleString()} advance disbursed to ${advance.employee} and auto-posted to Ledger!`,
  };
};

export const updateCorrectionStatusInStore = (
  correctionId: string,
  newStatus: "Approved" | "Rejected"
) => {
  const store = getCRMStore();
  const corr = store.corrections.find((c) => c.id === correctionId);
  if (corr) {
    corr.status = newStatus;
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const updateLeaveStatusInStore = (
  leaveId: string,
  newStatus: "APPROVED" | "REJECTED"
) => {
  const store = getCRMStore();
  const leave = store.leaves.find((l) => l.id === leaveId);
  if (leave) {
    leave.status = newStatus;
    if (newStatus === "APPROVED") {
      leave.balanceRemaining = Math.max(0, leave.balanceRemaining - leave.days);
    }
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const applyLeaveInStore = (data: {
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: LeaveRequest["leaveType"];
  startDate: string;
  endDate: string;
  period: LeaveRequest["period"];
  days: number;
  reason: string;
}) => {
  const store = getCRMStore();
  const emp = store.employees.find((e) => e.code === data.employeeCode);
  const total = emp ? emp.casualLeaves + emp.sickLeaves : 12;

  const newLeave: LeaveRequest = {
    id: `lv-${Date.now()}`,
    employeeName: data.employeeName,
    employeeCode: data.employeeCode,
    department: data.department,
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    period: data.period,
    days: data.days,
    reason: data.reason,
    status: "PENDING",
    appliedAt: "Just now",
    balanceRemaining: Math.max(0, total - data.days),
    totalEntitlement: total,
  };

  store.leaves = [newLeave, ...store.leaves];
  saveCRMStore(store);
  return newLeave;
};

export const createAdvanceRequestInStore = (data: {
  employeeId: string;
  employee: string;
  code: string;
  department: string;
  amount: number;
  reason: string;
  mode: AdvanceRequest["mode"];
}) => {
  const store = getCRMStore();
  const newAdv: AdvanceRequest = {
    id: `adv-${Date.now()}`,
    employeeId: data.employeeId,
    employee: data.employee,
    code: data.code,
    department: data.department,
    amount: data.amount,
    outstanding: data.amount,
    reason: data.reason,
    mode: data.mode,
    status: "Pending Approval",
    requestedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  };

  store.advances = [newAdv, ...store.advances];
  saveCRMStore(store);
  return newAdv;
};

export const addComplaintInStore = (data: {
  category: ComplaintItem["category"];
  subject: string;
  description: string;
  raisedBy: string;
  employeeCode: string;
  department: string;
  visibility: ComplaintItem["visibility"];
  priority: ComplaintItem["priority"];
}) => {
  const store = getCRMStore();
  const newComp: ComplaintItem = {
    id: `comp-${Date.now()}`,
    category: data.category,
    subject: data.subject,
    description: data.description,
    raisedBy: data.raisedBy,
    employeeCode: data.employeeCode,
    department: data.department,
    visibility: data.visibility,
    priority: data.priority,
    status: "OPEN",
    createdAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    comments: [
      {
        author: data.raisedBy,
        role: "EMPLOYEE",
        text: data.description,
        time: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ],
  };

  store.complaints = [newComp, ...store.complaints];
  saveCRMStore(store);
  return newComp;
};

export const createComplaintInStore = addComplaintInStore;

export const addComplaintCommentInStore = (
  complaintId: string,
  authorOrComment: string | { author: string; role: "ADMIN" | "EMPLOYEE"; text: string; time: string },
  role?: "ADMIN" | "EMPLOYEE",
  text?: string,
  newStatus?: ComplaintItem["status"]
) => {
  const store = getCRMStore();
  const complaint = store.complaints.find((c) => c.id === complaintId);
  if (complaint) {
    if (!complaint.comments) complaint.comments = [];
    if (typeof authorOrComment === "object") {
      complaint.comments.push(authorOrComment);
    } else {
      complaint.comments.push({
        author: authorOrComment,
        role: role || "ADMIN",
        text: text || "",
        time: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      if (newStatus) complaint.status = newStatus;
    }
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const applyAdvanceInStore = (data: {
  employee?: string;
  employeeCode?: string;
  code?: string;
  department?: string;
  amount: number;
  reason: string;
  mode?: AdvanceRequest["mode"];
  repaymentTerm?: AdvanceRequest["mode"];
  repaymentMonths?: number;
}) => {
  return createAdvanceRequestInStore({
    employeeId: "2",
    employee: data.employee || "Bharat vyas",
    code: data.code || data.employeeCode || "E001",
    department: data.department || "Operations",
    amount: data.amount,
    reason: data.reason,
    mode: data.mode || data.repaymentTerm || "SALARY_DEDUCTION",
  });
};

export const updateShopSettingsInStore = (settings: Partial<ShopSettings>) => {
  const store = getCRMStore();
  store.settings = {
    ...store.settings,
    ...settings,
    lastUpdated: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  };
  saveCRMStore(store);
  return store.settings;
};

export const addLedgerEntryInStore = (entry: Omit<LedgerEntry, "id" | "runningBalance">) => {
  const store = getCRMStore();
  const lastLedger = store.ledger.filter((l) => l.employeeCode === entry.employeeCode).pop();
  const prevBalance = lastLedger ? lastLedger.runningBalance : 0;
  const runningBalance = entry.type.includes("CREDIT") || entry.type.includes("DISBURSEMENT")
    ? prevBalance + entry.amount
    : prevBalance - entry.amount;

  const newEntry: LedgerEntry = {
    id: `led-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    ...entry,
    runningBalance,
  };
  store.ledger = [newEntry, ...store.ledger];
  saveCRMStore(store);
  return newEntry;
};

// ORDER ACTIONS
export const getOrderDateString = (order: OrderItem): string => {
  if (!order) return "";
  const createdStr = order.created || order.updatedAt || "";
  if (!createdStr) return "";
  const clean = createdStr.replace(/\s+at\s+/i, " ").trim();
  const parsed = Date.parse(clean);
  if (!isNaN(parsed) && parsed > 0) {
    const d = new Date(parsed);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
};

export const getOrderTimestamp = (order: OrderItem): number => {
  if (!order) return 0;
  if (typeof (order as any)._updatedTimestamp === "number" && (order as any)._updatedTimestamp > 0) {
    return (order as any)._updatedTimestamp;
  }
  if (typeof (order as any)._createdTimestamp === "number" && (order as any)._createdTimestamp > 0) {
    return (order as any)._createdTimestamp;
  }
  if ((order as any).updatedAt) {
    const t = Date.parse((order as any).updatedAt);
    if (!isNaN(t) && t > 0) return t;
  }
  const idMatch = String(order.id || "").match(/\d{12,14}/);
  if (idMatch) {
    const t = parseInt(idMatch[0], 10);
    if (!isNaN(t) && t > 1000000000000) return t;
  }
  if (order.created) {
    const direct = Date.parse(order.created);
    if (!isNaN(direct) && direct > 0) return direct;
    const dmy = String(order.created).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) {
      const t = new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
  }
  const codeNum = parseInt(String(order.orderCode || "").replace(/\D/g, "") || "0", 10);
  if (codeNum > 0) return codeNum;
  return 0;
};

export const sortOrdersNewestFirst = (list: OrderItem[]): OrderItem[] => {
  return [...list].sort((a, b) => {
    const timeA = getOrderTimestamp(a);
    const timeB = getOrderTimestamp(b);
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    const codeA = parseInt(String(a.orderCode || "").replace(/\D/g, "") || "0", 10);
    const codeB = parseInt(String(b.orderCode || "").replace(/\D/g, "") || "0", 10);
    return codeB - codeA;
  });
};

export const registerOrderInStore = (data: {
  orderCode?: string;
  customerName: string;
  phone: string;
  address?: string;
  itemsCount: number;
  itemsDescription?: string;
  priority?: "Normal" | "High" | "Urgent";
  receiptPhoto?: string;
  receiptPhotos?: string[];
  notes?: string;
  status?: OrderItem["status"];
  broadcastTarget?: "ALL" | "SPECIFIC";
  assignedToCode?: string;
  assignedToName?: string;
  createdByName?: string;
  createdByRole?: "ADMIN" | "EMPLOYEE";
}) => {
  const store = getCRMStore();
  const isDirectSpecific = data.broadcastTarget === "SPECIFIC" && Boolean(data.assignedToName);
  const nowTs = Date.now();
  const nowIso = new Date().toISOString();

  const newOrder: OrderItem = {
    id: `ord-${nowTs}`,
    orderCode: data.orderCode || `ORD-${String(store.orders.length + 1).padStart(4, "0")}`,
    customerName: data.customerName,
    phone: data.phone,
    address: data.address,
    itemsCount: data.itemsCount || 1,
    itemsDescription: data.itemsDescription,
    priority: data.priority || "Normal",
    receiptPhoto: (data.receiptPhotos && data.receiptPhotos.length > 0) ? data.receiptPhotos[0] : data.receiptPhoto,
    receiptPhotos: (data.receiptPhotos && data.receiptPhotos.length > 0) ? data.receiptPhotos : (data.receiptPhoto ? [data.receiptPhoto] : []),
    notes: data.notes,
    status: isDirectSpecific ? "Claimed" : (data.status || "Broadcasted"),
    claimedBy: isDirectSpecific ? data.assignedToName : undefined,
    claimedAt: isDirectSpecific
      ? new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined,
    broadcastTarget: data.broadcastTarget || (isDirectSpecific ? "SPECIFIC" : "ALL"),
    assignedToCode: data.assignedToCode,
    assignedToName: data.assignedToName,
    createdByName: data.createdByName || "System Admin",
    createdByRole: data.createdByRole || "ADMIN",
    created: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    _createdTimestamp: nowTs,
    _updatedTimestamp: nowTs,
    updatedAt: nowIso,
    _localPendingSync: true,
  };

  store.orders = [newOrder, ...(store.orders || []).filter((o) => o.id !== newOrder.id)];
  saveCRMStore(store);
  return newOrder;
};

// ROLE & PERMISSION HELPERS
export const saveRolesInStore = (roles: RoleItem[]) => {
  const store = getCRMStore();
  store.roles = roles;
  saveCRMStore(store);
  return store.roles;
};

export const canEmployeeBroadcastOrders = (employeeCode?: string): boolean => {
  const store = getCRMStore();
  if (!store.roles || store.roles.length === 0) return true;
  const empRole = store.roles.find((r) => r.name === "EMPLOYEE");
  if (!empRole) return true;
  return empRole.permissions.includes("orders.broadcast") || empRole.permissions.includes("*");
};

export const claimOrderInStore = (orderId: string, employeeName: string) => {
  const store = getCRMStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (order) {
    order.status = "Claimed";
    order.claimedBy = employeeName;
    order.packedBy = employeeName;
    order._updatedTimestamp = Date.now();
    order.updatedAt = new Date().toISOString();
    order.claimedAt = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    // Move updated order to top of list
    store.orders = [order, ...(store.orders || []).filter((o) => o.id !== orderId)];
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const updateOrderStatusInStore = (orderId: string, status: OrderItem["status"]) => {
  const store = getCRMStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    order._updatedTimestamp = Date.now();
    order.updatedAt = new Date().toISOString();
    if (status === "Delivered") {
      order.deliveredAt = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // Move updated order to top of list
    store.orders = [order, ...(store.orders || []).filter((o) => o.id !== orderId)];
    saveCRMStore(store);
    return true;
  }
  return false;
};


export const dispatchOrderInStore = (
  orderId: string,
  data: {
    deliveryMode: "DRIVER" | "CUSTOMER_PICKUP";
    driverName?: string;
    driverCode?: string;
    driverPhone?: string;
    vehicleNumber?: string;
    notes?: string;
  }
): boolean => {
  const store = getCRMStore();
  const order = (store.orders || []).find((o) => o.id === orderId);
  if (!order) return false;

  const nowFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  order.deliveryMode = data.deliveryMode;
  if (data.notes) order.deliveryNotes = data.notes;
  order._updatedTimestamp = Date.now();
  order.updatedAt = new Date().toISOString();

  if (data.deliveryMode === "CUSTOMER_PICKUP") {
    order.status = "Delivered";
    order.deliveredAt = nowFormatted;
    order.handoverToCustomerAt = nowFormatted;
  } else {
    order.status = "In Transit";
    order.assignedDriverName = data.driverName || "Assigned Driver";
    order.assignedDriverCode = data.driverCode || "";
    order.assignedDriverPhone = data.driverPhone || "";
    order.assignedVehicleNumber = data.vehicleNumber || "";
    order.inTransitAt = nowFormatted;
  }

  store.orders = [order, ...(store.orders || []).filter((o) => o.id !== orderId)];
  saveCRMStore(store);
  return true;
};

export const completeOrderDeliveryInStore = (
  orderId: string,
  data?: { notes?: string }
): boolean => {
  const store = getCRMStore();
  const order = (store.orders || []).find((o) => o.id === orderId);
  if (!order) return false;

  const nowFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  order.status = "Delivered";
  order.deliveredAt = nowFormatted;
  if (data?.notes) {
    order.deliveryNotes = data.notes;
  }
  order._updatedTimestamp = Date.now();
  order.updatedAt = new Date().toISOString();

  store.orders = [order, ...(store.orders || []).filter((o) => o.id !== orderId)];
  saveCRMStore(store);
  return true;
};

export const editOrderInStore = (orderId: string, updates: Partial<OrderItem>): boolean => {
  const store = getCRMStore();
  const index = (store.orders || []).findIndex((o) => o.id === orderId);
  if (index === -1) return false;
  const existing = store.orders[index];

  // Prevent edit if already in transit / ready / delivered
  if (existing.status === "Ready" || existing.status === "Delivered") {
    return false;
  }

  const nowTs = Date.now();
  const nowIso = new Date().toISOString();

  let finalPhotos = updates.receiptPhotos;
  if (!finalPhotos || finalPhotos.length === 0) {
    if (updates.receiptPhoto) {
      finalPhotos = [updates.receiptPhoto];
    } else if (existing.receiptPhotos && existing.receiptPhotos.length > 0) {
      finalPhotos = existing.receiptPhotos;
    } else if (existing.receiptPhoto) {
      finalPhotos = [existing.receiptPhoto];
    } else {
      finalPhotos = [];
    }
  }

  const finalSinglePhoto = finalPhotos[0] || updates.receiptPhoto || existing.receiptPhoto;

  const updatedOrder: OrderItem = {
    ...existing,
    ...updates,
    receiptPhoto: finalSinglePhoto,
    receiptPhotos: finalPhotos,
    _updatedTimestamp: nowTs,
    updatedAt: nowIso,
  };

  store.orders[index] = updatedOrder;
  saveCRMStore(store);
  return true;
};

export const deleteOrderInStore = (orderId: string) => {
  addDeletedOrderId(orderId);
  const store = getCRMStore();
  store.orders = (store.orders || []).filter((o) => o.id !== orderId);
  if (!store.deletedOrderIds) store.deletedOrderIds = [];
  if (!store.deletedOrderIds.includes(orderId)) {
    store.deletedOrderIds.push(orderId);
  }
  const allDeleted = Array.from(getDeletedOrderIds());
  saveCRMStore(store, { deletedOrderIds: allDeleted });
  return true;
};

// TASK ACTIONS
export const createTaskInStore = (data: {
  title: string;
  description?: string;
  priority?: "Normal" | "High" | "Urgent";
  due: string;
  assignee: string;
  assigneeCode?: string;
}) => {
  const store = getCRMStore();
  const newTask: TaskItem = {
    id: `tsk-${Date.now()}`,
    title: data.title,
    description: data.description,
    priority: data.priority || "Normal",
    status: "In Progress",
    due: data.due,
    assignee: data.assignee,
    assigneeCode: data.assigneeCode || "E001",
    created: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  store.tasks = [newTask, ...store.tasks];
  saveCRMStore(store);
  return newTask;
};

export const submitTaskEvidenceInStore = (
  taskId: string,
  evidenceNote: string,
  evidenceFile?: string
) => {
  const store = getCRMStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = "Submitted";
    task.evidenceNote = evidenceNote;
    task.evidenceFile = evidenceFile;
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const reviewTaskInStore = (
  taskId: string,
  action: "APPROVE" | "REJECT" | "Approved" | "Rejected",
  rejectReason?: string
) => {
  const store = getCRMStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (task) {
    if (action === "APPROVE" || action === "Approved") {
      task.status = "Completed";
    } else {
      task.status = "In Progress";
      if (rejectReason) {
        task.evidenceNote = `[REJECTED: ${rejectReason}] Previous note: ${task.evidenceNote || ""}`;
      }
    }
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const updateTaskStatusInStore = (taskId: string, status: TaskItem["status"]) => {
  const store = getCRMStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = status;
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const deleteTaskInStore = (taskId: string) => {
  const store = getCRMStore();
  store.tasks = store.tasks.filter((t) => t.id !== taskId);
  saveCRMStore(store, { deletedTaskIds: [taskId] });
  return true;
};

// SHIFT / ATTENDANCE ACTIONS
export const checkInEmployeeInStore = (data: {
  employeeCode: string;
  employeeName: string;
  department?: string;
  distanceM?: number;
  verifiedViaQR?: boolean;
  latitude?: number;
  longitude?: number;
  accuracyM?: number;
}) => {
  const store = getCRMStore();
  const allowedRadius = store.settings?.geofenceRadiusM || 10;
  if (!data.verifiedViaQR && typeof data.distanceM === "number" && data.distanceM > allowedRadius) {
    throw new Error(`Location outside geofence: ${data.distanceM}m exceeds allowed shop limit of ${allowedRadius}m.`);
  }
  const now = new Date();
  const today = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const nowTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const activeShift: ActiveShiftState = {
    employeeCode: data.employeeCode,
    employeeName: data.employeeName,
    department: data.department || "Operations",
    shiftState: "ACTIVE",
    checkInTime: nowTime,
    checkInTimestamp: Date.now(),
    totalBreakSeconds: 0,
    date: today,
    distanceM: data.distanceM ?? 20,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracyM: data.accuracyM,
    lastActivityTimestamp: Date.now(),
    lastActivityDescription: "Shift Check-In",
  };

  if (!store.activeShifts) store.activeShifts = {};
  store.activeShifts[data.employeeCode] = activeShift;

  // Sync to attendance record
  const existingIndex = store.attendance.findIndex(
    (a) => a.employeeCode === data.employeeCode && a.date === today
  );

  const attRecord: AttendanceRecord = {
    id: `att-${Date.now()}`,
    employeeName: data.employeeName,
    employeeCode: data.employeeCode,
    department: data.department || "Operations",
    date: today,
    checkIn: nowTime,
    checkOut: "—",
    workedHours: 0,
    overtimeHours: 0,
    classification: "PARTIAL_DAY",
    status: "Present",
    distanceM: data.distanceM ?? 20,
  };

  if (existingIndex >= 0) {
    store.attendance[existingIndex] = {
      ...store.attendance[existingIndex],
      status: "Present",
      checkIn: nowTime,
      checkOut: "—",
      distanceM: data.distanceM ?? 20,
    };
  } else {
    store.attendance = [attRecord, ...store.attendance];
  }

  saveCRMStore(store);
  return activeShift;
};

/**
 * Dynamically computes worked hours for active or completed attendance records
 */
export const getDynamicWorkedHours = (
  record: AttendanceRecord,
  shift?: ActiveShiftState | null
): { hours: number; mins: number; display: string } => {
  // If completed and checkOut exists
  if (record.checkOut && record.checkOut !== "—" && record.workedHours > 0) {
    const mins = Math.round(record.workedHours * 60);
    return {
      hours: record.workedHours,
      mins,
      display: `${record.workedHours} hrs`,
    };
  }

  // If on duty (shift is active or record has unclosed checkIn)
  if (record.status === "Present" || (shift && (shift.shiftState === "ACTIVE" || shift.shiftState === "ON_BREAK"))) {
    let checkInTimestamp = shift?.checkInTimestamp;

    if (!checkInTimestamp && record.checkIn && record.checkIn !== "—") {
      try {
        const parts = record.checkIn.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
        if (parts) {
          let h = parseInt(parts[1], 10);
          const m = parseInt(parts[2], 10);
          const ampm = parts[3]?.toUpperCase();
          if (ampm === "PM" && h < 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
          const d = new Date();
          d.setHours(h, m, 0, 0);
          checkInTimestamp = d.getTime();
        }
      } catch {}
    }

    if (checkInTimestamp) {
      const store = getCRMStore();
      const allowedBreakSec = ((store.settings?.allowedBreakMinutes != null ? store.settings.allowedBreakMinutes : 60)) * 60;
      const ongoingBreak = shift?.breakStartedAt ? Math.floor((Date.now() - shift.breakStartedAt) / 1000) : 0;
      const totalBreakSec = (shift?.totalBreakSeconds || 0) + ongoingBreak;
      const excessBreakSec = Math.max(0, totalBreakSec - allowedBreakSec);

      const grossElapsedSec = Math.max(0, Math.floor((Date.now() - checkInTimestamp) / 1000));
      const netWorkedSec = Math.max(0, grossElapsedSec - excessBreakSec);
      const hours = Math.floor(netWorkedSec / 3600);
      const mins = Math.floor((netWorkedSec % 3600) / 60);
      const totalMins = Math.floor(netWorkedSec / 60);
      const decimal = Number((netWorkedSec / 3600).toFixed(1));
      const activeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      return {
        hours: decimal,
        mins: totalMins,
        display: `${decimal} hrs (${activeStr} active)`,
      };
    }
  }

  return {
    hours: record.workedHours || 0,
    mins: Math.round((record.workedHours || 0) * 60),
    display: record.workedHours > 0 ? `${record.workedHours} hrs` : "0 hrs",
  };
};

export const findActiveShiftInStore = (
  store: CRMStoreData,
  employeeCode: string,
  employeeName?: string
): ActiveShiftState | null => {
  if (!store.activeShifts) store.activeShifts = {};
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  const cleanCode = (employeeCode || "").trim().toLowerCase();
  const cleanName = (employeeName || "").trim().toLowerCase();

  // 1. Direct exact key match
  if (employeeCode && store.activeShifts[employeeCode]) {
    const s = store.activeShifts[employeeCode];
    if (s.date === today) return s;
  }

  // 2. Case-insensitive key match
  for (const key of Object.keys(store.activeShifts)) {
    if (cleanCode && key.toLowerCase() === cleanCode) {
      const s = store.activeShifts[key];
      if (s.date === today) return s;
    }
  }

  // 3. Match employeeCode or employeeName property inside shift object
  for (const s of Object.values(store.activeShifts)) {
    if (s.date === today) {
      if (cleanCode && s.employeeCode && s.employeeCode.toLowerCase() === cleanCode) return s;
      if (cleanName && s.employeeName && s.employeeName.toLowerCase() === cleanName) return s;
    }
  }

  // 4. Match via store.employees
  const emp = (store.employees || []).find(
    (e) =>
      (cleanCode && (e.code.toLowerCase() === cleanCode || e.id.toLowerCase() === cleanCode)) ||
      (cleanName && e.name.toLowerCase() === cleanName)
  );
  if (emp) {
    if (store.activeShifts[emp.code] && store.activeShifts[emp.code].date === today) {
      return store.activeShifts[emp.code];
    }
    if (store.activeShifts[emp.id] && store.activeShifts[emp.id].date === today) {
      return store.activeShifts[emp.id];
    }
  }

  return null;
};

export const getActiveShift = (employeeCode: string, employeeName?: string): ActiveShiftState | null => {
  const store = getCRMStore();
  const shift = findActiveShiftInStore(store, employeeCode, employeeName);
  if (shift) return shift;

  // Fallback auto-hydration: If employee is marked Present today in attendance without checkout, hydrate shift!
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const cleanCode = (employeeCode || "").trim().toLowerCase();
  const cleanName = (employeeName || "").trim().toLowerCase();

  const att = (store.attendance || []).find(
    (a) =>
      a.date === today &&
      a.status === "Present" &&
      (!a.checkOut || a.checkOut === "—" || a.checkOut.trim() === "") &&
      ((cleanCode && a.employeeCode.toLowerCase() === cleanCode) ||
        (cleanName && a.employeeName.toLowerCase() === cleanName))
  );

  if (att) {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const hydratedShift: ActiveShiftState = {
      employeeCode: att.employeeCode || employeeCode,
      employeeName: att.employeeName || employeeName || "Employee",
      department: att.department || "Operations",
      shiftState: "ACTIVE",
      checkInTime: att.checkIn || nowTime,
      checkInTimestamp: Date.now() - 3600000,
      totalBreakSeconds: 0,
      date: today,
      distanceM: att.distanceM || 5,
    };
    if (!store.activeShifts) store.activeShifts = {};
    store.activeShifts[hydratedShift.employeeCode] = hydratedShift;
    if (employeeCode && employeeCode !== hydratedShift.employeeCode) {
      store.activeShifts[employeeCode] = hydratedShift;
    }
    saveCRMStore(store);
    return hydratedShift;
  }

  return null;
};

export const startBreakInStore = (employeeCode: string, employeeName?: string) => {
  const store = getCRMStore();
  if (!store.activeShifts) store.activeShifts = {};
  let shift = findActiveShiftInStore(store, employeeCode, employeeName);
  if (!shift) {
    shift = getActiveShift(employeeCode, employeeName);
  }

  if (shift) {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    shift.shiftState = "ON_BREAK";
    shift.breakStartedAt = Date.now();
    shift.breakStartTime = nowTime;

    store.activeShifts[shift.employeeCode] = shift;
    if (employeeCode && employeeCode !== shift.employeeCode) {
      store.activeShifts[employeeCode] = shift;
    }

    saveCRMStore(store);
    return true;
  }
  return false;
};

export const endBreakInStore = (employeeCode: string, employeeName?: string) => {
  const store = getCRMStore();
  if (!store.activeShifts) store.activeShifts = {};
  let shift = findActiveShiftInStore(store, employeeCode, employeeName);
  if (!shift) {
    shift = getActiveShift(employeeCode, employeeName);
  }

  if (shift) {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (shift.breakStartedAt) {
      const elapsed = Math.max(0, Math.floor((Date.now() - shift.breakStartedAt) / 1000));
      shift.totalBreakSeconds = (shift.totalBreakSeconds || 0) + elapsed;
      shift.breakStartedAt = undefined;
    }
    shift.breakEndTime = nowTime;
    shift.shiftState = "ACTIVE";

    store.activeShifts[shift.employeeCode] = shift;
    if (employeeCode && employeeCode !== shift.employeeCode) {
      store.activeShifts[employeeCode] = shift;
    }

    saveCRMStore(store);
    return true;
  }
  return false;
};

export const checkOutEmployeeInStore = (employeeCode: string, employeeName?: string) => {
  const store = getCRMStore();
  if (!store.activeShifts) store.activeShifts = {};
  let shift = findActiveShiftInStore(store, employeeCode, employeeName);
  if (!shift) {
    shift = getActiveShift(employeeCode, employeeName);
  }

  if (shift) {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    shift.shiftState = "COMPLETED";
    shift.checkOutTime = nowTime;
    shift.checkOutTimestamp = Date.now();

    if (shift.breakStartedAt) {
      shift.totalBreakSeconds = (shift.totalBreakSeconds || 0) + Math.max(0, Math.floor((Date.now() - shift.breakStartedAt) / 1000));
      shift.breakStartedAt = undefined;
    }

    const allowedBreakSec = ((store.settings?.allowedBreakMinutes != null ? store.settings.allowedBreakMinutes : 60)) * 60;
    const totalBreakSec = shift.totalBreakSeconds || 0;
    const excessBreakSec = Math.max(0, totalBreakSec - allowedBreakSec);

    const grossElapsedSec = Math.max(0, Math.floor(((shift.checkOutTimestamp || Date.now()) - shift.checkInTimestamp) / 1000));
    const netWorkedSec = Math.max(0, grossElapsedSec - excessBreakSec);
    const totalHours = Number((netWorkedSec / 3600).toFixed(1));
    const requiredHours = Number(store.settings?.requiredDailyHours) || 12;
    const classification: AttendanceRecord["classification"] =
      totalHours >= requiredHours ? "FULL_DAY" : totalHours >= requiredHours / 2 ? "HALF_DAY" : "PARTIAL_DAY";
    const overtimeHours = 0; // Overtime strictly 0 per policy

    // Update in store.attendance
    const today = shift.date;
    const existingIndex = store.attendance.findIndex(
      (a) => (a.employeeCode === shift.employeeCode || a.employeeCode === employeeCode) && a.date === today
    );
    if (existingIndex >= 0) {
      store.attendance[existingIndex] = {
        ...store.attendance[existingIndex],
        checkOut: nowTime,
        workedHours: totalHours,
        overtimeHours: 0,
        classification,
        status: "Present",
      };
    }

    store.activeShifts[shift.employeeCode] = shift;
    if (employeeCode && employeeCode !== shift.employeeCode) {
      store.activeShifts[employeeCode] = shift;
    }

    saveCRMStore(store);
    return shift;
  }
  return null;
};

export const resetShiftForEmployeeInStore = (employeeCode: string) => {
  const store = getCRMStore();
  if (store.activeShifts && store.activeShifts[employeeCode]) {
    delete store.activeShifts[employeeCode];
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const updateAttendanceRecordInStore = (record: AttendanceRecord) => {
  const store = getCRMStore();
  const index = store.attendance.findIndex((a) => a.id === record.id);
  if (index >= 0) {
    store.attendance[index] = record;
  } else {
    store.attendance = [record, ...store.attendance];
  }
  saveCRMStore(store);
  return true;
};

export const autoCheckOutAllActiveEmployeesInStore = (options?: { checkOutTime?: string }) => {
  const store = getCRMStore();
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const shiftEndTime = store.settings?.shiftEnd || "20:00"; // default 8:00 PM (20:00)
  const shiftStartTime = store.settings?.shiftStart || "08:00"; // default 8:00 AM (08:00)
  const requiredHours = Number(store.settings?.requiredDailyHours) || 12;

  // Capped checkout time logic:
  // If admin closes at 9:00 PM (or 10 PM) and shift ends at 8:00 PM,
  // the auto-checkout timestamp is capped at shiftEndTime ("20:00") so NO extra 1 hour overtime is counted!
  const currentFormattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  let targetCheckOutTime = shiftEndTime;

  if (options?.checkOutTime) {
    targetCheckOutTime = options.checkOutTime;
  } else {
    try {
      const [nowH, nowM] = currentFormattedTime.replace(/[^0-9:]/g, "").split(":").map(Number);
      const [seH, seM] = shiftEndTime.replace(/[^0-9:]/g, "").split(":").map(Number);
      const nowTotalMins = (nowH || 0) * 60 + (nowM || 0);
      const seTotalMins = (seH || 0) * 60 + (seM || 0);

      // If closing earlier than shift end (e.g. 6:30 PM), use early close time
      // If closing at or after shift end (e.g. 9:00 PM), CAP strictly at shiftEnd!
      if (nowTotalMins < seTotalMins) {
        targetCheckOutTime = currentFormattedTime;
      } else {
        targetCheckOutTime = shiftEndTime;
      }
    } catch {
      targetCheckOutTime = shiftEndTime;
    }
  }

  if (!store.activeShifts) store.activeShifts = {};
  if (!store.attendance) store.attendance = [];

  let count = 0;

  // 1. Process attendance records
  store.attendance = store.attendance.map((rec) => {
    if (rec.date === todayStr && rec.status === "Present") {
      const hasCheckedOut = rec.checkOut && rec.checkOut !== "—" && rec.checkOut.trim() !== "";
      // CRITICAL: Preserve existing manual checkout untouched!
      if (hasCheckedOut) {
        return rec;
      }

      count++;
      const checkInStr = rec.checkIn || shiftStartTime;

      // Calculate worked hours, strictly CAPPED at requiredHours (0 overtime)
      let worked = requiredHours;
      try {
        const [ciH, ciM] = checkInStr.replace(/[^0-9:]/g, "").split(":").map(Number);
        const [coH, coM] = targetCheckOutTime.replace(/[^0-9:]/g, "").split(":").map(Number);
        if (!isNaN(ciH) && !isNaN(coH)) {
          const diffMins = (coH * 60 + (coM || 0)) - (ciH * 60 + (ciM || 0));
          worked = Math.max(0, Math.min(requiredHours, Number((diffMins / 60).toFixed(1))));
        }
      } catch {
        worked = requiredHours;
      }

      const classification: AttendanceRecord["classification"] =
        worked >= requiredHours ? "FULL_DAY" : worked >= requiredHours / 2 ? "HALF_DAY" : "PARTIAL_DAY";

      return {
        ...rec,
        checkOut: targetCheckOutTime,
        workedHours: worked,
        overtimeHours: 0, // STRICTLY ZERO OVERTIME
        classification,
        status: "Present" as const,
      };
    }
    return rec;
  });

  // 2. Close active shifts for today
  Object.keys(store.activeShifts).forEach((empCode) => {
    const shift = store.activeShifts[empCode];
    if (shift && shift.date === todayStr && (shift.shiftState === "ACTIVE" || shift.shiftState === "ON_BREAK")) {
      shift.shiftState = "COMPLETED";
      shift.checkOutTime = targetCheckOutTime;
      shift.checkOutTimestamp = Date.now();
      if (shift.breakStartedAt) {
        shift.totalBreakSeconds = (shift.totalBreakSeconds || 0) + Math.max(0, Math.floor((Date.now() - shift.breakStartedAt) / 1000));
        shift.breakStartedAt = undefined;
      }
    }
  });

  saveCRMStore(store);
  return {
    success: true,
    checkedOutCount: count,
    checkOutTime: targetCheckOutTime,
  };
};
