"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  MapPin,
  CheckCircle,
  ArrowRight,
  Truck,
  Phone,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
  Eye,
  X,
  Plus,
  Send,
  Users,
  Lock,
  Upload,
  Image as ImageIcon,
  Radio,
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import {
  getCRMStore,
  getDeletedOrderIds,
  claimOrderInStore,
  registerOrderInStore,
  canEmployeeBroadcastOrders,
  updateOrderStatusInStore,
  dispatchOrderInStore,
  completeOrderDeliveryInStore,
  deleteOrderInStore,
  editOrderInStore,
  subscribeToCRMStore,
  sortOrdersNewestFirst,
  getOrderTimestamp,
  getOrderDateString,
  OrderItem,
  EmployeeItem,
} from "@/lib/store";
import { playLiveSoundNotification, forceSyncNow } from "@/lib/syncEngine";
import { compressImage } from "@/lib/imageCompressor";

export default function EmployeeOrdersPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const employeeName = user?.full_name || user?.name || "Staff";

  const [tab, setTab] = useState<"pool" | "my" | "all">("pool");
  const [orders, setOrders] = useState<OrderItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return getCRMStore().orders || [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [employees, setEmployees] = useState<EmployeeItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return getCRMStore().employees || [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [canBroadcast, setCanBroadcast] = useState(true);
  const [claimedId, setClaimedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Sorting States
  const [searchFilter, setSearchFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "YESTERDAY" | "LAST_7" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [customDate, setCustomDate] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("Any");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "PRIORITY" | "ITEMS_DESC" | "CUSTOMER_ASC">("NEWEST");

  // Parchi Viewer Modal State
  const [viewingParchi, setViewingParchi] = useState<OrderItem | null>(null);
  const [activeSlipIndex, setActiveSlipIndex] = useState(0);

  // Edit Order Modal State (Before Transit)
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    itemCount: "1",
    itemsDescription: "",
    priority: "Normal" as "Normal" | "High" | "Urgent",
    notes: "",
    fileDataUrls: [] as string[],
  });

  // Broadcast Modal State (Multiple Slips Supported)
    // Dispatch via Driver Modal State
  const [dispatchingOrder, setDispatchingOrder] = useState<OrderItem | null>(null);
  const [dispatchForm, setDispatchForm] = useState({
    selectedDriverCode: "",
    driverName: "",
    driverPhone: "",
    vehicleNumber: "",
    notes: "",
  });

  const handleOpenDispatchModal = (order: OrderItem) => {
    setDispatchingOrder(order);
    const deliveryEmp = employees.find(
      (e) => e.department === "Delivery" || (e.designation && e.designation.toLowerCase().includes("driver"))
    );
    setDispatchForm({
      selectedDriverCode: deliveryEmp?.code || "",
      driverName: deliveryEmp?.name || "",
      driverPhone: deliveryEmp?.phone || "",
      vehicleNumber: "",
      notes: "",
    });
  };

  const handleConfirmDriverDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchingOrder) return;
    if (!dispatchForm.driverName.trim()) {
      alert(lang === "hi" ? "कृपया ड्राइवर का नाम दर्ज करें!" : "Please enter Driver Name!");
      return;
    }

    dispatchOrderInStore(dispatchingOrder.id, {
      deliveryMode: "DRIVER",
      driverName: dispatchForm.driverName.trim(),
      driverCode: dispatchForm.selectedDriverCode,
      driverPhone: dispatchForm.driverPhone.trim(),
      vehicleNumber: dispatchForm.vehicleNumber.trim(),
      notes: dispatchForm.notes.trim(),
    });

    showToast(
      lang === "hi"
        ? `✓ ऑर्डर ${dispatchingOrder.orderCode} ड्राइवर ${dispatchForm.driverName} को सौंपा गया (गाड़ी रवाना)!`
        : `✓ Order ${dispatchingOrder.orderCode} dispatched with driver ${dispatchForm.driverName}!`
    );
    setDispatchingOrder(null);
  };

  const handleCustomerHandover = (order: OrderItem) => {
    const confirmMsg =
      lang === "hi"
        ? `क्या ग्राहक स्वयं गाड़ी या लोडर लाया है और माल ले गया?\n\nऑर्डर: ${order.orderCode} (${order.customerName})`
        : `Did the customer pick up the goods directly with their own vehicle?\n\nOrder: ${order.orderCode} (${order.customerName})`;

    if (window.confirm(confirmMsg)) {
      dispatchOrderInStore(order.id, {
        deliveryMode: "CUSTOMER_PICKUP",
      });
      showToast(
        lang === "hi"
          ? `✓ ऑर्डर ${order.orderCode} ग्राहक को सुपुर्द किया गया (डिलीवरी पूर्ण)!`
          : `✓ Order ${order.orderCode} marked as Customer Handover (Delivered)!`
      );
    }
  };

  const handleCompleteDelivery = (order: OrderItem) => {
    const notes = window.prompt(
      lang === "hi" ? "डिलीवरी नोट या विवरण (वैकल्पिक):" : "Delivery notes or remarks (optional):",
      ""
    );
    completeOrderDeliveryInStore(order.id, { notes: notes || undefined });
    showToast(
      lang === "hi"
        ? `✓ ऑर्डर ${order.orderCode} की डिलीवरी पूर्ण दर्ज हुई!`
        : `✓ Order ${order.orderCode} marked as Delivered!`
    );
  };

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    itemCount: "1",
    itemsDescription: "",
    priority: "Normal" as "Normal" | "High" | "Urgent",
    target: "POOL" as "POOL" | "SELF" | "COLLEAGUE",
    colleagueCode: "",
    notes: "",
    fileDataUrls: [] as string[],
  });

  // Sync with reactive store across all tabs and windows
  useEffect(() => {
    const loadStore = () => {
      const store = getCRMStore();
      setOrders(store.orders || []);
      setEmployees(store.employees || []);
      setCanBroadcast(canEmployeeBroadcastOrders(user?.employee_id || user?.id));
    };
    loadStore();
    const unsubscribe = subscribeToCRMStore(loadStore);
    forceSyncNow();
    return () => unsubscribe();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearFilters = () => {
    setSearchFilter("");
    setDateFilter("ALL");
    setCustomDate("");
    setPriorityFilter("Any");
    setSortBy("NEWEST");
  };

  const isEditableBeforeTransit = (status: OrderItem["status"]) => {
    return status !== "Ready" && status !== "Delivered" && status !== "Cancelled";
  };

  // Helper date strings
  const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  const currentMonthPrefix = todayStr.slice(0, 7);

  // Filter & Sort Pipeline
  const applyFiltersAndSort = (list: OrderItem[]): OrderItem[] => {
    const deletedSet = getDeletedOrderIds();
    const filtered = list.filter((ord) => {
      if (ord.isDeleted || deletedSet.has(ord.id)) return false;

      // Priority Filter
      if (priorityFilter !== "Any" && (ord.priority || "Normal") !== priorityFilter) {
        return false;
      }

      // Date Filter
      if (dateFilter !== "ALL") {
        const ordDate = getOrderDateString(ord);
        const ordTs = getOrderTimestamp(ord);

        if (dateFilter === "TODAY") {
          if (ordDate !== todayStr) return false;
        } else if (dateFilter === "YESTERDAY") {
          if (ordDate !== yesterdayStr) return false;
        } else if (dateFilter === "LAST_7") {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          if (ordTs < sevenDaysAgo) return false;
        } else if (dateFilter === "THIS_MONTH") {
          if (!ordDate.startsWith(currentMonthPrefix)) return false;
        } else if (dateFilter === "CUSTOM") {
          if (customDate && ordDate !== customDate) return false;
        }
      }

      // Search Filter
      if (searchFilter) {
        const q = searchFilter.toLowerCase().trim();
        const match =
          (ord.orderCode || "").toLowerCase().includes(q) ||
          (ord.customerName || "").toLowerCase().includes(q) ||
          (ord.phone || "").toLowerCase().includes(q) ||
          (ord.itemsDescription || "").toLowerCase().includes(q) ||
          (ord.notes || "").toLowerCase().includes(q) ||
          (ord.claimedBy || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "NEWEST" || sortBy === "OLDEST") {
        const timeA = getOrderTimestamp(a);
        const timeB = getOrderTimestamp(b);
        if (timeB !== timeA) {
          return sortBy === "NEWEST" ? timeB - timeA : timeA - timeB;
        }
        const codeA = parseInt(String(a.orderCode || "").replace(/\D/g, "") || "0", 10);
        const codeB = parseInt(String(b.orderCode || "").replace(/\D/g, "") || "0", 10);
        return sortBy === "NEWEST" ? codeB - codeA : codeA - codeB;
      }
      if (sortBy === "CUSTOMER_ASC") {
        return (a.customerName || "").localeCompare(b.customerName || "");
      }
      if (sortBy === "PRIORITY") {
        const weight: Record<string, number> = { Urgent: 3, High: 2, Normal: 1 };
        return (weight[b.priority || "Normal"] || 1) - (weight[a.priority || "Normal"] || 1);
      }
      if (sortBy === "ITEMS_DESC") {
        return (b.itemsCount || 1) - (a.itemsCount || 1);
      }
      return 0;
    });
  };

  const deletedSet = getDeletedOrderIds();
  const rawPoolOrders = orders.filter((o) => o.status === "Broadcasted" && !o.isDeleted && !deletedSet.has(o.id));
  const rawMyOrders = orders.filter((o) => {
    if (o.status === "Broadcasted" || o.status === "Draft" || o.status === "Cancelled" || o.isDeleted || deletedSet.has(o.id)) return false;
    const nameMatch =
      (o.claimedBy && (
        o.claimedBy.toLowerCase() === employeeName.toLowerCase() ||
        o.claimedBy.toLowerCase().includes(employeeName.toLowerCase()) ||
        employeeName.toLowerCase().includes(o.claimedBy.toLowerCase())
      )) ||
      (o.assignedToName && (
        o.assignedToName.toLowerCase() === employeeName.toLowerCase() ||
        o.assignedToName.toLowerCase().includes(employeeName.toLowerCase()) ||
        employeeName.toLowerCase().includes(o.assignedToName.toLowerCase())
      )) ||
      (user?.employee_id && o.assignedToCode === user.employee_id) ||
      (user?.employee_id && o.claimedBy?.toLowerCase() === user.employee_id.toLowerCase());
    return Boolean(nameMatch);
  });
  const rawAllOrders = orders.filter((o) => o.status !== "Cancelled" && o.status !== "Draft" && !o.isDeleted && !deletedSet.has(o.id));

  const poolOrders = applyFiltersAndSort(rawPoolOrders);
  const myOrders = applyFiltersAndSort(rawMyOrders);
  const allOrders = applyFiltersAndSort(rawAllOrders);

  const handleClaim = (order: OrderItem) => {
    claimOrderInStore(order.id, employeeName);
    setClaimedId(order.id);
    showToast(
      lang === "hi"
        ? `✓ ऑर्डर ${order.orderCode} आपके नाम असाइन हुआ!`
        : `✓ Order ${order.orderCode} claimed! Moved to "My Orders".`
    );
    setTimeout(() => {
      setClaimedId(null);
      setTab("my");
    }, 800);
  };

  const advanceStatus = (order: OrderItem) => {
    let nextStatus: OrderItem["status"] = order.status;
    if (order.status === "Claimed") nextStatus = "Packing";
    else if (order.status === "Packing") nextStatus = "Ready";
    else if (order.status === "Packed") nextStatus = "Ready";
    else if (order.status === "Ready") {
      handleOpenDispatchModal(order);
      return;
    } else if (order.status === "In Transit") {
      handleCompleteDelivery(order);
      return;
    }

    updateOrderStatusInStore(order.id, nextStatus);
    showToast(
      lang === "hi"
        ? `✓ ऑर्डर ${order.orderCode} की स्थिति अपडेट हुई: ${nextStatus}`
        : `✓ Order ${order.orderCode} status updated to: ${nextStatus}`
    );
  };

  const handleOpenEditModal = (order: OrderItem) => {
    if (order.status === "Ready" || order.status === "Delivered") {
      alert("This order is already in transit / delivered and cannot be modified.");
      return;
    }

    const initialSlips = (order.receiptPhotos && order.receiptPhotos.length > 0)
      ? [...order.receiptPhotos]
      : (order.receiptPhoto ? [order.receiptPhoto] : []);

    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName || "",
      customerPhone: order.phone === "—" ? "" : (order.phone || ""),
      address: order.address === "Local Shop Delivery" ? "" : (order.address || ""),
      itemCount: String(order.itemsCount || 1),
      itemsDescription: order.itemsDescription || "",
      priority: order.priority || "Normal",
      notes: order.notes || "",
      fileDataUrls: initialSlips,
    });
  };

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editForm.customerName.trim()) {
      alert(lang === "hi" ? "कृपया ग्राहक का नाम दर्ज करें!" : "Customer Name is required!");
      return;
    }

    const success = editOrderInStore(editingOrder.id, {
      customerName: editForm.customerName.trim(),
      phone: editForm.customerPhone.trim() || "—",
      address: editForm.address.trim() || "Local Shop Delivery",
      itemsCount: Number(editForm.itemCount) || 1,
      itemsDescription: editForm.itemsDescription.trim() || `${editForm.itemCount || 1} items parcel`,
      priority: editForm.priority,
      notes: editForm.notes.trim() || undefined,
      receiptPhoto: editForm.fileDataUrls[0] || undefined,
      receiptPhotos: editForm.fileDataUrls,
    });

    if (success) {
      showToast(
        lang === "hi"
          ? `✓ ऑर्डर ${editingOrder.orderCode} सफलतापूर्वक अपडेट हुआ!`
          : `✓ Order ${editingOrder.orderCode} updated successfully!`
      );
      setEditingOrder(null);
    } else {
      alert("Could not update order. Status may already be in transit or delivered.");
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName.trim()) {
      alert(lang === "hi" ? "कृपया ग्राहक का नाम दर्ज करें!" : "Customer Name is required!");
      return;
    }

    let isDirect = false;
    let targetName = "";
    let targetCode = "";

    if (newOrder.target === "SELF") {
      isDirect = true;
      targetName = employeeName;
      targetCode = user?.employee_id || "EMP";
    } else if (newOrder.target === "COLLEAGUE") {
      const selectedColleague = employees.find((emp) => emp.code === newOrder.colleagueCode);
      if (selectedColleague) {
        isDirect = true;
        targetName = selectedColleague.name;
        targetCode = selectedColleague.code;
      }
    }

    const item = registerOrderInStore({
      customerName: newOrder.customerName.trim(),
      phone: newOrder.customerPhone.trim() || "—",
      address: newOrder.address.trim() || (lang === "hi" ? "लोकल दुकान डिलीवरी" : "Local Shop Delivery"),
      itemsCount: Number(newOrder.itemCount) || 1,
      itemsDescription: newOrder.itemsDescription.trim() || `${newOrder.itemCount || 1} items parcel`,
      priority: newOrder.priority,
      receiptPhoto: newOrder.fileDataUrls[0] || undefined,
      receiptPhotos: newOrder.fileDataUrls.length > 0 ? newOrder.fileDataUrls : undefined,
      status: isDirect ? "Claimed" : "Broadcasted",
      notes: newOrder.notes.trim() || undefined,
      broadcastTarget: isDirect ? "SPECIFIC" : "ALL",
      assignedToCode: isDirect ? targetCode : undefined,
      assignedToName: isDirect ? targetName : undefined,
      createdByName: employeeName,
      createdByRole: "EMPLOYEE",
    });

    playLiveSoundNotification();
    setShowBroadcastModal(false);

    if (newOrder.target === "SELF") {
      showToast(
        lang === "hi"
          ? `✓ ऑर्डर ${item.orderCode} दर्ज हुआ और सीधे "मेरे ऑर्डर्स" में असाइन हुआ!`
          : `✓ Order ${item.orderCode} registered & claimed directly to your My Orders!`
      );
      setTab("my");
    } else if (newOrder.target === "COLLEAGUE") {
      showToast(
        lang === "hi"
          ? `✓ ऑर्डर ${item.orderCode} दर्ज हुआ और ${targetName} को असाइन हुआ!`
          : `✓ Order ${item.orderCode} registered & assigned to ${targetName}!`
      );
    } else {
      showToast(
        lang === "hi"
          ? `✓ ऑर्डर ${item.orderCode} दुकान पूल में ब्रॉडकास्ट हुआ! सभी कर्मचारियों को अलर्ट भेजा गया।`
          : `✓ Order ${item.orderCode} broadcasted to store pool for all staff!`
      );
      setTab("pool");
    }

    setNewOrder({
      customerName: "",
      customerPhone: "",
      address: "",
      itemCount: "1",
      itemsDescription: "",
      priority: "Normal",
      target: "POOL",
      colleagueCode: "",
      notes: "",
      fileDataUrls: [],
    });
  };

  return (
    <div className="space-y-4 pb-28 font-sans">
      {/* Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 right-4 z-50 p-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center justify-between border border-slate-700"
        >
          <span>{toastMessage}</span>
          <Check size={14} className="text-emerald-400" />
        </motion.div>
      )}

      <div className="pt-1">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {lang === "hi" ? "ऑर्डर डिस्पैच एवं डिलीवरी" : "Order Dispatch & Delivery"}
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {lang === "hi"
            ? "लाइव दुकान ऑर्डर पूल, तारीख अनुसार फिल्टर और मल्टीपल पर्ची सपोर्ट"
            : "Real-time order pool, date-wise filtering & multi-slip support"}
        </p>
      </div>

      {/* Top Action Bar with + Broadcast Order Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-50 rounded-2xl border border-blue-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Package size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-950">
              {lang === "hi" ? "दुकान / ग्राहक नया ऑर्डर ब्रॉडकास्ट" : "Customer Order Dispatch Desk"}
            </h3>
            <p className="text-[11px] text-slate-600">
              {lang === "hi"
                ? "नया ग्राहक ऑर्डर आया है? यहां से एक या अधिक पर्चियां अपलोड करके ब्रॉडकास्ट करें।"
                : "Got a new customer order? Upload one or multiple slips & broadcast instantly."}
            </p>
          </div>
        </div>

        {canBroadcast ? (
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1a73e8] to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>{lang === "hi" ? "+ नया ऑर्डर ब्रॉडकास्ट करें" : "+ Broadcast New Order"}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-semibold border border-slate-200 shrink-0">
            <Lock size={13} className="text-slate-400" />
            <span>{lang === "hi" ? "ब्रॉडकास्ट अनुमति एडमिन द्वारा बंद है" : "Broadcast locked by Admin in Roles"}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
        <button
          onClick={() => setTab("pool")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === "pool" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Package size={14} />
          <span>
            {lang === "hi" ? "उपलब्ध पूल" : "Available Pool"} ({poolOrders.length})
          </span>
        </button>
        <button
          onClick={() => setTab("my")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === "my" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Truck size={14} />
          <span>
            {lang === "hi" ? "मेरे ऑर्डर्स" : "My Orders"} ({myOrders.length})
          </span>
        </button>
        <button
          onClick={() => setTab("all")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === "all" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users size={14} />
          <span>
            {lang === "hi" ? "दुकान के सभी" : "All Orders"} ({allOrders.length})
          </span>
        </button>
      </div>

      {/* Helpful Pool vs All Orders Context Banner */}
      {tab === "pool" && (
        <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs text-blue-900 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Package size={16} className="text-blue-600 shrink-0" />
            <span className="truncate">
              {lang === "hi"
                ? `पूल में ${poolOrders.length} नया ऑर्डर क्लेम हेतु खुला है।`
                : `${poolOrders.length} unclaimed order in pool.`}
            </span>
          </div>
          <button
            onClick={() => setTab("all")}
            className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs cursor-pointer"
          >
            {lang === "hi" ? `सभी ${allOrders.length} ऑर्डर्स देखें →` : `View All ${allOrders.length} Orders →`}
          </button>
        </div>
      )}

      {/* Comprehensive Filtering & Sorting Bar for Staff */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <input
              type="text"
              placeholder={lang === "hi" ? "ऑर्डर कोड, ग्राहक नाम, फ़ोन नंबर खोजें..." : "Search code, customer, phone..."}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-4 flex gap-1.5">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
            >
              <option value="ALL">{lang === "hi" ? "📅 सभी तारीखें" : "📅 All Dates"}</option>
              <option value="TODAY">{lang === "hi" ? "आज (Today)" : "Today"}</option>
              <option value="YESTERDAY">{lang === "hi" ? "कल (Yesterday)" : "Yesterday"}</option>
              <option value="LAST_7">{lang === "hi" ? "पिछले 7 दिन" : "Last 7 Days"}</option>
              <option value="THIS_MONTH">{lang === "hi" ? "इस महीने" : "This Month"}</option>
              <option value="CUSTOM">{lang === "hi" ? "तारीख चुनें..." : "Pick Date..."}</option>
            </select>

            {dateFilter === "CUSTOM" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:bg-white font-mono cursor-pointer"
              />
            )}
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
            >
              <option value="NEWEST">🕒 {lang === "hi" ? "नया पहले (Newest)" : "Newest First"}</option>
              <option value="OLDEST">🕒 {lang === "hi" ? "पुराना पहले (Oldest)" : "Oldest First"}</option>
              <option value="PRIORITY">⚡ {lang === "hi" ? "तत्काल पहले (Urgent)" : "Urgent First"}</option>
              <option value="ITEMS_DESC">📦 {lang === "hi" ? "सामान अधिक से कम" : "Items: High-Low"}</option>
              <option value="CUSTOMER_ASC">👤 {lang === "hi" ? "ग्राहक A से Z" : "Customer (A-Z)"}</option>
            </select>
          </div>

          {/* Clear Button */}
          <div className="sm:col-span-1">
            <button
              onClick={handleClearFilters}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold text-center cursor-pointer transition-colors"
            >
              {lang === "hi" ? "रीसेट" : "Clear"}
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Available Pool */}
      {tab === "pool" && (
        <div className="space-y-3">
          {poolOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
              <Package size={36} className="mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">
                {lang === "hi" ? "कोई उपलब्ध ऑर्डर नहीं है" : "Order pool is clear"}
              </p>
              <p className="text-xs text-slate-400">
                {lang === "hi"
                  ? "एडमिन काउंटर द्वारा बनाए गए नए ऑर्डर यहां तुरंत दिखाई देंगे।"
                  : "New customer orders broadcasted by the admin counter will instantly appear here for claiming."}
              </p>
            </div>
          ) : (
            poolOrders.map((order) => {
              const slips = (order.receiptPhotos && order.receiptPhotos.length > 0)
                ? order.receiptPhotos
                : (order.receiptPhoto ? [order.receiptPhoto] : []);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {order.orderCode}
                        </span>
                        {order.priority && order.priority !== "Normal" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            {order.priority}
                          </span>
                        )}
                        {(order.createdByName?.toLowerCase() === employeeName.toLowerCase() ||
                          order.createdByRole === "EMPLOYEE") && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ {lang === "hi" ? "आपने ब्रॉडकास्ट किया" : "Broadcasted by You"}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{order.customerName}</h3>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {order.itemsCount} {order.itemsCount === 1 ? (lang === "hi" ? "आइटम" : "Item") : (lang === "hi" ? "आइटम" : "Items")}
                    </span>
                  </div>

                  {order.itemsDescription && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>{lang === "hi" ? "सामान सूची:" : "Items:"}</strong> {order.itemsDescription}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-slate-600">
                    {order.address && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{order.address}</span>
                      </div>
                    )}
                    {order.phone && order.phone !== "—" && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <a href={`tel:${order.phone}`} className="text-blue-600 font-medium hover:underline">
                          {order.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <strong>{lang === "hi" ? "विशेष निर्देश:" : "Note:"}</strong> {order.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {/* View Slips */}
                    {slips.length > 0 && (
                      <button
                        onClick={() => {
                          setViewingParchi(order);
                          setActiveSlipIndex(0);
                        }}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={13} className="text-amber-600" />
                        <span>{lang === "hi" ? "पर्ची" : "Slip"} {slips.length > 1 ? `(${slips.length})` : ""}</span>
                      </button>
                    )}

                    {/* Edit Order before transit */}
                    {isEditableBeforeTransit(order.status) && (
                      <button
                        onClick={() => handleOpenEditModal(order)}
                        className="px-3 py-2 bg-slate-100 hover:bg-amber-100 text-amber-800 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit Order"
                      >
                        <Edit3 size={13} />
                        <span>{lang === "hi" ? "बदलाव करें" : "Edit"}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleClaim(order)}
                      disabled={claimedId === order.id}
                      className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Package size={14} />
                      <span>
                        {claimedId === order.id
                          ? lang === "hi"
                            ? "असाइन हो रहा है..."
                            : "Claiming..."
                          : lang === "hi"
                          ? "यह ऑर्डर क्लेम करें"
                          : "Claim This Order"}
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: My Orders */}
      {tab === "my" && (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
              <Truck size={36} className="mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">
                {lang === "hi" ? "कोई सक्रिय ऑर्डर नहीं है" : "No active orders assigned"}
              </p>
              <p className="text-xs text-slate-400">
                {lang === "hi"
                  ? "उपलब्ध पूल से ऑर्डर स्वीकार करने के लिए ऊपर दिए गए टैब पर जाएं।"
                  : "Go to the Available Pool tab above to claim incoming dispatch orders."}
              </p>
            </div>
          ) : (
            myOrders.map((order) => {
              const slips = (order.receiptPhotos && order.receiptPhotos.length > 0)
                ? order.receiptPhotos
                : (order.receiptPhoto ? [order.receiptPhoto] : []);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {order.orderCode}
                        </span>
                        {order.priority && order.priority !== "Normal" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            {order.priority}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{order.customerName}</h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : order.status === "Ready"
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : order.status === "Packed"
                          ? "bg-cyan-100 text-cyan-800 border-cyan-300"
                          : order.status === "Packing"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {order.itemsDescription && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>{lang === "hi" ? "सामान:" : "Items"} ({order.itemsCount}):</strong> {order.itemsDescription}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-slate-600">
                    {order.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{order.address}</span>
                      </div>
                    )}
                    {order.phone && order.phone !== "—" && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <a href={`tel:${order.phone}`} className="text-blue-600 font-semibold hover:underline">
                          Call {order.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Slip Viewer Button */}
                    {slips.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingParchi(order);
                          setActiveSlipIndex(0);
                        }}
                        className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={13} />
                        <span>{lang === "hi" ? "पर्ची देखें" : "View Slips"} {slips.length > 1 ? `(${slips.length})` : ""}</span>
                      </button>
                    )}

                    {/* Edit Order before transit */}
                    {isEditableBeforeTransit(order.status) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(order)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>{lang === "hi" ? "संपादित करें" : "Edit"}</span>
                      </button>
                    )}
                  </div>

                  {/* Staff Packer & Driver Details Badge */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">
                        {lang === "hi" ? "माल पैक किया:" : "Packed by:"}
                      </span>
                      <strong className="text-slate-800 font-semibold">
                        {order.packedBy || order.claimedBy || employeeName}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-200/50">
                      <span className="text-slate-500 font-medium">
                        {lang === "hi" ? "डिलीवरी माध्यम:" : "Delivery:"}
                      </span>
                      {order.deliveryMode === "CUSTOMER_PICKUP" ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {lang === "hi" ? "ग्राहक स्वयं ले गया" : "Customer Self-Pickup"}
                        </span>
                      ) : order.assignedDriverName ? (
                        <div className="text-right">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            🚚 {order.assignedDriverName} {order.assignedVehicleNumber ? `(${order.assignedVehicleNumber})` : ""}
                          </span>
                          {order.assignedDriverPhone && (
                            <a href={`tel:${order.assignedDriverPhone}`} className="block text-[10px] text-blue-600 font-semibold hover:underline mt-0.5">
                              📞 {order.assignedDriverPhone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          {lang === "hi" ? "डिस्पैच चयन लंबित" : "Awaiting Dispatch"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5-Step Progress Tracker */}
                  <div className="grid grid-cols-5 gap-1 pt-1 text-[9px] sm:text-[10px] text-center font-bold">
                    <span className={`p-1 rounded ${order.status === "Claimed" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                      1. {lang === "hi" ? "स्वीकृत" : "Claim"}
                    </span>
                    <span className={`p-1 rounded ${order.status === "Packing" ? "bg-indigo-600 text-white" : ["Packed", "Ready", "In Transit", "Delivered"].includes(order.status) ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400"}`}>
                      2. {lang === "hi" ? "पैकिंग" : "Pack"}
                    </span>
                    <span className={`p-1 rounded ${["Packed", "Ready"].includes(order.status) ? "bg-purple-600 text-white" : ["In Transit", "Delivered"].includes(order.status) ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400"}`}>
                      3. {lang === "hi" ? "तैयार" : "Ready"}
                    </span>
                    <span className={`p-1 rounded ${order.status === "In Transit" ? "bg-amber-600 text-white animate-pulse" : order.status === "Delivered" ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400"}`}>
                      4. {lang === "hi" ? "रास्ते में" : "Transit"}
                    </span>
                    <span className={`p-1 rounded ${order.status === "Delivered" ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-400"}`}>
                      5. {lang === "hi" ? "पूर्ण" : "Done"}
                    </span>
                  </div>

                  {/* Contextual Action Buttons */}
                  {order.status === "Claimed" && (
                    <button
                      onClick={() => advanceStatus(order)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Package size={14} />
                      <span>{lang === "hi" ? "पैकिंग शुरू करें" : "Start Packing"}</span>
                    </button>
                  )}

                  {order.status === "Packing" && (
                    <button
                      onClick={() => advanceStatus(order)}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle size={14} />
                      <span>{lang === "hi" ? "पैकिंग पूरी - तैयार मार्क करें" : "Mark Packed & Ready"}</span>
                    </button>
                  )}

                  {order.status === "Ready" && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCustomerHandover(order)}
                        className="py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 text-center"
                      >
                        <span>🚗 {lang === "hi" ? "ग्राहक ले गया" : "Customer Pickup"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDispatchModal(order)}
                        className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 text-center"
                      >
                        <Truck size={14} />
                        <span>{lang === "hi" ? "ड्राइवर को सौंपें" : "Assign Driver"}</span>
                      </button>
                    </div>
                  )}

                  {order.status === "In Transit" && (
                    <button
                      onClick={() => handleCompleteDelivery(order)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle size={15} />
                      <span>{lang === "hi" ? "डिलीवरी पूर्ण दर्ज करें" : "Confirm Order Delivered"}</span>
                    </button>
                  )}

                  {order.status === "Delivered" && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle size={15} className="text-emerald-600" />
                      <span>
                        {lang === "hi"
                          ? `सफलतापूर्वक डिलीवर हुआ (${order.deliveredAt || "पूर्ण"})`
                          : `Delivered Successfully (${order.deliveredAt || "Done"})`}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: All Store Orders / Shop Dispatch */}
      {tab === "all" && (
        <div className="space-y-3">
          {allOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
              <Package size={36} className="mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">
                {lang === "hi" ? "दुकान में कोई ऑर्डर नहीं है" : "No orders found in store"}
              </p>
              <p className="text-xs text-slate-400">
                {lang === "hi"
                  ? "काउंसल / एडमिन काउंटर द्वारा बनाए गए ऑर्डर यहां हमेशा दिखाई देंगे।"
                  : "All shop dispatch orders will always remain visible here with live status."}
              </p>
            </div>
          ) : (
            allOrders.map((order) => {
              const slips = (order.receiptPhotos && order.receiptPhotos.length > 0)
                ? order.receiptPhotos
                : (order.receiptPhoto ? [order.receiptPhoto] : []);

              const isMine =
                (order.claimedBy && (
                  order.claimedBy.toLowerCase() === employeeName.toLowerCase() ||
                  order.claimedBy.toLowerCase().includes(employeeName.toLowerCase()) ||
                  employeeName.toLowerCase().includes(order.claimedBy.toLowerCase())
                )) ||
                (order.assignedToName && (
                  order.assignedToName.toLowerCase() === employeeName.toLowerCase() ||
                  order.assignedToName.toLowerCase().includes(employeeName.toLowerCase()) ||
                  employeeName.toLowerCase().includes(order.assignedToName.toLowerCase())
                )) ||
                (user?.employee_id && order.assignedToCode === user.employee_id) ||
                (user?.employee_id && order.claimedBy?.toLowerCase() === user.employee_id.toLowerCase());

              const isBroadcasted = order.status === "Broadcasted";

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {order.orderCode}
                        </span>
                        {order.priority && order.priority !== "Normal" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            {order.priority}
                          </span>
                        )}
                        {isMine && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            ★ {lang === "hi" ? "आपका ऑर्डर" : "Assigned to You"}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{order.customerName}</h3>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : order.status === "Ready"
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : order.status === "Packed"
                          ? "bg-cyan-100 text-cyan-800 border-cyan-300"
                          : order.status === "Packing"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                          : order.status === "Claimed"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                      }`}
                    >
                      {order.status === "Broadcasted"
                        ? lang === "hi"
                          ? "पूल में उपलब्ध"
                          : "Broadcasted (Pool)"
                        : order.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                    {order.itemsDescription && (
                      <p>
                        <strong>{lang === "hi" ? "सामान:" : "Items"} ({order.itemsCount}):</strong> {order.itemsDescription}
                      </p>
                    )}
                    {order.address && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{order.address}</span>
                      </div>
                    )}
                    <div className="space-y-1 pt-1.5 border-t border-slate-200/60 text-[11px]">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>
                          📦 {lang === "hi" ? "पैक किया:" : "Packed by:"}{" "}
                          <strong className="text-slate-800">
                            {order.packedBy || order.claimedBy || (lang === "hi" ? "पूल में खुला" : "Open Pool")}
                          </strong>
                        </span>
                        <span>🕒 {order.created}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>{lang === "hi" ? "डिलीवरी माध्यम:" : "Delivery:"}</span>
                        {order.deliveryMode === "CUSTOMER_PICKUP" ? (
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            🚗 {lang === "hi" ? "ग्राहक स्वयं ले गया" : "Customer Pickup"}
                          </span>
                        ) : order.assignedDriverName ? (
                          <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            🚚 {order.assignedDriverName} {order.assignedVehicleNumber ? `(${order.assignedVehicleNumber})` : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            {order.status === "Ready" ? (lang === "hi" ? "डिस्पैच चयन लंबित" : "Awaiting Dispatch") : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {slips.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingParchi(order);
                          setActiveSlipIndex(0);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={13} />
                        <span>{lang === "hi" ? "पर्ची" : "Slip"} {slips.length > 1 ? `(${slips.length})` : ""}</span>
                      </button>
                    )}

                    {isEditableBeforeTransit(order.status) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(order)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Edit Order"
                      >
                        <Edit3 size={13} />
                        <span>{lang === "hi" ? "बदलाव" : "Edit"}</span>
                      </button>
                    )}

                    {isBroadcasted && (
                      <button
                        onClick={() => handleClaim(order)}
                        disabled={claimedId === order.id}
                        className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Package size={14} />
                        <span>
                          {claimedId === order.id
                            ? lang === "hi"
                              ? "असाइन हो रहा है..."
                              : "Claiming..."
                            : lang === "hi"
                            ? "यह ऑर्डर क्लेम करें"
                            : "Claim This Order"}
                        </span>
                      </button>
                    )}

                    {isMine && order.status !== "Delivered" && (
                      <button
                        onClick={() => advanceStatus(order)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ArrowRight size={14} />
                        <span>{lang === "hi" ? "स्थिति आगे बढ़ाएं" : "Advance Step"}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* MULTI-SLIP PARCHI PREVIEW MODAL */}
      {viewingParchi && (() => {
        const slips = (viewingParchi.receiptPhotos && viewingParchi.receiptPhotos.length > 0)
          ? viewingParchi.receiptPhotos
          : (viewingParchi.receiptPhoto ? [viewingParchi.receiptPhoto] : []);
        const currentSlip = slips[activeSlipIndex] || slips[0];

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                    {viewingParchi.orderCode}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">
                    {lang === "hi" ? "ऑर्डर पर्ची" : "Order Slip"} {slips.length > 1 ? `(${activeSlipIndex + 1} of ${slips.length})` : ""}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingParchi(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Photo View */}
              {currentSlip && currentSlip.startsWith("data:image") ? (
                <div className="space-y-3">
                  <div className="relative p-2 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center min-h-[280px]">
                    <img
                      src={currentSlip}
                      alt={`Parchi ${viewingParchi.orderCode}`}
                      className="max-h-[55vh] w-full object-contain rounded-xl"
                    />

                    {slips.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveSlipIndex((prev) => (prev > 0 ? prev - 1 : slips.length - 1))}
                          className="absolute left-2.5 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSlipIndex((prev) => (prev < slips.length - 1 ? prev + 1 : 0))}
                          className="absolute right-2.5 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg cursor-pointer"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                  </div>

                  {slips.length > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {slips.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlipIndex(idx)}
                          className={`w-12 h-12 rounded-lg border-2 overflow-hidden transition-all ${
                            activeSlipIndex === idx
                              ? "border-blue-600 scale-105 shadow-md"
                              : "border-slate-200 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={s} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                    <span>{viewingParchi.customerName}</span>
                    <span>{viewingParchi.itemsCount} {lang === "hi" ? "सामान" : "Items"}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-center text-xs text-amber-950 font-mono space-y-2 shadow-inner">
                  <FileText size={36} className="mx-auto text-amber-600" />
                  <p className="font-bold text-sm text-slate-900">{viewingParchi.orderCode} - Counter Slip</p>
                  <p className="text-slate-700">{viewingParchi.itemsDescription || `${viewingParchi.itemsCount} items`}</p>
                  <p className="text-[10px] text-amber-700">Customer: {viewingParchi.customerName} • {viewingParchi.phone}</p>
                </div>
              )}

              <button
                onClick={() => setViewingParchi(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === "hi" ? "बंद करें" : "Close Slip"}
              </button>
            </div>
          </div>
        );
      })()}

            {/* DISPATCH VIA DRIVER OR CUSTOMER HANDOVER MODAL */}
      {dispatchingOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {lang === "hi" ? "ड्राइवर को सौंपें (गाड़ी रवाना)" : "Assign Driver & Dispatch"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchingOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Brief */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-blue-600">{dispatchingOrder.orderCode}</span>
                <span className="font-semibold text-slate-700">{dispatchingOrder.customerName}</span>
              </div>
              <p className="text-slate-500">{dispatchingOrder.address || (lang === "hi" ? "स्थानीय डिलीवरी" : "Local Delivery")}</p>
              <div className="pt-1 text-[11px] text-slate-600 font-medium">
                <strong>{lang === "hi" ? "माल पैक किया:" : "Packed by:"}</strong>{" "}
                {dispatchingOrder.packedBy || dispatchingOrder.claimedBy || employeeName}
              </div>
            </div>

            <form onSubmit={handleConfirmDriverDispatch} className="space-y-3.5 text-xs">
              {/* Select from Staff / Drivers */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {lang === "hi" ? "ड्राइवर चुनें:" : "Select Active Driver / Staff:"} *
                </label>
                <select
                  value={dispatchForm.selectedDriverCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const emp = employees.find((x) => x.code === code);
                    setDispatchForm({
                      ...dispatchForm,
                      selectedDriverCode: code,
                      driverName: emp ? emp.name : (code === "OTHER" ? "" : dispatchForm.driverName),
                      driverPhone: emp ? (emp.phone || "") : "",
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === "hi" ? "-- उपलब्ध ड्राइवर चुनें --" : "-- Choose Driver / Staff --"}</option>
                  {employees
                    .filter((e) => !e.code.includes("ADMIN") && e.department !== "Management")
                    .map((emp) => (
                      <option key={emp.code} value={emp.code}>
                        {emp.name} ({emp.designation || emp.department}) • {emp.phone || emp.code}
                      </option>
                    ))}
                  <option value="OTHER">{lang === "hi" ? "➕ अन्य बाहरी या प्राइवेट ड्राइवर" : "➕ Other / External Driver"}</option>
                </select>
              </div>

              {/* Driver Name input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {lang === "hi" ? "ड्राइवर का नाम:" : "Driver Name:"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === "hi" ? "उदा. टीकम बंजारा / राहुल" : "e.g. Tikam Banjara / Rahul"}
                  value={dispatchForm.driverName}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Driver Phone & Vehicle Number */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    {lang === "hi" ? "ड्राइवर मोबाइल नंबर:" : "Driver Phone:"}
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={dispatchForm.driverPhone}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, driverPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    {lang === "hi" ? "गाड़ी या लोडर नंबर:" : "Vehicle / Plate No:"}
                  </label>
                  <input
                    type="text"
                    placeholder="RJ 37 GA 1234"
                    value={dispatchForm.vehicleNumber}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Remarks / Dispatch Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {lang === "hi" ? "डिस्पैच रिमार्क्स (वैकल्पिक):" : "Dispatch Notes (Optional):"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "hi" ? "जैसे: माल लोड हुआ, 20 कट्टे सीमेंट" : "e.g. Loaded in tempo, cash on delivery"}
                  value={dispatchForm.notes}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchingOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  {lang === "hi" ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Truck size={14} />
                  <span>{lang === "hi" ? "गाड़ी रवाना करें (In Transit)" : "Dispatch (In Transit)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL FOR EMPLOYEE (BEFORE TRANSIT) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    {editingOrder.orderCode}
                  </span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    ✏️ {lang === "hi" ? "ऑर्डर संपादन (Edit)" : "Edit Order"}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {lang === "hi" ? "ऑर्डर विवरण में बदलाव करें" : "Update Order Details"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "ग्राहक / दुकान का नाम *" : "Customer Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "मोबाइल नंबर" : "Phone"}
                  </label>
                  <input
                    type="tel"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Item Count */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "आइटम की संख्या" : "Item Count"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.itemCount}
                    onChange={(e) => setEditForm({ ...editForm, itemCount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Delivery Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "डिलीवरी पता" : "Delivery Address"}
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                  />
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === "hi" ? "सामान विवरण (Items)" : "Items Summary"}
                </label>
                <textarea
                  rows={2}
                  value={editForm.itemsDescription}
                  onChange={(e) => setEditForm({ ...editForm, itemsDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === "hi" ? "प्राथमिकता (Priority)" : "Priority"}
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Normal">{lang === "hi" ? "सामान्य (Normal)" : "Normal"}</option>
                  <option value="High">{lang === "hi" ? "उच्च (High)" : "High"}</option>
                  <option value="Urgent">{lang === "hi" ? "तत्काल (Urgent)" : "Urgent"}</option>
                </select>
              </div>

              {/* Slips Manager in Edit */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    {lang === "hi" ? "पर्चियां प्रबंधित करें" : "Manage Slips"} ({editForm.fileDataUrls.length})
                  </label>
                  <label className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                    <Plus size={13} /> {lang === "hi" ? "+ और जोड़ें" : "+ Add More"}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const newSlips: string[] = [];
                          for (const file of files) {
                            try {
                              const compressed = await compressImage(file, 900, 900, 0.65);
                              newSlips.push(compressed);
                            } catch {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const res = event.target?.result as string;
                                if (res) newSlips.push(res);
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                          setEditForm((prev) => ({
                            ...prev,
                            fileDataUrls: [...prev.fileDataUrls, ...newSlips],
                          }));
                        }
                      }}
                    />
                  </label>
                </div>

                {editForm.fileDataUrls.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {editForm.fileDataUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl border border-amber-300 overflow-hidden bg-white shadow-xs group">
                        <img src={url} alt={`Slip ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditForm((prev) => ({
                            ...prev,
                            fileDataUrls: prev.fileDataUrls.filter((_, i) => i !== idx),
                          }))}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-700 cursor-pointer"
                          title="Remove Slip"
                        >
                          ×
                        </button>
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-mono py-0.2">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    {lang === "hi" ? "कोई पर्ची संलग्न नहीं है" : "No slips attached"}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === "hi" ? "निर्देश (Notes)" : "Notes"}
                </label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  {lang === "hi" ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === "hi" ? "बदलाव सुरक्षित करें" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE ORDER BROADCAST MODAL (MULTIPLE SLIPS) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <Send size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {lang === "hi" ? "नया ग्राहक ऑर्डर ब्रॉडकास्ट करें" : "Broadcast New Customer Order"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === "hi" ? "एक या अधिक पर्चियां अपलोड करें और पूल में भेजें" : "Attach slips & send to shop pool"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 pt-1">
              {/* Target / Destination Selector */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  {lang === "hi" ? "यह ऑर्डर किसे असाइन करना है? *" : "Who Should Handle This Order? *"}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "POOL", label: lang === "hi" ? "दुकान पूल (सभी)" : "Shop Pool (All)", icon: Radio },
                    { id: "SELF", label: lang === "hi" ? "स्वयं (मेरे लिए)" : "Myself (Self)", icon: CheckCircle },
                    { id: "COLLEAGUE", label: lang === "hi" ? "सहकर्मी" : "Colleague", icon: Users },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = newOrder.target === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNewOrder({ ...newOrder, target: opt.id as any })}
                        className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={14} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {newOrder.target === "COLLEAGUE" && (
                  <div className="pt-1.5 space-y-1 animate-in fade-in">
                    <label className="text-[11px] font-bold text-slate-700">
                      {lang === "hi" ? "सहकर्मी का चयन करें:" : "Select Colleague:"}
                    </label>
                    <select
                      value={newOrder.colleagueCode}
                      onChange={(e) => setNewOrder({ ...newOrder, colleagueCode: e.target.value })}
                      required
                      className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="">-- {lang === "hi" ? "कर्मचारी चुनें" : "Choose Employee"} --</option>
                      {employees
                        .filter((e) => e.code !== user?.employee_id)
                        .map((emp) => (
                          <option key={emp.id} value={emp.code}>
                            👤 {emp.name} ({emp.code}) — {emp.department || "Staff"}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "ग्राहक / दुकान का नाम *" : "Customer / Shop Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === "hi" ? "उदा. शर्मा ट्रेडर्स" : "e.g. Sharma Traders"}
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "मोबाइल नंबर *" : "Mobile Phone *"}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={newOrder.customerPhone}
                    onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "प्राथमिकता (Priority)" : "Priority"}
                  </label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Normal">{lang === "hi" ? "सामान्य (Normal)" : "Normal Priority"}</option>
                    <option value="High">{lang === "hi" ? "उच्च (High)" : "High Priority"}</option>
                    <option value="Urgent">{lang === "hi" ? "तत्काल (Urgent Express)" : "Urgent Express"}</option>
                  </select>
                </div>

                {/* Items Count */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "आइटम की संख्या" : "Item Count"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newOrder.itemCount}
                    onChange={(e) => setNewOrder({ ...newOrder, itemCount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Delivery Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "डिलीवरी का पता / दुकान" : "Delivery Address / Shop Counter"}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === "hi" ? "उदा. कुचामन रोड, परबतसर" : "e.g. Kuchaman Road, Parvatsar"}
                    value={newOrder.address}
                    onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === "hi" ? "सामान विवरण (Items Description)" : "Items Description / List"}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === "hi" ? "उदा. 10mm सरिया बंडल, एंगल पत्ती, सीमेंट बैग..." : "List items or special packing requirements..."}
                  value={newOrder.itemsDescription}
                  onChange={(e) => setNewOrder({ ...newOrder, itemsDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Multiple Parchi Photos Upload */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    {lang === "hi" ? "पर्ची की फोटो (Multiple Slips Allowed)" : "Upload Parchi Slips"}
                  </label>
                  <span className="text-[11px] font-mono font-bold text-blue-700">
                    {newOrder.fileDataUrls.length} {lang === "hi" ? "पर्चियां जुड़ीं" : "Slips"}
                  </span>
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      const newSlips: string[] = [];
                      for (const file of files) {
                        try {
                          const compressed = await compressImage(file, 900, 900, 0.65);
                          newSlips.push(compressed);
                        } catch {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const res = event.target?.result as string;
                            if (res) newSlips.push(res);
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                      setNewOrder((prev) => ({
                        ...prev,
                        fileDataUrls: [...prev.fileDataUrls, ...newSlips],
                      }));
                    }
                  }}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                />

                {/* Previews */}
                {newOrder.fileDataUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {newOrder.fileDataUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl border border-blue-300 overflow-hidden bg-white shadow-xs group">
                        <img src={url} alt={`Slip ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewOrder((prev) => ({
                            ...prev,
                            fileDataUrls: prev.fileDataUrls.filter((_, i) => i !== idx),
                          }))}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-700 cursor-pointer"
                          title="Remove Slip"
                        >
                          ×
                        </button>
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-mono py-0.2">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === "hi" ? "विशेष निर्देश (Notes)" : "Special Notes"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "hi" ? "उदा. जल्दी डिलीवर करना है, कैश काउंटर पर देंगे" : "Optional notes..."}
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  {lang === "hi" ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {newOrder.target === "SELF"
                      ? (lang === "hi" ? "दर्ज करें और क्लेम करें" : "Save & Claim Now")
                      : (lang === "hi" ? "ऑर्डर ब्रॉडकास्ट करें" : "Broadcast Order")}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
