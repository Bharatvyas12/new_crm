"use client";

// Centralized Reactive Client Store with localStorage persistence for clean client testing

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

// Clean baseline store data for clean client testing
const cleanBaselineStore: CRMStoreData = {
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
    lastUpdated: "Today",
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
  advances: [
    {
      id: "adv-1",
      employeeId: "2",
      employee: "Bharat vyas",
      code: "E001",
      department: "Operations",
      amount: 8000,
      outstanding: 8000,
      reason: "Medical emergency in family",
      mode: "SALARY_DEDUCTION",
      status: "Pending Approval",
      requestedAt: "Sep 30, 2026",
    },
  ],
  ledger: [
    {
      id: "led-1",
      employeeName: "Bharat vyas",
      employeeCode: "E001",
      type: "SALARY_CREDIT",
      amount: 35000,
      paymentMode: "Bank Transfer",
      referenceNo: "NEFT-HDFC-99214",
      description: "Monthly salary payout for September 2026",
      date: "Oct 01, 2026, 10:30 AM",
      runningBalance: 35000,
    },
  ],
  orders: [
    {
      id: "ord-1",
      orderCode: "ORD-0001",
      customerName: "Rahul Enterprises",
      phone: "9876543210",
      address: "Shop 14, Main Wholesale Market",
      itemsCount: 15,
      itemsDescription: "10x Industrial Cable rolls, 5x Switch boxes",
      priority: "High",
      receiptPhoto: "parchi_slip_01.jpg",
      status: "Broadcasted",
      notes: "Deliver before 5:00 PM today",
      created: "Sep 28, 2026, 08:59 AM",
    },
  ],
  tasks: [
    {
      id: "tsk-1",
      title: "Warehouse Inventory Audit — Bay A",
      description: "Perform physical count of all stock items in Bay A and report discrepancies.",
      priority: "High",
      status: "In Progress",
      due: "Today, 5:00 PM",
      assignee: "Bharat vyas",
      assigneeCode: "E001",
      created: "Oct 03, 2026, 09:00 AM",
    },
    {
      id: "tsk-2",
      title: "Equipment Calibration — Packaging Line 3",
      description: "Calibrate packaging machines and upload inspection verification.",
      priority: "Urgent",
      status: "Submitted",
      due: "Oct 03, 2026, 02:00 PM",
      assignee: "Bharat vyas",
      assigneeCode: "E001",
      created: "Oct 02, 2026, 04:00 PM",
      evidenceNote: "Machine pressure calibrated to 14.5 bar according to factory checklist.",
      evidenceFile: "calibration_report.pdf",
    },
  ],
  attendance: [
    {
      id: "att-1",
      employeeName: "Bharat vyas",
      employeeCode: "E001",
      department: "Operations",
      date: "Oct 03, 2026",
      checkIn: "08:55 AM",
      checkOut: "—",
      workedHours: 3.6,
      overtimeHours: 0,
      classification: "PARTIAL_DAY",
      status: "Present",
      distanceM: 25,
    },
    {
      id: "att-2",
      employeeName: "Priya Sharma",
      employeeCode: "EMP002",
      department: "Sales",
      date: "Oct 03, 2026",
      checkIn: "—",
      checkOut: "—",
      workedHours: 0,
      overtimeHours: 0,
      classification: "ABSENT",
      status: "Absent",
      distanceM: 0,
    },
  ],
  corrections: [
    {
      id: "corr-1",
      employee: "Bharat vyas",
      code: "E001",
      department: "Operations",
      date: "Oct 01, 2026",
      originalTime: "Missed checkout (Auto 00:00)",
      requestedTime: "07:05 PM",
      reason: "Phone battery died while packing final customer shipment at counter.",
      status: "Pending",
      submittedAt: "Oct 01, 2026, 08:00 PM",
    },
    {
      id: "corr-2",
      employee: "Priya Sharma",
      code: "EMP002",
      department: "Sales",
      date: "Sep 30, 2026",
      originalTime: "09:40 AM (Late Check-in)",
      requestedTime: "09:00 AM",
      reason: "Direct client showroom meeting at Wholesale Center before reaching desk.",
      status: "Pending",
      submittedAt: "Sep 30, 2026, 10:00 AM",
    },
  ],
  leaves: [
    {
      id: "lv-1",
      employeeName: "Priya Sharma",
      employeeCode: "EMP002",
      department: "Sales",
      leaveType: "Casual Leave",
      startDate: "Oct 06, 2026",
      endDate: "Oct 07, 2026",
      period: "FULL_DAY",
      days: 2,
      reason: "Family function in hometown",
      status: "PENDING",
      appliedAt: "2 hours ago",
      balanceRemaining: 8,
      totalEntitlement: 12,
    },
    {
      id: "lv-2",
      employeeName: "Bharat vyas",
      employeeCode: "E001",
      department: "Operations",
      leaveType: "Casual Leave",
      startDate: "Oct 08, 2026",
      endDate: "Oct 09, 2026",
      period: "FULL_DAY",
      days: 2,
      reason: "Outstation urgent personal work",
      status: "PENDING",
      appliedAt: "1 day ago",
      balanceRemaining: 8,
      totalEntitlement: 12,
    },
  ],
  complaints: [
    {
      id: "comp-1",
      category: "Facility / Cleanliness",
      subject: "Water cooler purifier filter replacement needed",
      description: "The drinking water cooler near the packing bay has red indicator on. Filter needs replacement.",
      raisedBy: "Bharat vyas",
      employeeCode: "E001",
      department: "Operations",
      visibility: "PUBLIC",
      priority: "MEDIUM",
      status: "OPEN",
      createdAt: "Oct 02, 2026, 11:30 AM",
      comments: [
        {
          author: "Bharat vyas",
          role: "EMPLOYEE",
          text: "Water flow is slow and filter light is red.",
          time: "Oct 02, 2026, 11:30 AM",
        },
      ],
    },
    {
      id: "comp-2",
      category: "Equipment & Tools",
      subject: "Tape dispenser and thermal label roll shortage",
      description: "Packaging bay running low on 3-inch brown packing tape rolls for outgoing dispatches.",
      raisedBy: "Priya Sharma",
      employeeCode: "EMP002",
      department: "Sales",
      visibility: "EMPLOYEE_PRIVATE",
      priority: "HIGH",
      status: "UNDER_INVESTIGATION",
      createdAt: "Oct 01, 2026, 03:15 PM",
      comments: [
        {
          author: "Priya Sharma",
          role: "EMPLOYEE",
          text: "Only 2 rolls left in stock.",
          time: "Oct 01, 2026, 03:15 PM",
        },
        {
          author: "System Admin",
          role: "ADMIN",
          text: "Vendor purchase order PO-8812 placed with local supplier. Delivery expected tomorrow morning.",
          time: "Oct 01, 2026, 04:30 PM",
        },
      ],
    },
  ],
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
    // Ensure all arrays exist
    return {
      ...cleanBaselineStore,
      ...parsed,
      activeShifts: parsed.activeShifts || cleanBaselineStore.activeShifts || {},
      orders: parsed.orders || cleanBaselineStore.orders,
      tasks: parsed.tasks || cleanBaselineStore.tasks,
      attendance: parsed.attendance || cleanBaselineStore.attendance,
      corrections: parsed.corrections || cleanBaselineStore.corrections,
      complaints: parsed.complaints || cleanBaselineStore.complaints,
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
      } catch (e) {
        // fallback
      }
    }
  } catch (err) {
    console.error("Failed to save store:", err);
  }
};

