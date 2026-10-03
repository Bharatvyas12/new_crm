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
  Radio,
  Send,
  User,
  Filter,
  Eye,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";

import {
  getCRMStore,
  saveCRMStore,
  registerOrderInStore,
  updateOrderStatusInStore,
  deleteOrderInStore,
  subscribeToCRMStore,
  OrderItem,
} from "@/lib/store";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("Any");
  const [searchFilter, setSearchFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [viewingParchiOrder, setViewingParchiOrder] = useState<OrderItem | null>(null);

  // Sync with unified reactive store across all tabs & windows
  React.useEffect(() => {
    const loadOrders = () => {
      const store = getCRMStore();
      setOrders(store.orders || []);
    };
    loadOrders();
    const unsubscribe = subscribeToCRMStore(loadOrders);
    return () => unsubscribe();
  }, []);

  // Register Order Form State (NO AMOUNT, NO PAYMENT MODE as requested)
  const [newOrder, setNewOrder] = useState({
    orderCode: "",
    customerName: "",
    customerPhone: "",
    address: "",
    itemCount: "1",
    itemsDescription: "",
    priority: "Normal" as "Normal" | "High" | "Urgent",
    notes: "",
    fileName: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClear = () => {
    setStatusFilter("Any");
    setSearchFilter("");
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName.trim()) {
      alert("Customer Name is required!");
      return;
    }

    const item = registerOrderInStore({
      orderCode: newOrder.orderCode.trim(),
      customerName: newOrder.customerName.trim(),
      phone: newOrder.customerPhone.trim() || "—",
      address: newOrder.address.trim() || "Local Shop Delivery",
      itemsCount: Number(newOrder.itemCount) || 1,
      itemsDescription: newOrder.itemsDescription.trim() || `${newOrder.itemCount || 1} items parcel`,
      priority: newOrder.priority,
      receiptPhoto: newOrder.fileName ? "uploaded_parchi.jpg" : undefined,
      status: "Broadcasted",
      notes: newOrder.notes.trim() || undefined,
    });

    setShowRegisterModal(false);
    showToast(`Order ${item.orderCode} registered & broadcasted to employee pool!`);
    setNewOrder({
      orderCode: "",
      customerName: "",
      customerPhone: "",
      address: "",
      itemCount: "1",
      itemsDescription: "",
      priority: "Normal",
      notes: "",
      fileName: "",
    });
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
    deleteOrderInStore(orderId);
    if (selectedOrder?.id === orderId) setSelectedOrder(null);
    showToast("Order removed from queue");
  };

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== "Any" && ord.status !== statusFilter) {
      return false;
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const match =
        ord.orderCode.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.phone.toLowerCase().includes(q) ||
        (ord.claimedBy && ord.claimedBy.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: OrderItem["status"]) => {
    switch (status) {
      case "Broadcasted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Radio className="w-3 h-3 text-amber-600 animate-pulse" /> Broadcasted
          </span>
        );
      case "Claimed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Claimed
          </span>
        );
      case "Packing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Package className="w-3 h-3 text-purple-600" /> Packing
          </span>
        );
      case "Ready":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Truck className="w-3 h-3 text-indigo-600" /> Ready for Delivery
          </span>
        );
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Broadcast & Dispatch</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Register customer orders with parchi slip photos and broadcast to the workforce queue.
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>+ Register Order</span>
        </button>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: "All Orders", value: "Any", count: orders.length },
          { label: "Broadcasted (Pool)", value: "Broadcasted", count: orders.filter((o) => o.status === "Broadcasted").length },
          { label: "Claimed & Packing", value: "Claimed", count: orders.filter((o) => o.status === "Claimed" || o.status === "Packing").length },
          { label: "Ready / Out for Delivery", value: "Ready", count: orders.filter((o) => o.status === "Ready").length },
          { label: "Delivered", value: "Delivered", count: orders.filter((o) => o.status === "Delivered").length },
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

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Status Filter */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="Any">Any Status</option>
              <option value="Broadcasted">Broadcasted (Pool)</option>
              <option value="Claimed">Claimed</option>
              <option value="Packing">Packing</option>
              <option value="Ready">Ready for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {/* Search */}
          <div className="sm:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Search Orders</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search order code, customer name, phone or rider..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Clear */}
          <div className="sm:col-span-2">
            <button
              onClick={handleClear}
              className="w-full px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Order Code</th>
                <th className="py-3.5 px-5">Customer Details</th>
                <th className="py-3.5 px-5">Items / Parchi Slip</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Claimed By</th>
                <th className="py-3.5 px-5">Created Time</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Order Code */}
                  <td className="py-3.5 px-5">
                    <span className="font-mono text-xs font-bold text-[#1a73e8] bg-blue-50 px-2 py-1 rounded-md">
                      {order.orderCode}
                    </span>
                    {order.priority && order.priority !== "Normal" && (
                      <span
                        className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          order.priority === "Urgent"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.priority}
                      </span>
                    )}
                  </td>

                  {/* Customer Info */}
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-slate-900">{order.customerName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {order.phone}
                    </div>
                  </td>

                  {/* Items / Parchi */}
                  <td className="py-3.5 px-5" onClick={(e) => e.stopPropagation()}>
                    {order.receiptPhoto ? (
                      <button
                        onClick={() => setViewingParchiOrder(order)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200/60"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Parchi Slip ({order.itemsCount} items)
                      </button>
                    ) : (
                      <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        {order.itemsCount} items parcel
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-5">{getStatusBadge(order.status)}</td>

                  {/* Claimed By */}
                  <td className="py-3.5 px-5">
                    {order.claimedBy ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {order.claimedBy.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{order.claimedBy}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                        Unclaimed Pool
                      </span>
                    )}
                  </td>

                  {/* Created Time */}
                  <td className="py-3.5 px-5 text-xs text-slate-500 font-mono">{order.created}</td>

                  {/* Quick Actions */}
                  <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status !== "Delivered" && (
                        <button
                          onClick={() => advanceOrderStatus(order)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Advance status"
                        >
                          Next Step →
                        </button>
                      )}
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
              ))}
              {filteredOrders.length === 0 && (
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

      {/* REGISTER ORDER MODAL (NO AMOUNT, NO PAYMENT MODE) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register & Broadcast Order</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach parchi photo receipt or item count to broadcast instantly to staff.
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
                {/* Order Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Order Code</label>
                  <input
                    type="text"
                    placeholder="Leave blank to auto-generate"
                    value={newOrder.orderCode}
                    onChange={(e) => setNewOrder({ ...newOrder, orderCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Priority Level</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, priority: e.target.value as "Normal" | "High" | "Urgent" })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent (Express)</option>
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
                  placeholder="Optional brief list of items or special handling instructions..."
                  value={newOrder.itemsDescription}
                  onChange={(e) => setNewOrder({ ...newOrder, itemsDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Parchi Photo Upload */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" /> Order Photo / Paper Parchi Slip Upload
                </label>
                <p className="text-[11px] text-blue-700/80">
                  Upload paper bill/receipt photo so employees can pack without manual item typing.
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setNewOrder({ ...newOrder, fileName: e.target.files[0].name });
                      }
                    }}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  />
                  {newOrder.fileName && (
                    <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {newOrder.fileName}
                    </span>
                  )}
                </div>
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

      {/* PARCHI SLIP VIEWER MODAL */}
      {viewingParchiOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {viewingParchiOrder.orderCode}
                </span>
                <h3 className="text-sm font-bold text-slate-900">Parchi Receipt Slip</h3>
              </div>
              <button
                onClick={() => setViewingParchiOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Parchi Graphic */}
            <div className="mt-4 p-5 bg-amber-50/70 border border-amber-200 rounded-2xl font-mono text-xs text-amber-950 space-y-3 shadow-inner">
              <div className="text-center border-b border-amber-200/80 pb-2">
                <div className="font-bold text-sm tracking-wider uppercase">Order Parchi Slip</div>
                <div className="text-[11px] text-amber-800">{viewingParchiOrder.customerName}</div>
                <div className="text-[10px] text-amber-700">{viewingParchiOrder.phone}</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold border-b border-amber-200 pb-1">
                  <span>Item Summary</span>
                  <span>Qty: {viewingParchiOrder.itemsCount}</span>
                </div>
                <p className="text-amber-900 italic py-1">
                  {viewingParchiOrder.itemsDescription || `${viewingParchiOrder.itemsCount} items requested`}
                </p>
                {viewingParchiOrder.address && (
                  <div className="pt-2 text-[10px] text-amber-800 border-t border-amber-200">
                    <span className="font-bold">Destination:</span> {viewingParchiOrder.address}
                  </div>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-amber-600">
                ★ Scanned Paper Slip • Registered {viewingParchiOrder.created} ★
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setViewingParchiOrder(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {selectedOrder.status !== "Delivered" && (
                    <button
                      onClick={() => advanceOrderStatus(selectedOrder)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Advance to Next Step →
                    </button>
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
