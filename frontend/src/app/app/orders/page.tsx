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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  getCRMStore,
  claimOrderInStore,
  registerOrderInStore,
  canEmployeeBroadcastOrders,
  updateOrderStatusInStore,
  subscribeToCRMStore,
  OrderItem,
  EmployeeItem,
} from "@/lib/store";
import { playLiveSoundNotification } from "@/lib/syncEngine";
import { compressImage } from "@/lib/imageCompressor";

export default function EmployeeOrdersPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const employeeName = user?.full_name || user?.name || "Staff";

  const [tab, setTab] = useState<"pool" | "my" | "all">("pool");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [canBroadcast, setCanBroadcast] = useState(true);
  const [claimedId, setClaimedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingParchi, setViewingParchi] = useState<OrderItem | null>(null);

  // Broadcast Modal State
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
    fileName: "",
    fileDataUrl: "",
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
    return () => unsubscribe();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const poolOrders = orders.filter((o) => o.status === "Broadcasted");
  const myOrders = orders.filter((o) => {
    if (o.status === "Broadcasted" || o.status === "Draft" || o.status === "Cancelled") return false;
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
  const allOrders = orders.filter((o) => o.status !== "Cancelled" && o.status !== "Draft");

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
    else if (order.status === "Packing") nextStatus = "Packed";
    else if (order.status === "Packed") nextStatus = "Ready";
    else if (order.status === "Ready") nextStatus = "Delivered";

    updateOrderStatusInStore(order.id, nextStatus);
    showToast(
      lang === "hi"
        ? `ऑर्डर ${order.orderCode} स्थिति: ${nextStatus}`
        : `Order ${order.orderCode} status updated to: ${nextStatus}`
    );
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
      receiptPhoto: newOrder.fileDataUrl || (newOrder.fileName ? "uploaded_parchi.jpg" : undefined),
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
      fileName: "",
      fileDataUrl: "",
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

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === "hi" ? "ऑर्डर डिस्पैच एवं डिलीवरी" : "Order Dispatch & Delivery"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "hi"
                ? "लाइव दुकान ऑर्डर पूल और सक्रिय असाइनमेंट"
                : "Real-time shop order pool & active assignments"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter isEmployee={true} />
            <LanguageSwitcher />
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full border border-emerald-200 shrink-0">
              {lang === "hi" ? "लाइव सिंक" : "Live Synced"}
            </span>
          </div>
        </div>
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
                ? "क्या ग्राहक का नया ऑर्डर आया है? यहां से सीधे पूल में ब्रॉडकास्ट करें।"
                : "Got a new customer order? Register and broadcast to pool or yourself."}
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
            tab === "pool" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500"
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
            tab === "my" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500"
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
            tab === "all" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-500"
          }`}
        >
          <Users size={14} />
          <span>
            {lang === "hi" ? "दुकान के सभी" : "All Orders"} ({allOrders.length})
          </span>
        </button>
      </div>

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
            poolOrders.map((order) => (
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
                  {order.receiptPhoto && (
                    <button
                      onClick={() => setViewingParchi(order)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FileText size={13} />
                      <span>{lang === "hi" ? "पर्ची" : "Slip"}</span>
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
            ))
          )}
        </div>
      )}

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
            myOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {order.orderCode}
                    </span>
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

                {/* Slip Viewer Button in My Orders */}
                {order.receiptPhoto && (
                  <button
                    type="button"
                    onClick={() => setViewingParchi(order)}
                    className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>{lang === "hi" ? "दुकान पर्ची / फोटो देखें" : "View Parchi / Photo Slip"}</span>
                  </button>
                )}

                {/* Status Stepper Tracker */}
                <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-100 text-[10px] text-center font-bold">
                  <span
                    className={`p-1 rounded ${
                      order.status === "Claimed"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    1. {lang === "hi" ? "स्वीकृत" : "Claimed"}
                  </span>
                  <span
                    className={`p-1 rounded ${
                      order.status === "Packing"
                        ? "bg-indigo-600 text-white"
                        : ["Packed", "Ready", "Delivered"].includes(order.status)
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    2. {lang === "hi" ? "पैकिंग" : "Packing"}
                  </span>
                  <span
                    className={`p-1 rounded ${
                      ["Packed", "Ready"].includes(order.status)
                        ? "bg-purple-600 text-white"
                        : order.status === "Delivered"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    3. {lang === "hi" ? "तैयार" : "Ready"}
                  </span>
                  <span
                    className={`p-1 rounded ${
                      order.status === "Delivered"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    4. {lang === "hi" ? "डिलीवर" : "Delivered"}
                  </span>
                </div>

                {/* Stepper Action Button */}
                {order.status !== "Delivered" ? (
                  <button
                    onClick={() => advanceStatus(order)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <ArrowRight size={14} />
                    <span>
                      {order.status === "Claimed" && (lang === "hi" ? "पैकिंग शुरू करें" : "Start Packing")}
                      {order.status === "Packing" && (lang === "hi" ? "पैकिंग पूरी मार्क करें" : "Mark Packed")}
                      {order.status === "Packed" && (lang === "hi" ? "डिस्पैच हेतु तैयार मार्क करें" : "Mark Ready for Dispatch")}
                      {order.status === "Ready" && (lang === "hi" ? "ग्राहक को सुपुर्द (डिलीवर)" : "Confirm Customer Handover (Delivered)")}
                    </span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                    <CheckCircle size={15} className="text-emerald-600" />
                    <span>{lang === "hi" ? "सफलतापूर्वक डिलीवर हुआ" : "Delivered Successfully"}</span>
                  </div>
                )}
              </motion.div>
            ))
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
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                      <span>
                        👤 {lang === "hi" ? "असाइन:" : "Assigned:"}{" "}
                        <strong className="text-slate-800">
                          {order.claimedBy || order.assignedToName || (lang === "hi" ? "पूल में खुला (Unclaimed)" : "Open Pool")}
                        </strong>
                      </span>
                      <span>
                        🕒 {order.created}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {order.receiptPhoto && (
                      <button
                        type="button"
                        onClick={() => setViewingParchi(order)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <FileText size={13} />
                        <span>{lang === "hi" ? "पर्ची" : "Slip"}</span>
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

      {/* Parchi Preview Modal */}
      {viewingParchi && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                  {viewingParchi.orderCode}
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  {lang === "hi" ? "ऑर्डर पर्ची / फोटो" : "Order Slip / Parchi"}
                </h3>
              </div>
              <button onClick={() => setViewingParchi(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* If uploaded real image */}
            {viewingParchi.receiptPhoto && viewingParchi.receiptPhoto.startsWith("data:image") ? (
              <div className="space-y-2">
                <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={viewingParchi.receiptPhoto}
                    alt={`Parchi ${viewingParchi.orderCode}`}
                    className="max-h-[60vh] w-full object-contain rounded-xl"
                  />
                </div>
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
      )}

      {/* EMPLOYEE ORDER BROADCAST MODAL */}
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
                    {lang === "hi" ? "दुकान पूल में भेजें या खुद के लिए रखें" : "Send to shop pool or handle directly"}
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

                {newOrder.target === "POOL" && (
                  <p className="text-[10px] text-blue-700 font-medium">
                    {lang === "hi"
                      ? "✓ सभी सक्रिय कर्मचारियों के फोन पर नोटिफिकेशन जाएगा और जो पहले क्लेम करेगा उसे असाइन होगा।"
                      : "✓ Will be broadcasted to pool. Any active staff member can claim it."}
                  </p>
                )}

                {newOrder.target === "SELF" && (
                  <p className="text-[10px] text-indigo-700 font-medium">
                    {lang === "hi"
                      ? "✓ यह ऑर्डर सीधे आपके 'मेरे ऑर्डर्स' टैब में क्लेम होकर जुड़ जाएगा।"
                      : "✓ Will be assigned directly to your active orders queue."}
                  </p>
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

              {/* Parchi Photo Upload */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  {lang === "hi" ? "पर्ची / बिल की फोटो खींचें या अपलोड करें" : "Snap or Upload Parchi Receipt Photo"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImage(file, 800, 800, 0.65);
                        setNewOrder((prev) => ({
                          ...prev,
                          fileName: file.name,
                          fileDataUrl: compressed,
                        }));
                      } catch {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setNewOrder((prev) => ({
                            ...prev,
                            fileName: file.name,
                            fileDataUrl: (event.target?.result as string) || "",
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                />
                {newOrder.fileName && (
                  <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {newOrder.fileName} (Ready)
                  </span>
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