export const resetCRMStoreToClean = () => {
  if (typeof window === "undefined") return cleanBaselineStore;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanBaselineStore));
  window.dispatchEvent(new Event("wcrm_store_updated"));
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const bc = new BroadcastChannel("wcrm_sync_channel");
      bc.postMessage({ type: "SYNC", timestamp: Date.now() });
      bc.close();
    } catch (e) {}
  }
  return cleanBaselineStore;
};

// Cross-tab / Cross-window Reactive Store Subscription Listener
export const subscribeToCRMStore = (callback: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};

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

// ACTIONS

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

export const applyAdvanceInStore = (req: {
  employee: string;
  code: string;
  department: string;
  amount: number;
  reason: string;
  mode: "SALARY_DEDUCTION" | "INSTALLMENTS" | "CASH";
}) => {
  const store = getCRMStore();
  const newAdv: AdvanceRequest = {
    id: `adv-${Date.now()}`,
    employeeId: String(Date.now()),
    employee: req.employee,
    code: req.code,
    department: req.department,
    amount: req.amount,
    outstanding: req.amount,
    reason: req.reason,
    mode: req.mode,
    status: "Pending Approval",
    requestedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  };

  store.advances = [newAdv, ...store.advances];
  saveCRMStore(store);
  return newAdv;
};

export const updateLeaveStatusInStore = (
  leaveId: string,
  newStatus: "APPROVED" | "REJECTED"
) => {
  const store = getCRMStore();
  const target = store.leaves.find((l) => l.id === leaveId);
  if (target) {
    target.status = newStatus;
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const addComplaintCommentInStore = (
  complaintId: string,
  author: string,
  role: "ADMIN" | "EMPLOYEE",
  text: string,
  newStatus?: ComplaintItem["status"]
) => {
  const store = getCRMStore();
  const comp = store.complaints.find((c) => c.id === complaintId);
  if (comp) {
    comp.comments.push({
      author,
      role,
      text,
      time: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    if (newStatus) {
      comp.status = newStatus;
    }
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const createComplaintInStore = (data: {
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
  priority: "Normal" | "High" | "Urgent";
  due: string;
  assignee: string;
  assigneeCode?: string;
}) => {
  const store = getCRMStore();
  const newTask: TaskItem = {
    id: `tsk-${Date.now()}`,
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: "Assigned",
    due: data.due || "-",
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
    if (evidenceFile) task.evidenceFile = evidenceFile;
    saveCRMStore(store);
    return true;
  }
  return false;
};

export const reviewTaskInStore = (taskId: string, action: "Approved" | "Rejected") => {
  const store = getCRMStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (task) {
    if (action === "Approved") {
      task.status = "Completed";
    } else {
      task.status = "In Progress";
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

// SHIFT & ATTENDANCE ACTIONS
export const checkInEmployeeInStore = (data: {
  employeeCode: string;
  employeeName: string;
  department?: string;
  distanceM?: number;
}) => {
  const store = getCRMStore();
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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


