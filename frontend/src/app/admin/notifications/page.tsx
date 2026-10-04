"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Package,
  CheckSquare,
  Clock,
  AlertTriangle,
  DollarSign,
  CalendarOff,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { getCRMStore, subscribeToCRMStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

interface DynamicNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  category: "ORDER" | "TASK" | "ADVANCE" | "LEAVE" | "CORRECTION";
  link: string;
  unread: boolean;
}

export default function NotificationsPage() {
  const { lang, t } = useLanguage();
  const [notifications, setNotifications] = useState<DynamicNotification[]>([]);

  const loadNotifications = () => {
    const store = getCRMStore();
    const list: DynamicNotification[] = [];

    // 1. Unclaimed Orders
    (store.orders || [])
      .filter((o) => o.status === "Broadcasted")
      .forEach((o) => {
        list.push({
          id: `ord-${o.id}`,
          title:
            lang === "hi"
              ? `अनक्लेम्ड ऑर्डर: ${o.orderCode} (${o.customerName})`
              : `Unclaimed Order: ${o.orderCode} (${o.customerName})`,
          desc:
            lang === "hi"
              ? `पूल में क्लेम होने की प्रतीक्षा में। कुल सामान: ${o.itemsCount}`
              : `Awaiting staff claim in pool. Items: ${o.itemsCount}, Dest: ${o.address || "Shop pickup"}`,
          time: o.created || "Recently",
          category: "ORDER",
          link: "/admin/orders",
          unread: true,
        });
      });

    // 2. Claimed / Active Orders
    (store.orders || [])
      .filter((o) => o.status !== "Broadcasted" && o.status !== "Delivered")
      .forEach((o) => {
        list.push({
          id: `ord-claimed-${o.id}`,
          title:
            lang === "hi"
              ? `ऑर्डर प्रगति में: ${o.orderCode} (${o.claimedBy || "कर्मचारी"})`
              : `Order in Progress: ${o.orderCode} (${o.claimedBy || "Staff"})`,
          desc:
            lang === "hi"
              ? `वर्तमान स्थिति: ${o.status}`
              : `Current operational status: ${o.status}`,
          time: o.claimedAt || o.created || "Today",
          category: "ORDER",
          link: "/admin/orders",
          unread: false,
        });
      });

    // 3. Task Submissions
    (store.tasks || [])
      .filter((t) => t.status === "Submitted")
      .forEach((tsk) => {
        list.push({
          id: `tsk-${tsk.id}`,
          title:
            lang === "hi"
              ? `कार्य सबूत जमा: ${tsk.title}`
              : `Task Evidence Submitted: ${tsk.title}`,
          desc:
            lang === "hi"
              ? `${tsk.assignee} ने कार्य पूरा करने का सबूत जमा किया है। सत्यापन करें।`
              : `${tsk.assignee} submitted completion evidence: ${tsk.evidenceNote || "Photo proof attached"}`,
          time: tsk.created || "Today",
          category: "TASK",
          link: "/admin/tasks/review",
          unread: true,
        });
      });

    // 4. Pending Advances
    (store.advances || [])
      .filter((a) => a.status === "Pending Approval")
      .forEach((adv) => {
        list.push({
          id: `adv-${adv.id}`,
          title:
            lang === "hi"
              ? `सैलरी एडवांस आवेदन: ₹${adv.amount.toLocaleString()} (${adv.employee})`
              : `Salary Advance Request: ₹${adv.amount.toLocaleString()} (${adv.employee})`,
          desc:
            lang === "hi"
              ? `कारण: ${adv.reason} • भुगतान मोड: ${adv.mode}`
              : `Reason: ${adv.reason} • Recovery: ${adv.mode}`,
          time: adv.requestedAt || "Recently",
          category: "ADVANCE",
          link: "/admin/ledger/advances",
          unread: true,
        });
      });

    // 5. Pending Leaves
    (store.leaves || [])
      .filter((l) => l.status === "PENDING")
      .forEach((lv) => {
        list.push({
          id: `lv-${lv.id}`,
          title:
            lang === "hi"
              ? `अवकाश आवेदन: ${lv.employeeName} (${lv.days} दिन)`
              : `Leave Application: ${lv.employeeName} (${lv.days} day(s))`,
          desc:
            lang === "hi"
              ? `प्रकार: ${lv.leaveType} • कारण: ${lv.reason}`
              : `Type: ${lv.leaveType} • Reason: ${lv.reason}`,
          time: lv.appliedAt || "Recently",
          category: "LEAVE",
          link: "/admin/leaves",
          unread: true,
        });
      });

    // 6. Attendance Corrections
    (store.corrections || [])
      .filter((c) => c.status === "Pending")
      .forEach((corr) => {
        list.push({
          id: `corr-${corr.id}`,
          title:
            lang === "hi"
              ? `हाज़िरी सुधार अनुरोध: ${corr.employee}`
              : `Attendance Correction: ${corr.employee}`,
          desc:
            lang === "hi"
              ? `अनुरोधित समय: ${corr.requestedTime} • कारण: ${corr.reason}`
              : `Requested Time: ${corr.requestedTime} • Reason: ${corr.reason}`,
          time: corr.submittedAt || "Today",
          category: "CORRECTION",
          link: "/admin/attendance/corrections",
          unread: true,
        });
      });

    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = subscribeToCRMStore(loadNotifications);
    return () => unsubscribe();
  }, [lang]);

  const getIcon = (cat: DynamicNotification["category"]) => {
    switch (cat) {
      case "ORDER":
        return <Package size={16} className="text-blue-600" />;
      case "TASK":
        return <CheckSquare size={16} className="text-purple-600" />;
      case "ADVANCE":
        return <DollarSign size={16} className="text-emerald-600" />;
      case "LEAVE":
        return <CalendarOff size={16} className="text-amber-600" />;
      default:
        return <Clock size={16} className="text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {lang === "hi" ? "सिस्टम नोटिफिकेशन व अलर्ट्स" : "System Notifications & Live Alerts"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {lang === "hi"
              ? "कार्यबल गतिविधियों, अनक्लेम्ड ऑर्डर और वित्तीय अनुरोधों के रियल-टाइम अलर्ट।"
              : "Real-time stream of workforce tasks, unclaimed pool orders, and approvals."}
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 self-start sm:self-auto">
          {notifications.length} {lang === "hi" ? "सक्रिय अलर्ट" : "Active Alerts"}
        </span>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <h3 className="font-bold text-slate-800 text-base">
              {lang === "hi" ? "सभी कार्य व अलर्ट क्लियर हैं!" : "All caught up!"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {lang === "hi"
                ? "कोई भी अनक्लेम्ड ऑर्डर, पेंडिंग टास्क या अनुमति हेतु आवेदन बाकी नहीं है।"
                : "No pending approval requests, unclaimed orders, or overdue submissions."}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link}
              className={`block bg-white border rounded-2xl p-4 shadow-xs transition-all hover:border-slate-300 group cursor-pointer ${
                n.unread ? "border-blue-200 bg-blue-50/15" : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {n.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.desc}</p>
                  <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-blue-600 mt-2">
                    <span>{lang === "hi" ? "कार्रवाई करें →" : "Take Action →"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
