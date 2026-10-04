"use client";

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
  status: "Draft" | "Broadcasted" | "Claimed" | "Packing" | "Packed" | "Ready" | "Delivered" | "Cancelled";
  claimedBy?: string;
  claimedAt?: string;
  deliveredAt?: string;
  notes?: string;
  created: string;
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
  totalBreakSeconds: number;
  date: string;
  distanceM: number;
}

export interface CRMStoreData {
  settings: ShopSettings;
  employees: EmployeeItem[];
  advances: AdvanceRequest[];
  ledger: LedgerEntry[];
  orders: OrderItem[];
  tasks: TaskItem[];
  attendance: AttendanceRecord[];
  activeShifts: Record<string, ActiveShiftState>;
  corrections: CorrectionItem[];
  leaves: LeaveRequest[];
  complaints: ComplaintItem[];
}

// Clean baseline store data for clean real-time operational use
export const cleanBaselineStore: CRMStoreData = {
  settings: {
    shopName: "Vyas Enterprises & Wholesale Hub",
    ownerName: "Bharat Vyas",
    phone: "9829012345",
    email: "contact@vyasenterprises.com",
    address: "Plot 42, Wholesale Trade Center, Ring Road",
    latitude: 26.9124,
    longitude: 75.7873,
    geofenceRadiusM: 200,
    shiftStart: "09:00",
    shiftEnd: "19:00",
    requiredDailyHours: 10,
    gracePeriodMinutes: 15,
    qrRotationSeconds: 45,
    lastUpdated: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  },
  activeShifts: {},
  employees: [
    {
      id: "1",
      code: "ADMIN001",
      name: "System Administrator",
      email: "admin@crm.com",
      department: "Management",
      designation: "Administrator",
      type: "Full Time",
      status: "Active",
      joined: "Oct 01, 2026",
      phone: "9999999999",
      initialPassword: "admin123",
      baseSalary: 75000,
      bankAccount: "987654321098",
      bankIfsc: "HDFC0001234",
      upiId: "admin@okhdfc",
      casualLeaves: 12,
      sickLeaves: 8,
    },
    {
      id: "2",
      code: "E001",
      name: "Bharat vyas",
      email: "bharat1@crm.com",
      department: "Operations",
      designation: "Supervisor",
      type: "Full Time",
      status: "Active",
      joined: "Oct 01, 2026",
      phone: "08005567626",
      initialPassword: "Emp@2026",
      baseSalary: 35000,
      bankAccount: "112233445566",
      bankIfsc: "SBIN0004321",
      upiId: "bharat@oksbi",
      casualLeaves: 8,
      sickLeaves: 6.5,
    },
    {
      id: "3",
      code: "EMP002",
      name: "Priya Sharma",
      email: "priya@crm.com",
      department: "Sales",
      designation: "Senior Sales Lead",
      type: "Full Time",
      status: "Active",
      joined: "Jan 15, 2025",
      phone: "9876501234",
      initialPassword: "Emp@2026",
      baseSalary: 32000,
      bankAccount: "998877665544",
      bankIfsc: "HDFC0001234",
      upiId: "priya@okhdfc",
      casualLeaves: 10,
      sickLeaves: 8,
    },
  ],
  advances: [],
  ledger: [],
  orders: [],
  tasks: [],
  attendance: [],
  corrections: [],
  leaves: [],
  complaints: [],
};

const STORAGE_KEY = "wcrm_unified_store_v2";

export const getCRMStore = (): CRMStoreData => {
  if (typeof window === "undefined") return cleanBaselineStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanBaselineStore));
      return cleanBaselineStore;
    }
    const parsed = JSON.parse(raw);
    return {
      ...cleanBaselineStore,
      ...parsed,
      activeShifts: parsed.activeShifts || {},
      orders: parsed.orders || [],
      tasks: parsed.tasks || [],
      attendance: parsed.attendance || [],
      corrections: parsed.corrections || [],
      complaints: parsed.complaints || [],
      advances: parsed.advances || [],
      leaves: parsed.leaves || [],
      ledger: parsed.ledger || [],
      employees: parsed.employees || cleanBaselineStore.employees,
      settings: parsed.settings || cleanBaselineStore.settings,
    };
  } catch (err) {
    console.error("Failed to load store:", err);
    return cleanBaselineStore;
  }
};

