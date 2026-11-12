"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Package,
  MapPin,
  Phone,
  Upload,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Image as ImageIcon,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Radio,
  Send,
  User,
  Users,
  Filter,
  Eye,
  Trash2,
  Check,
  AlertCircle,
  Edit3,
  Calendar,
  Layers,
  ArrowUpDown,
} from "lucide-react";

import {
  getCRMStore,
  getDeletedOrderIds,
  saveCRMStore,
  registerOrderInStore,
  updateOrderStatusInStore,
  dispatchOrderInStore,
  completeOrderDeliveryInStore,
  deleteOrderInStore,
  editOrderInStore,
  subscribeToCRMStore,
  getOrderTimestamp,
  getOrderDateString,
  sortOrdersNewestFirst,
  OrderItem,
  EmployeeItem,
} from "@/lib/store";
import { compressImage } from "@/lib/imageCompressor";
import { useLanguage } from "@/lib/i18n";
import { forceSyncNow } from "@/lib/syncEngine";

export default function OrdersPage() {
  const { lang, t } = useLanguage();
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
  const [statusFilter, setStatusFilter] = useState("Any");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "YESTERDAY" | "LAST_7" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [customDate, setCustomDate] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("Any");
  const [assigneeFilter, setAssigneeFilter] = useState("Any");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "PRIORITY" | "ITEMS_DESC" | "CUSTOMER_ASC" | "CUSTOMER_DESC">("NEWEST");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
    // Admin Driver Dispatch Modal State
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
        : `Did customer pick up the goods directly at counter?\n\nOrder: ${order.orderCode} (${order.customerName})`;

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
      lang === "hi" ? "डिलीवरी नोट या रिमार्क्स (वैकल्पिक):" : "Delivery notes or remarks (optional):",
      ""
    );
    completeOrderDeliveryInStore(order.id, { notes: notes || undefined });
    showToast(
      lang === "hi"
        ? `✓ ऑर्डर ${order.orderCode} की डिलीवरी पूर्ण दर्ज हुई!`
        : `✓ Order ${order.orderCode} marked as Delivered!`
    );
  };

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [viewingParchiOrder, setViewingParchiOrder] = useState<OrderItem | null>(null);
  const [activeSlipIndex, setActiveSlipIndex] = useState(0);

  // Edit Modal State
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

  // Sync with unified reactive store across all tabs & windows
  React.useEffect(() => {
    const loadOrdersAndEmployees = () => {
      const store = getCRMStore();
      setOrders(store.orders || []);
      setEmployees(store.employees || []);
    };
    loadOrdersAndEmployees();
    const unsubscribe = subscribeToCRMStore(loadOrdersAndEmployees);
    forceSyncNow();
    return () => unsubscribe();
  }, []);

  // Register Order Form State (Multiple Slips Supported)
  const [newOrder, setNewOrder] = useState({
    orderCode: "",
    customerName: "",
    customerPhone: "",
    address: "",
    itemCount: "1",
    itemsDescription: "",
    priority: "Normal" as "Normal" | "High" | "Urgent",
    notes: "",
    fileDataUrls: [] as string[],
    assigneeCode: "ALL", // "ALL" = Open Pool, or specific employee code
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClearFilters = () => {
    setStatusFilter("Any");
    setDateFilter("ALL");
    setCustomDate("");
    setPriorityFilter("Any");
    setAssigneeFilter("Any");
    setSearchFilter("");
    setSortBy("NEWEST");
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName.trim()) {
      alert("Customer Name is required!");
      return;
    }

    const selectedEmp = employees.find((emp) => emp.code === newOrder.assigneeCode);
    const isDirect = Boolean(selectedEmp && newOrder.assigneeCode !== "ALL");

    const item = registerOrderInStore({
      orderCode: newOrder.orderCode.trim(),
      customerName: newOrder.customerName.trim(),
      phone: newOrder.customerPhone.trim() || "—",
      address: newOrder.address.trim() || "Local Shop Delivery",
      itemsCount: Number(newOrder.itemCount) || 1,
      itemsDescription: newOrder.itemsDescription.trim() || `${newOrder.itemCount || 1} items parcel`,
      priority: newOrder.priority,
      receiptPhoto: newOrder.fileDataUrls[0] || undefined,
      receiptPhotos: newOrder.fileDataUrls.length > 0 ? newOrder.fileDataUrls : undefined,
      status: isDirect ? "Claimed" : "Broadcasted",
      notes: newOrder.notes.trim() || undefined,
      broadcastTarget: isDirect ? "SPECIFIC" : "ALL",
      assignedToCode: isDirect ? selectedEmp?.code : undefined,
      assignedToName: isDirect ? selectedEmp?.name : undefined,
      createdByName: "System Admin",
      createdByRole: "ADMIN",
    });

    setShowRegisterModal(false);
    showToast(
      isDirect
        ? `✓ Order ${item.orderCode} directly assigned to ${selectedEmp?.name}!`
        : `✓ Order ${item.orderCode} broadcasted to all employees in open pool!`
    );
    setNewOrder({
      orderCode: "",
      customerName: "",
      customerPhone: "",
      address: "",
      itemCount: "1",
      itemsDescription: "",
      priority: "Normal",
      notes: "",
      fileDataUrls: [],
      assigneeCode: "ALL",
    });
  };

  // Open Edit Modal for order before transit
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
      alert("Customer Name is required!");
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
      showToast(`✓ Order ${editingOrder.orderCode} updated successfully!`);
      if (selectedOrder?.id === editingOrder.id) {
        setSelectedOrder((prev) => prev ? {
          ...prev,
          customerName: editForm.customerName.trim(),
          phone: editForm.customerPhone.trim() || "—",
          address: editForm.address.trim() || "Local Shop Delivery",
          itemsCount: Number(editForm.itemCount) || 1,
          itemsDescription: editForm.itemsDescription.trim(),
          priority: editForm.priority,
          notes: editForm.notes.trim(),
          receiptPhotos: editForm.fileDataUrls,
          receiptPhoto: editForm.fileDataUrls[0],
        } : null);
      }
      setEditingOrder(null);
    } else {
      alert("Could not update order. Status may already be in transit or delivered.");
    }
  };

  const advanceOrderStatus = (order: OrderItem) => {
    let nextStatus: OrderItem["status"] = order.status;
    if (order.status === "Broadcasted") nextStatus = "Claimed";
    else if (order.status === "Claimed") nextStatus = "Packing";
    else if (order.status === "Packing") nextStatus = "Ready";
    else if (order.status === "Ready") nextStatus = "Delivered";

    updateOrderStatusInStore(order.id, nextStatus);
    const updated = { ...order, status: nextStatus };
    if (selectedOrder?.id === order.id) setSelectedOrder(updated);
    showToast(`Order ${order.orderCode} status moved to ${nextStatus}!`);
  };

  const deleteOrder = (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      deleteOrderInStore(orderId);
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      showToast("Order removed from queue");
    }
  };

  // Helper date calculations for filters
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

  const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

  // Filter Orders
  const filteredOrders = orders.filter((ord) => {
    const deletedSet = getDeletedOrderIds();
    if (ord.isDeleted || deletedSet.has(ord.id)) {
      return false;
    }

    // Status filter
    if (statusFilter !== "Any" && ord.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== "Any" && (ord.priority || "Normal") !== priorityFilter) {
      return false;
    }

    // Assignee filter
    if (assigneeFilter !== "Any") {
      if (assigneeFilter === "UNCLAIMED") {
        if (ord.claimedBy || ord.assignedToName) return false;
      } else {
        const matchesAssignee =
          ord.assignedToCode === assigneeFilter ||
          (ord.claimedBy && ord.claimedBy.toLowerCase().includes(assigneeFilter.toLowerCase()));
        if (!matchesAssignee) return false;
      }
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
        const sevenDaysAgoTs = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (ordTs < sevenDaysAgoTs) return false;
      } else if (dateFilter === "THIS_MONTH") {
        if (!ordDate.startsWith(currentMonthPrefix)) return false;
      } else if (dateFilter === "CUSTOM") {
        if (customDate && ordDate !== customDate) return false;
      }
    }

    // Search filter
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

  // Sort Orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
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
    if (sortBy === "CUSTOMER_DESC") {
      return (b.customerName || "").localeCompare(a.customerName || "");
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

  const getStatusBadge = (status: OrderItem["status"]) => {
    switch (status) {
      case "Broadcasted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Radio className="w-3 h-3 text-amber-600 animate-pulse" /> {lang === "hi" ? "प्रसारित पूल" : "Broadcasted"}
          </span>
        );
      case "Claimed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> {lang === "hi" ? "स्वीकृत" : "Claimed"}
          </span>
        );
      case "Packing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Package className="w-3 h-3 text-purple-600" /> {lang === "hi" ? "पैकिंग जारी" : "Packing"}
          </span>
        );
      case "Ready":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Truck className="w-3 h-3 text-indigo-600" /> {lang === "hi" ? "डिस्पैच तैयार" : "Ready for Delivery"}
          </span>
        );
      case "In Transit":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
            <Truck className="w-3 h-3" /> {lang === "hi" ? "रास्ते में" : "In Transit"}
          </span>
        );
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {lang === "hi" ? "डिलीवर पूर्ण" : "Delivered"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const isEditableBeforeTransit = (status: OrderItem["status"]) => {
    return status !== "Ready" && status !== "In Transit" && status !== "Delivered" && status !== "Cancelled";
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {lang === "hi" ? "ऑर्डर प्रसारण व डिस्पैच" : "Order Broadcast & Dispatch"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === "hi"
              ? "पर्ची फोटो के साथ ग्राहक ऑर्डर दर्ज करें, पूल में प्रसारित करें व ड्राइवर को सौंपें।"
              : "Register customer orders with parchi slips, broadcast to pool, and dispatch via drivers."}
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 bg-[#1a73e8] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>{lang === "hi" ? "+ नया ऑर्डर दर्ज करें" : "+ Register Order"}</span>
        </button>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: lang === "hi" ? "सभी ऑर्डर्स" : "All Orders", value: "Any", count: orders.length },
          { label: lang === "hi" ? "प्रसारित पूल" : "Broadcasted", value: "Broadcasted", count: orders.filter((o) => o.status === "Broadcasted").length },
          { label: lang === "hi" ? "स्वीकृत व पैकिंग" : "Claimed & Packing", value: "Claimed", count: orders.filter((o) => o.status === "Claimed" || o.status === "Packing").length },
          { label: lang === "hi" ? "डिस्पैच तैयार" : "Ready for Dispatch", value: "Ready", count: orders.filter((o) => o.status === "Ready").length },
          { label: lang === "hi" ? "रास्ते में" : "In Transit", value: "In Transit", count: orders.filter((o) => o.status === "In Transit").length },
          { label: lang === "hi" ? "डिलीवर पूर्ण" : "Delivered", value: "Delivered", count: orders.filter((o) => o.status === "Delivered").length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.value
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Comprehensive Search & Multi-Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Status Filter */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
            >
              <option value="Any">Any Status</option>
              <option value="Broadcasted">Broadcasted (Pool)</option>
              <option value="Claimed">Claimed</option>
              <option value="Packing">Packing</option>
              <option value="Ready">Ready for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Filter by Date
            </label>
            <div className="flex gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
              >
                <option value="ALL">{lang === "hi" ? "सभी तारीखें" : "All Dates"}</option>
                <option value="TODAY">{lang === "hi" ? "आज" : "Today"}</option>
                <option value="YESTERDAY">{lang === "hi" ? "कल" : "Yesterday"}</option>
                <option value="LAST_7">{lang === "hi" ? "पिछले 7 दिन" : "Last 7 Days"}</option>
                <option value="THIS_MONTH">{lang === "hi" ? "इस महीने" : "This Month"}</option>
                <option value="CUSTOM">{lang === "hi" ? "विशिष्ट तारीख चुनें..." : "Specific Date..."}</option>
              </select>

              {dateFilter === "CUSTOM" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white font-mono cursor-pointer"
                />
              )}
            </div>
          </div>

          {/* Sort By Date/Time */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" /> Sort Orders
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium cursor-pointer"
            >
              <option value="NEWEST">Date & Time (Newest First)</option>
              <option value="OLDEST">Date & Time (Oldest First)</option>
              <option value="PRIORITY">Priority (Urgent First)</option>
              <option value="ITEMS_DESC">Items Count (High to Low)</option>
              <option value="CUSTOMER_ASC">Customer Name (A to Z)</option>
              <option value="CUSTOMER_DESC">Customer Name (Z to A)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Search Orders</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search code, customer, phone, notes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="sm:col-span-1">
            <button
              onClick={handleClearFilters}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              title="Reset all filters"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Priority & Staff Assignment */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter size={13} className="text-slate-400" />
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
            >
              <option value="Any">All Priorities</option>
              <option value="Urgent">🚨 Urgent</option>
              <option value="High">⚡ High</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <User size={13} className="text-slate-400" />
            <span>Rider / Staff:</span>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium max-w-[200px]"
            >
              <option value="Any">All Staff</option>
              <option value="UNCLAIMED">Unclaimed Pool</option>
              {employees.map((emp) => (
                <option key={emp.id || emp.code} value={emp.code}>
                  {emp.name} ({emp.code})
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-[11px] text-slate-400 font-mono">
            Showing <strong>{sortedOrders.length}</strong> of {orders.length} orders
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">{lang === "hi" ? "ऑर्डर कोड" : "Order Code"}</th>
                <th className="py-3 px-5">{lang === "hi" ? "ग्राहक विवरण" : "Customer Details"}</th>
                <th className="py-3 px-5">{lang === "hi" ? "सामान व पर्ची" : "Items & Slips"}</th>
                <th className="py-3 px-5">{lang === "hi" ? "स्थिति" : "Status"}</th>
                <th className="py-3 px-5">{lang === "hi" ? "पैक व डिलीवरी माध्यम" : "Packer & Delivery"}</th>
                <th className="py-3 px-5">{lang === "hi" ? "समय" : "Time"}</th>
                <th className="py-3 px-5 text-right">{lang === "hi" ? "कार्य" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sortedOrders.map((order) => {
                const slips = (order.receiptPhotos && order.receiptPhotos.length > 0)
                  ? order.receiptPhotos
                  : (order.receiptPhoto ? [order.receiptPhoto] : []);

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order Code */}
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                          {order.orderCode}
                        </span>
                        {order.priority === "Urgent" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            Urgent
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-slate-500 font-mono flex items-center gap-1 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {order.phone}
                      </div>
                      {order.address && (
                        <div className="text-slate-400 text-[10px] truncate max-w-[200px] mt-0.5">
                          {order.address}
                        </div>
                      )}
                    </td>

                    {/* Items / Slips */}
                    <td className="py-3.5 px-5" onClick={(e) => e.stopPropagation()}>
                      {slips.length > 0 ? (
                        <button
                          onClick={() => {
                            setViewingParchiOrder(order);
                            setActiveSlipIndex(0);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all font-semibold text-xs cursor-pointer"
                          title="View Paper Parchi Slip"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Parchi Slip {slips.length > 1 ? `(${slips.length})` : ""}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 font-medium">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          {order.itemsCount} items parcel
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">{getStatusBadge(order.status)}</td>

                    {/* Packer & Delivery Details */}
                    <td className="py-3.5 px-5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{lang === "hi" ? "पैक:" : "Pack:"}</span>
                        {order.packedBy || order.claimedBy ? (
                          <span className="font-bold text-slate-800 text-xs">{order.packedBy || order.claimedBy}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">{lang === "hi" ? "पूल में खुला" : "Open Pool"}</span>
                        )}
                      </div>

                      <div>
                        {order.deliveryMode === "CUSTOMER_PICKUP" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                            🚗 {lang === "hi" ? "ग्राहक स्वयं ले गया" : "Customer Pickup"}
                          </span>
                        ) : order.assignedDriverName ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                              🚚 {order.assignedDriverName} {order.assignedVehicleNumber ? `(${order.assignedVehicleNumber})` : ""}
                            </span>
                            {order.assignedDriverPhone && (
                              <a href={`tel:${order.assignedDriverPhone}`} className="block text-[10px] text-blue-600 font-medium hover:underline">
                                📞 {order.assignedDriverPhone}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {order.status === "Ready"
                              ? (lang === "hi" ? "⚡ डिस्पैच चयन लंबित" : "⚡ Awaiting Dispatch")
                              : (order.status === "Delivered" ? (lang === "hi" ? "डिलीवर पूर्ण" : "Delivered") : "—")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Created Time */}
                    <td className="py-3.5 px-5 text-xs text-slate-500 font-mono">
                      <div>{order.created}</div>
                      {order.createdByRole === "EMPLOYEE" && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-sans">
                          Emp: {order.createdByName}
                        </span>
                      )}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Button (Enabled before transit) */}
                        {isEditableBeforeTransit(order.status) && (
                          <button
                            onClick={() => handleOpenEditModal(order)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Order (Before Transit)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {order.status === "Ready" ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCustomerHandover(order)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title={lang === "hi" ? "ग्राहक स्वयं ले गया" : "Customer Self-Pickup"}
                            >
                              🚗 {lang === "hi" ? "ग्राहक" : "Self"}
                            </button>
                            <button
                              onClick={() => handleOpenDispatchModal(order)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title={lang === "hi" ? "ड्राइवर को सौंपें" : "Assign Driver"}
                            >
                              🚚 {lang === "hi" ? "ड्राइवर" : "Driver"}
                            </button>
                          </div>
                        ) : order.status === "In Transit" ? (
                          <button
                            onClick={() => handleCompleteDelivery(order)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                            title={lang === "hi" ? "डिलीवरी पूर्ण" : "Mark Delivered"}
                          >
                            ✓ {lang === "hi" ? "डिलीवर" : "Delivered"}
                          </button>
                        ) : order.status !== "Delivered" ? (
                          <button
                            onClick={() => advanceOrderStatus(order)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Advance status"
                          >
                            Next Step →
                          </button>
                        ) : null}

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER ORDER MODAL (MULTIPLE SLIPS SUPPORTED) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register & Broadcast Order</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach one or multiple parchi slip photos and broadcast directly to staff.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Broadcast Target */}
                <div className="sm:col-span-2 space-y-1.5 p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-700" /> Broadcast Assignment Target:
                  </label>
                  <select
                    value={newOrder.assigneeCode}
                    onChange={(e) => setNewOrder({ ...newOrder, assigneeCode: e.target.value })}
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="ALL">📢 Broadcast to All Employees (Open Pool)</option>
                    <optgroup label="Directly Assign to Specific Employee:">
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.code}>
                          👤 {emp.name} ({emp.code}) — {emp.designation || emp.department || "Staff"}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Customer / Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Enterprises"
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Customer Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit phone"
                    value={newOrder.customerPhone}
                    onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                {/* Item Count */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Item Count</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 15"
                    value={newOrder.itemCount}
                    onChange={(e) => setNewOrder({ ...newOrder, itemCount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                {/* Delivery Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Delivery Address / Shop</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop 42, Main Market"
                    value={newOrder.address}
                    onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Items / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Items Summary / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional: List items, sizes, quantities, or special instructions..."
                  value={newOrder.itemsDescription}
                  onChange={(e) => setNewOrder({ ...newOrder, itemsDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Order Priority</label>
                <div className="flex items-center gap-3">
                  {(["Normal", "High", "Urgent"] as const).map((p) => (
                    <label
                      key={p}
                      className={`flex-1 py-2 px-3 border rounded-xl text-xs font-bold text-center cursor-pointer transition-all ${
                        newOrder.priority === p
                          ? p === "Urgent"
                            ? "bg-red-500 text-white border-red-500 shadow-sm"
                            : p === "High"
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        className="sr-only"
                        checked={newOrder.priority === p}
                        onChange={() => setNewOrder({ ...newOrder, priority: p })}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              {/* Multiple Parchi Slip Uploads */}
              <div className="space-y-2 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" /> Upload Parchi Slips (Multiple Slips Allowed)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-blue-700">
                    {newOrder.fileDataUrls.length} Slips Attached
                  </span>
                </div>
                <p className="text-[11px] text-blue-700/80">
                  Select one or multiple photos of paper slips. Employees will view all uploaded slips while packing.
                </p>

                <div className="mt-2 flex items-center gap-3">
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
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  />
                </div>

                {/* Preview Thumbnail Grid */}
                {newOrder.fileDataUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {newOrder.fileDataUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl border border-blue-200 overflow-hidden bg-white shadow-xs group">
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Broadcast Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL (BEFORE TRANSIT) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {editingOrder.orderCode}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                    ✏️ Edit Mode (Before Transit)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Update Order Details</h3>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Customer / Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Customer Phone</label>
                  <input
                    type="tel"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>

                {/* Item Count */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Item Count</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.itemCount}
                    onChange={(e) => setEditForm({ ...editForm, itemCount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>

                {/* Delivery Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Delivery Address / Shop</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Items / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Items Summary / Notes</label>
                <textarea
                  rows={2}
                  value={editForm.itemsDescription}
                  onChange={(e) => setEditForm({ ...editForm, itemsDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Order Priority</label>
                <div className="flex items-center gap-3">
                  {(["Normal", "High", "Urgent"] as const).map((p) => (
                    <label
                      key={p}
                      className={`flex-1 py-2 px-3 border rounded-xl text-xs font-bold text-center cursor-pointer transition-all ${
                        editForm.priority === p
                          ? p === "Urgent"
                            ? "bg-red-500 text-white border-red-500"
                            : p === "High"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit-priority"
                        className="sr-only"
                        checked={editForm.priority === p}
                        onChange={() => setEditForm({ ...editForm, priority: p })}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              {/* Multiple Slips Manager in Edit */}
              <div className="space-y-2 p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600" /> Manage Parchi Slips ({editForm.fileDataUrls.length})
                  </label>
                  <label className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                    <Plus size={13} /> Add More Slips
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

                {/* Thumbnails */}
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
                  <p className="text-[11px] text-slate-500 italic">No paper slips attached yet.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-SLIP PARCHI VIEWER MODAL */}
      {viewingParchiOrder && (() => {
        const slips = (viewingParchiOrder.receiptPhotos && viewingParchiOrder.receiptPhotos.length > 0)
          ? viewingParchiOrder.receiptPhotos
          : (viewingParchiOrder.receiptPhoto ? [viewingParchiOrder.receiptPhoto] : []);
        const currentSlip = slips[activeSlipIndex] || slips[0];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {viewingParchiOrder.orderCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Paper Parchi Slip {slips.length > 1 ? `(${activeSlipIndex + 1} of ${slips.length})` : ""}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingParchiOrder(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Photo View */}
              {currentSlip && currentSlip.startsWith("data:image") ? (
                <div className="space-y-3">
                  <div className="relative p-2 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center min-h-[300px]">
                    <img
                      src={currentSlip}
                      alt={`Parchi ${viewingParchiOrder.orderCode}`}
                      className="max-h-[55vh] w-full object-contain rounded-xl"
                    />

                    {/* Navigation Arrows if Multiple Slips */}
                    {slips.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveSlipIndex((prev) => (prev > 0 ? prev - 1 : slips.length - 1))}
                          className="absolute left-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg transition-all cursor-pointer"
                          title="Previous Slip"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSlipIndex((prev) => (prev < slips.length - 1 ? prev + 1 : 0))}
                          className="absolute right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg transition-all cursor-pointer"
                          title="Next Slip"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Row if Multiple Slips */}
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
                </div>
              ) : (
                /* Paper Slip Graphic fallback */
                <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl font-mono text-xs text-amber-950 space-y-3 shadow-inner">
                  <div className="text-center border-b border-amber-200/80 pb-2">
                    <div className="font-bold text-sm tracking-wider uppercase">Order Parchi Slip</div>
                    <div className="text-[11px] text-amber-800">{viewingParchiOrder.customerName}</div>
                    <div className="text-[10px] text-amber-700">{viewingParchiOrder.phone}</div>
                  </div>

                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Items Count:</span>
                      <span>{viewingParchiOrder.itemsCount} units</span>
                    </div>
                    {viewingParchiOrder.itemsDescription && (
                      <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 text-slate-700 whitespace-pre-wrap">
                        {viewingParchiOrder.itemsDescription}
                      </div>
                    )}
                  </div>

                  <div className="text-center pt-2 text-[10px] text-amber-600">
                    📋 Paper Slip • Registered {viewingParchiOrder.created} •
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-mono">
                  {viewingParchiOrder.customerName} • {viewingParchiOrder.phone}
                </span>
                <button
                  onClick={() => setViewingParchiOrder(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close Slip
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FULL ORDER DETAILS DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                    {selectedOrder.orderCode}
                  </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedOrder.customerName}</h2>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" /> {selectedOrder.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 pt-4">
              {/* Lifecycle Progress Stepper */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Dispatch Lifecycle
                </span>
                <div className="flex items-center justify-between text-xs">
                  {["Broadcasted", "Claimed", "Packing", "Ready", "Delivered"].map((step, idx) => {
                    const steps = ["Broadcasted", "Claimed", "Packing", "Ready", "Delivered"];
                    const currentIdx = steps.indexOf(selectedOrder.status);
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5 flex-1 relative">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isDone
                              ? "bg-emerald-600 text-white"
                              : isCurrent
                              ? "bg-blue-600 text-white ring-4 ring-blue-100"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] text-center font-bold ${
                            isCurrent ? "text-blue-700" : isDone ? "text-slate-700" : "text-slate-400"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Destination</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedOrder.address || "Local Pickup"}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Item Count</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedOrder.itemsCount} items</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Claimed By</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedOrder.claimedBy || "In Broadcast Pool"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Created At</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedOrder.created}</div>
                </div>
              </div>

              {/* Items Summary */}
              {selectedOrder.itemsDescription && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-700">Items Manifest:</span>
                  <p className="text-slate-600">{selectedOrder.itemsDescription}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => deleteOrder(selectedOrder.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel Order
                </button>

                <div className="flex items-center gap-2">
                  {/* Edit Order in Drawer if before transit */}
                  {isEditableBeforeTransit(selectedOrder.status) && (
                    <button
                      onClick={() => {
                        const o = selectedOrder;
                        setSelectedOrder(null);
                        handleOpenEditModal(o);
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Order
                    </button>
                  )}

                  {selectedOrder.status === "Ready" ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const o = selectedOrder;
                          setSelectedOrder(null);
                          handleCustomerHandover(o);
                        }}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        🚗 {lang === "hi" ? "ग्राहक स्वयं ले गया" : "Customer Pickup"}
                      </button>
                      <button
                        onClick={() => {
                          const o = selectedOrder;
                          setSelectedOrder(null);
                          handleOpenDispatchModal(o);
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        🚚 {lang === "hi" ? "ड्राइवर को सौंपें" : "Assign Driver"}
                      </button>
                    </div>
                  ) : selectedOrder.status === "In Transit" ? (
                    <button
                      onClick={() => {
                        const o = selectedOrder;
                        setSelectedOrder(null);
                        handleCompleteDelivery(o);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      ✓ {lang === "hi" ? "डिलीवरी पूर्ण दर्ज करें" : "Mark Delivered"}
                    </button>
                  ) : selectedOrder.status !== "Delivered" ? (
                    <button
                      onClick={() => advanceOrderStatus(selectedOrder)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {lang === "hi" ? "अगला चरण →" : "Advance to Next Step →"}
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                      ✓ {lang === "hi" ? "सफलतापूर्वक डिलीवर हुआ" : "Delivered Successfully"}
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
