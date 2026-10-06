"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Package,
  CheckSquare,
  DollarSign,
  CalendarOff,
  Clock,
  AlertTriangle,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { getCRMStore, subscribeToCRMStore, OrderItem, TaskItem } from "@/lib/store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";

import {
  requestPhoneNotificationPermission,
  isNotificationPermissionGranted,
  triggerTestPhonePush,
  playNotificationTune,
} from "@/lib/phoneNotifications";

export interface LiveNotificationItem {
  id: string;
  type: "ORDER" | "TASK" | "ADVANCE" | "LEAVE" | "CORRECTION";
  title: string;
  description: string;
  time: string;
  urgency: "HIGH" | "MEDIUM" | "NORMAL";
  link: string;
}

export function NotificationCenter({ isEmployee = false }: { isEmployee?: boolean }) {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const empCode = (user?.employee_id || "E001").trim().toUpperCase();
  const empName = (user?.full_name || user?.name || "Bharat vyas").trim().toLowerCase();

  const playNotificationChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const computeNotifications = () => {
    const store = getCRMStore();
    const items: LiveNotificationItem[] = [];

    if (isEmployee) {
      // 1. Unclaimed Pool Orders (Immediate Action Reminder)
      const unclaimedOrders = (store.orders || []).filter((o) => o.status === "Broadcasted");
      if (unclaimedOrders.length > 0) {
        items.push({
          id: `unclaimed-orders-${unclaimedOrders.length}`,
          type: "ORDER",
          title:
            lang === "hi"
              ? `🚨 ${unclaimedOrders.length} नए ऑर्डर क्लेम हेतु उपलब्ध`
              : `🚨 ${unclaimedOrders.length} Unclaimed Order(s) in Pool`,
          description:
            lang === "hi"
              ? "दुकान काउंटर से नए ऑर्डर प्रसारित किए गए हैं। तुरंत क्लेम करें।"
              : "Customer orders waiting for pickup/packing. Claim to begin dispatch.",
          time: "Live pool",
          urgency: "HIGH",
          link: "/app/orders",
        });
      }

      // 2. Incomplete / Pending Tasks for this employee
      const myIncompleteTasks = (store.tasks || []).filter((t) => {
        const taskCode = (t.assigneeCode || "").trim().toUpperCase();
        const taskAssignee = (t.assignee || "").trim().toLowerCase();
        const matchesMe =
          taskCode === empCode ||
          taskAssignee === empName ||
          taskAssignee.includes(empName) ||
          empName.includes(taskAssignee) ||
          taskAssignee === "all" ||
          taskAssignee === "all employees";
        return matchesMe && (t.status === "Assigned" || t.status === "In Progress");
      });

      if (myIncompleteTasks.length > 0) {
        items.push({
          id: `incomplete-tasks-${myIncompleteTasks.length}`,
          type: "TASK",
          title:
            lang === "hi"
              ? `⏰ ${myIncompleteTasks.length} लंबित कार्य (Pending Tasks)`
              : `⏰ ${myIncompleteTasks.length} Incomplete Task(s) Pending`,
          description:
            lang === "hi"
              ? `आपको सौंपे गए कार्य अधूरे हैं: ${myIncompleteTasks.map((t) => t.title).join(", ")}`
              : `Awaiting completion: ${myIncompleteTasks.map((t) => t.title).join(", ")}`,
          time: "Due today",
          urgency: "MEDIUM",
          link: "/app/tasks",
        });
      }

      // 3. Active Shift reminder if shift not started
      const activeShift = store.activeShifts?.[empCode];
      if (!activeShift || activeShift.shiftState === "NOT_STARTED") {
        items.push({
          id: "shift-not-started",
          type: "CORRECTION",
          title:
            lang === "hi"
              ? "📍 हाज़िरी चेक-इन बाकी है"
              : "📍 Shift Check-In Pending",
          description:
            lang === "hi"
              ? "आज का कार्य समय रिकॉर्ड करने हेतु GPS / QR चेक-इन करें।"
              : "Tap Check-In to record your daily attendance and start shift timer.",
          time: "Morning",
          urgency: "NORMAL",
          link: "/app",
        });
      }
    } else {
      // ADMIN NOTIFICATIONS
      // 1. Unclaimed Orders waiting
      const unclaimedOrders = (store.orders || []).filter((o) => o.status === "Broadcasted");
      if (unclaimedOrders.length > 0) {
        items.push({
          id: `admin-unclaimed-${unclaimedOrders.length}`,
          type: "ORDER",
          title:
            lang === "hi"
              ? `📦 ${unclaimedOrders.length} ऑर्डर अभी तक किसी ने नहीं लिए (Unclaimed)`
              : `📦 ${unclaimedOrders.length} Order(s) Unclaimed in Pool`,
          description:
            lang === "hi"
              ? "फील्ड कर्मचारियों द्वारा ऑर्डर क्लेम होना बाकी है।"
              : "Orders are broadcasted and awaiting staff claim for packing.",
          time: "Awaiting staff",
          urgency: "HIGH",
          link: "/admin/orders",
        });
      }

      // 2. Task Evidence Submissions Awaiting Admin Review
      const reviewTasks = (store.tasks || []).filter((t) => t.status === "Submitted");
      if (reviewTasks.length > 0) {
        items.push({
          id: `admin-review-tasks-${reviewTasks.length}`,
          type: "TASK",
          title:
            lang === "hi"
              ? `📋 ${reviewTasks.length} कार्य सबूत समीक्षा हेतु लंबित`
              : `📋 ${reviewTasks.length} Task Completion(s) Awaiting Review`,
          description:
            lang === "hi"
              ? `${reviewTasks.map((t) => t.assignee).join(", ")} द्वारा कार्य सबूत जमा किए गए हैं।`
              : `Evidence submitted by ${reviewTasks.map((t) => t.assignee).join(", ")}.`,
          time: "Review Queue",
          urgency: "HIGH",
          link: "/admin/tasks/review",
        });
      }

      // 3. Pending Advance Requests
      const pendingAdvances = (store.advances || []).filter((a) => a.status === "Pending Approval");
      if (pendingAdvances.length > 0) {
        items.push({
          id: `admin-advances-${pendingAdvances.length}`,
          type: "ADVANCE",
          title:
            lang === "hi"
              ? `💰 ${pendingAdvances.length} सैलरी एडवांस आवेदन अनुमोदन हेतु लंबित`
              : `💰 ${pendingAdvances.length} Salary Advance Request(s) Pending`,
          description:
            lang === "hi"
              ? `कुल राशि ₹${pendingAdvances.reduce((acc, a) => acc + a.amount, 0).toLocaleString()} (कर्मचारी: ${pendingAdvances.map((a) => a.employee).join(", ")})`
              : `Total ₹${pendingAdvances.reduce((acc, a) => acc + a.amount, 0).toLocaleString()} from ${pendingAdvances.map((a) => a.employee).join(", ")}`,
          time: "Financial ledger",
          urgency: "HIGH",
          link: "/admin/ledger/advances",
        });
      }

      // 4. Pending Leave Applications
      const pendingLeaves = (store.leaves || []).filter((l) => l.status === "PENDING");
      if (pendingLeaves.length > 0) {
        items.push({
          id: `admin-leaves-${pendingLeaves.length}`,
          type: "LEAVE",
          title:
            lang === "hi"
              ? `🏖️ ${pendingLeaves.length} अवकाश (Leave) आवेदन लंबित`
              : `🏖️ ${pendingLeaves.length} Leave Application(s) Pending`,
          description:
            lang === "hi"
              ? `${pendingLeaves.map((l) => `${l.employeeName} (${l.days} दिन)`).join(", ")}`
              : `Requests from ${pendingLeaves.map((l) => `${l.employeeName} (${l.days}d)`).join(", ")}`,
          time: "HR approval",
          urgency: "MEDIUM",
          link: "/admin/leaves",
        });
      }

      // 5. Pending Attendance Corrections
      const pendingCorrections = (store.corrections || []).filter((c) => c.status === "Pending");
      if (pendingCorrections.length > 0) {
        items.push({
          id: `admin-corrections-${pendingCorrections.length}`,
          type: "CORRECTION",
          title:
            lang === "hi"
              ? `⏱️ ${pendingCorrections.length} हाज़िरी सुधार अनुरोध`
              : `⏱️ ${pendingCorrections.length} Attendance Correction(s) Pending`,
          description:
            lang === "hi"
              ? `${pendingCorrections.map((c) => c.employee).join(", ")}`
              : `Time adjustments submitted by staff.`,
          time: "Operations",
          urgency: "NORMAL",
          link: "/admin/attendance/corrections",
        });
      }
    }

    // Play chime if new notifications increased
    if (prevCount !== null && items.length > prevCount) {
      playNotificationChime();
    }
    setPrevCount(items.length);
    setNotifications(items);
  };

  useEffect(() => {
    computeNotifications();
    if (typeof window !== "undefined") {
      setHasPerm(isNotificationPermissionGranted());
    }
    const unsubscribe = subscribeToCRMStore(computeNotifications);
    return () => unsubscribe();
  }, [isEmployee, empCode, empName, soundEnabled]);

  const totalCount = notifications.length;

  return (
    <div className="relative font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
        title={lang === "hi" ? "सूचनाएं एवं अनुस्मारक" : "Notifications & Live Reminders"}
      >
        <Bell size={18} />
        {totalCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-xs">
            {totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {lang === "hi" ? "लाइव सूचनाएं एवं रिमाइंडर्स" : "Live Alerts & Reminders"}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
                >
                  {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Phone Push & Tune Setup Bar */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Volume2 size={14} className="text-blue-600" />
                  {lang === "hi" ? "फोन रिंगटोन व पुश अलर्ट" : "Phone Sound & Push Alerts"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasPerm ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {hasPerm ? "✓ Active" : "Action Needed"}
                </span>
              </div>

              {!hasPerm ? (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await requestPhoneNotificationPermission(empCode);
                    setHasPerm(ok);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell size={13} />
                  <span>{lang === "hi" ? "🔔 फोन में नोटिफिकेशन चालू करें (Allow)" : "🔔 Enable Phone Push & Ringtone"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={testLoading}
                  onClick={async () => {
                    setTestLoading(true);
                    playNotificationTune();
                    const res = await triggerTestPhonePush();
                    setTestLoading(false);
                    setTestMessage(res.success ? `✓ Alert Sent to ${res.registered} phone(s)! Check notification bar.` : "Alert triggered locally.");
                    setTimeout(() => setTestMessage(null), 4000);
                  }}
                  className="w-full py-1.5 bg-white hover:bg-slate-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Volume2 size={13} className="text-blue-600" />
                  <span>{testLoading ? "Sending..." : "📲 Test Sound Alert (Ringtone & Vibrate)"}</span>
                </button>
              )}

              {testMessage && (
                <p className="text-[11px] text-emerald-700 font-semibold text-center">{testMessage}</p>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <Bell size={28} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">
                    {lang === "hi" ? "सभी कार्य व ऑर्डर अपडेटेड हैं" : "All caught up!"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {lang === "hi"
                      ? "कोई लंबित रिमाइंडर्स या अनक्लेम्ड ऑर्डर नहीं हैं।"
                      : "No pending reminders or unclaimed pool orders."}
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => setIsOpen(false)}
                    className={`block p-3 rounded-2xl border transition-all text-xs group cursor-pointer ${
                      n.urgency === "HIGH"
                        ? "bg-red-50/70 border-red-200 hover:bg-red-100/70"
                        : n.urgency === "MEDIUM"
                        ? "bg-amber-50/70 border-amber-200 hover:bg-amber-100/70"
                        : "bg-blue-50/70 border-blue-200 hover:bg-blue-100/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5
                        className={`font-bold leading-tight ${
                          n.urgency === "HIGH"
                            ? "text-red-900"
                            : n.urgency === "MEDIUM"
                            ? "text-amber-900"
                            : "text-blue-900"
                        }`}
                      >
                        {n.title}
                      </h5>
                      <span className="text-[10px] font-mono font-medium text-slate-500 whitespace-nowrap">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {n.description}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-blue-600 mt-2 group-hover:translate-x-0.5 transition-transform">
                      <span>{lang === "hi" ? "विवरण देखें →" : "View Details →"}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