export const saveCRMStore = (data: CRMStoreData) => {
  if (typeof window === "undefined") return;
  try {
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
    pushStoreToCloud(data);
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

// ORDER ACTIONS
export const registerOrderInStore = (data: {
  orderCode: string;
  customerName: string;
  phone: string;
  address?: string;
  itemsCount: number;
  itemsDescription?: string;
  priority?: "Normal" | "High" | "Urgent";
  receiptPhoto?: string;
  notes?: string;
  status?: OrderItem["status"];
}) => {
  const store = getCRMStore();
  const newOrder: OrderItem = {
    id: `ord-${Date.now()}`,
    orderCode: data.orderCode || `ORD-${String(store.orders.length + 1).padStart(4, "0")}`,
    customerName: data.customerName,
    phone: data.phone,
    address: data.address,
    itemsCount: data.itemsCount || 1,
    itemsDescription: data.itemsDescription,
    priority: data.priority || "Normal",
    receiptPhoto: data.receiptPhoto,
    notes: data.notes,
    status: data.status || "Broadcasted",
    created: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  store.orders = [newOrder, ...store.orders];
  saveCRMStore(store);
  return newOrder;
};

export const claimOrderInStore = (orderId: string, employeeName: string) => {
  const store = getCRMStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (order) {
    order.status = "Claimed";
    order.claimedBy = employeeName;
    order.claimedAt = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    if (status === "Delivered") {
      order.deliveredAt = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const deleteOrderInStore = (orderId: string) => {
  const store = getCRMStore();
  store.orders = store.orders.filter((o) => o.id !== orderId);
  saveCRMStore(store);
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
  saveCRMStore(store);
  return true;
};

// SHIFT / ATTENDANCE ACTIONS
export const checkInEmployeeInStore = (data: {
  employeeCode: string;
  employeeName: string;
  department?: string;
  distanceM?: number;
}) => {
  const store = getCRMStore();
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
    workedHours: 0.1,
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
      distanceM: data.distanceM ?? 20,
    };
  } else {
    store.attendance = [attRecord, ...store.attendance];
  }

  saveCRMStore(store);
  return activeShift;
};

export const startBreakInStore = (employeeCode: string) => {
  const store = getCRMStore();
  if (!store.activeShifts) store.activeShifts = {};
  if (store.activeShifts[employeeCode]) {
    store.activeShifts[employeeCode].shiftState = "ON_BREAK";
    store.activeShifts[employeeCode].breakStartedAt = Date.now();
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const endBreakInStore = (employeeCode: string) => {
  const store = getCRMStore();
  if (!store.activeShifts) store.activeShifts = {};
  if (store.activeShifts[employeeCode]) {
    const shift = store.activeShifts[employeeCode];
    if (shift.breakStartedAt) {
      shift.totalBreakSeconds = (shift.totalBreakSeconds || 0) + Math.max(0, Math.floor((Date.now() - shift.breakStartedAt) / 1000));
      shift.breakStartedAt = undefined;
    }
    shift.shiftState = "ACTIVE";
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const checkOutEmployeeInStore = (employeeCode: string) => {
  const store = getCRMStore();
  if (!store.activeShifts) store.activeShifts = {};
  if (store.activeShifts[employeeCode]) {
    const shift = store.activeShifts[employeeCode];
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    shift.shiftState = "COMPLETED";
    shift.checkOutTime = nowTime;
    shift.checkOutTimestamp = Date.now();

    if (shift.breakStartedAt) {
      shift.totalBreakSeconds = (shift.totalBreakSeconds || 0) + Math.max(0, Math.floor((Date.now() - shift.breakStartedAt) / 1000));
      shift.breakStartedAt = undefined;
    }

    const totalSeconds = Math.max(0, Math.floor((Date.now() - shift.checkInTimestamp) / 1000) - (shift.totalBreakSeconds || 0));
    const totalHours = Number((totalSeconds / 3600).toFixed(1));
    const overtimeHours = totalHours > 10 ? Number((totalHours - 10).toFixed(1)) : 0;
    const classification: AttendanceRecord["classification"] = totalHours >= 8 ? "FULL_DAY" : totalHours >= 4 ? "HALF_DAY" : "PARTIAL_DAY";

    // Update in store.attendance
    const today = shift.date;
    const existingIndex = store.attendance.findIndex(
      (a) => a.employeeCode === employeeCode && a.date === today
    );
    if (existingIndex >= 0) {
      store.attendance[existingIndex] = {
        ...store.attendance[existingIndex],
        checkOut: nowTime,
        workedHours: totalHours,
        overtimeHours,
        classification,
        status: "Present",
      };
    }

    saveCRMStore(store);
    return shift;
  }
  return null;
};

export const getActiveShift = (employeeCode: string): ActiveShiftState | null => {
  const store = getCRMStore();
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const shift = store.activeShifts?.[employeeCode];
  if (!shift) return null;
  if (shift.date !== today && shift.shiftState === "ACTIVE") {
    shift.shiftState = "COMPLETED";
  }
  return shift;
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
