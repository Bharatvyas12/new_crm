"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Clock, CheckSquare, Package, Bell, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/hooks/use-auth";
import { getCRMStore, subscribeToCRMStore, CRMStoreData } from "@/lib/store";
import {
  sendSystemPhoneNotification,
  ensureWebPushSubscribed,
} from "@/lib/phoneNotifications";

const employeeNav = [
  { href: "/app", labelKey: "dashboard", defaultLabel: "Home", icon: Home },
  { href: "/app/attendance", labelKey: "attendance", defaultLabel: "Attendance", icon: Clock },
  { href: "/app/tasks", labelKey: "tasks", defaultLabel: "Tasks", icon: CheckSquare, badgeKey: "tasks" },
  { href: "/app/orders", labelKey: "orders", defaultLabel: "Orders", icon: Package, badgeKey: "orders" },
  { href: "/app/leaves", labelKey: "leaves", defaultLabel: "Leaves", icon: Calendar },
  { href: "/app/complaints", labelKey: "complaints", defaultLabel: "Alerts", icon: Bell },
];

function parseTimeString(timeStr?: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return { hours: h, minutes: m };
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { t, lang } = useLanguage();
  const [sessionTerminated, setSessionTerminated] = useState(false);

  const [hasPendingTasks, setHasPendingTasks] = useState(false);
  const [hasUnclaimedOrders, setHasUnclaimedOrders] = useState(false);
  const lastReminderRef = useRef<number>(0);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  // Single Device Session Lock Listener (Auto-logout if logged in on another device)
  useEffect(() => {
    if (!user || user.role === "ADMIN") return;
    const empCode = user.employee_id || user.id;
    if (!empCode) return;

    const checkDeviceSession = () => {
      const store = getCRMStore();
      const activeSession = store.activeSessions?.[empCode] || store.activeSessions?.[empCode.toUpperCase()];
      const localSessionId = user.sessionId || (typeof window !== "undefined" ? localStorage.getItem("wcrm_session_id") : null);

      if (activeSession && localSessionId && activeSession.sessionId !== localSessionId) {
        // Another phone logged in!
        setSessionTerminated(true);
        logout();
      }
    };

    checkDeviceSession();
    const unsubscribe = subscribeToCRMStore(checkDeviceSession);
    return () => unsubscribe();
  }, [user, logout]);

    // Ensure WebPush subscription is active
  useEffect(() => {
    if (user?.employee_id || user?.id) {
      ensureWebPushSubscribed(user.employee_id || user.id);
    }
  }, [user]);

  // Compute live badges and run 5-minute recurring reminder checks
  useEffect(() => {
    if (!user) return;

    const empCode = user.employee_id || user.id || "";
    const empName = user.full_name || user.name || "";

    const checkBadgesAndReminders = () => {
      const store = getCRMStore();

      // 1. Task Badge Calculation
      const pendingTasks = (store.tasks || []).filter((task) => {
        if (task.status === "Completed") return false;
        const codeMatch = task.assigneeCode && task.assigneeCode === empCode;
        const nameMatch =
          task.assignee &&
          (task.assignee.toLowerCase() === empName.toLowerCase() ||
            task.assignee.toLowerCase().includes(empName.toLowerCase()) ||
            empName.toLowerCase().includes(task.assignee.toLowerCase()));
        return Boolean(codeMatch || nameMatch);
      });
      setHasPendingTasks(pendingTasks.length > 0);

      // 2. Order Badge Calculation (unclaimed broadcast orders in pool)
      const poolOrders = (store.orders || []).filter((o) => o.status === "Broadcasted" && !o.isDeleted);
      setHasUnclaimedOrders(poolOrders.length > 0);

      // 3. 5-Minute Recurring Reminder Engine
      const nowTs = Date.now();
      const lastTs = parseInt(localStorage.getItem("wcrm_last_reminder_ts") || "0", 10);
      const fiveMinutesMs = 5 * 60 * 1000;

      if (nowTs - lastTs >= fiveMinutesMs) {
        const todayStr = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
        const shift = store.activeShifts?.[empCode];
        const isCheckedIn =
          shift && shift.date === todayStr && (shift.shiftState === "ACTIVE" || shift.shiftState === "ON_BREAK");
        const isCompleted = shift && shift.date === todayStr && shift.shiftState === "COMPLETED";

        const now = new Date();
        const currentMinuteOfDay = now.getHours() * 60 + now.getMinutes();

        const shiftStartObj = parseTimeString(store.settings?.shiftStart || "09:00");
        const shiftEndObj = parseTimeString(store.settings?.shiftEnd || "19:00");

        const shiftStartMinute = shiftStartObj ? shiftStartObj.hours * 60 + shiftStartObj.minutes : 9 * 60;
        const shiftEndMinute = shiftEndObj ? shiftEndObj.hours * 60 + shiftEndObj.minutes : 19 * 60;

        let reminderSent = false;

        // Reminder 1: Missing Check-In during shift hours
        if (currentMinuteOfDay >= shiftStartMinute && currentMinuteOfDay < shiftEndMinute && !isCheckedIn && !isCompleted) {
          sendSystemPhoneNotification(
            "⏰ Attendance Check-In Reminder",
            `Your shift started at ${store.settings?.shiftStart || "09:00 AM"}! Please scan shop QR to mark attendance.`,
            "/app/attendance"
          );
          reminderSent = true;
        }

        // Reminder 2: Missing Check-Out after shift concluded
        else if (currentMinuteOfDay >= shiftEndMinute && isCheckedIn) {
          sendSystemPhoneNotification(
            "🏁 Shift Concluded - Check Out",
            `Shift ended at ${store.settings?.shiftEnd || "07:00 PM"}! Please complete your check out.`,
            "/app/attendance"
          );
          reminderSent = true;
        }

        // Reminder 3: Unclaimed Broadcast Orders in Pool
        else if (poolOrders.length > 0) {
          sendSystemPhoneNotification(
            "📦 New Broadcast Orders Waiting!",
            `${poolOrders.length} order(s) waiting in open pool. Tap to claim before customer leaves!`,
            "/app/orders"
          );
          reminderSent = true;
        }

        // Reminder 4: Pending Assigned Tasks
        else if (pendingTasks.length > 0) {
          sendSystemPhoneNotification(
            "📋 Pending Tasks Reminder",
            `You have ${pendingTasks.length} pending task(s) assigned. Please submit evidence upon completion.`,
            "/app/tasks"
          );
          reminderSent = true;
        }

        if (reminderSent) {
          localStorage.setItem("wcrm_last_reminder_ts", nowTs.toString());
          lastReminderRef.current = nowTs;
        }
      }
    };

    checkBadgesAndReminders();
    const unsub = subscribeToCRMStore(checkBadgesAndReminders);
    // Interval runs every 30 seconds to check badges and 5-min reminders accurately
    const interval = setInterval(checkBadgesAndReminders, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      {/* Main Page Area with comfortable bottom padding so all cards scroll above nav */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 pb-36">
        {children}
        <div className="pt-8 pb-4 text-center space-y-1">
          <p className="text-xs text-slate-400">© 2026 Mahesh Enterprises</p>
          <Link href="/privacy" className="text-xs text-slate-400 hover:text-blue-600 underline underline-offset-2">
            Privacy Policy & Data Security
          </Link>
        </div>
      </main>

      {/* Persistent Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 max-w-lg mx-auto shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {employeeNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const hasBadge =
              (item.badgeKey === "tasks" && hasPendingTasks) ||
              (item.badgeKey === "orders" && hasUnclaimedOrders);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 transition-colors text-center cursor-pointer relative",
                  isActive
                    ? "text-[#1a73e8] font-bold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <div className="relative">
                  <Icon size={22} className={cn("mb-0.5", isActive && "stroke-[2.5px]")} />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-xs" />
                  )}
                </div>
                <span className="text-xs leading-tight font-medium">{t(item.labelKey, item.defaultLabel)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* SINGLE DEVICE LOCK TERMINATION MODAL */}
      {sessionTerminated && (
        <div className="fixed inset-0 z-100 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-red-200">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === "hi" ? "सत्र समाप्त (Session Terminated)" : "Session Terminated"}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {lang === "hi"
                  ? "आपका अकाउंट दूसरे मोबाइल पर खोला गया है। यह सेशन बंद कर दिया गया है।"
                  : "Your account was logged in on another device. This session has been terminated."}
              </p>
            </div>
            <button
              onClick={() => router.replace("/")}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {lang === "hi" ? "लॉगिन पेज पर जाएं" : "Go to Login Page"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
