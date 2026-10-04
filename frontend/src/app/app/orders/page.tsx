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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  getCRMStore,
  claimOrderInStore,
  updateOrderStatusInStore,
  subscribeToCRMStore,
  OrderItem,
} from "@/lib/store";

export default function EmployeeOrdersPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const employeeName = user?.full_name || user?.name || "Bharat vyas";

  const [tab, setTab] = useState<"pool" | "my">("pool");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [claimedId, setClaimedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingParchi, setViewingParchi] = useState<OrderItem | null>(null);

  // Sync with reactive store across all tabs and windows
  useEffect(() => {
    const loadOrders = () => {
      const store = getCRMStore();
      setOrders(store.orders || []);
    };
    loadOrders();
    const unsubscribe = subscribeToCRMStore(loadOrders);
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const poolOrders = orders.filter((o) => o.status === "Broadcasted");
  const myOrders = orders.filter(
    (o) =>
      o.status !== "Broadcasted" &&
      o.status !== "Draft" &&
      o.status !== "Cancelled"
  );

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
            <LanguageSwitcher />
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full border border-emerald-200 shrink-0">
              {lang === "hi" ? "लाइव सिंक" : "Live Synced"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
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
      </div>

      {tab === "pool" ? (
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
      ) : (
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

      {/* Parchi Preview Modal */}
      {viewingParchi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {lang === "hi" ? "ऑर्डर पर्ची / स्लिप" : "Order Slip / Parchi"}
              </h3>
              <button onClick={() => setViewingParchi(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="bg-slate-50 border rounded-xl p-6 text-center text-xs text-slate-600 space-y-2">
              <FileText size={36} className="mx-auto text-blue-500" />
              <p className="font-bold text-slate-800">{viewingParchi.orderCode} - Counter Slip</p>
              <p className="text-slate-500">{viewingParchi.itemsDescription}</p>
              <p className="text-[10px] text-slate-400">File: {viewingParchi.receiptPhoto}</p>
            </div>
            <button
              onClick={() => setViewingParchi(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {lang === "hi" ? "बंद करें" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
