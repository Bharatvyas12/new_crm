"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  QrCode,
  Package,
  CircleDollarSign,
  FileBarChart,
  Settings,
  History,
  Bell,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Phone,
  MessageSquare,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Inbox,
  AlertTriangle,
} from "lucide-react";

import {
  getCRMStore,
  subscribeToCRMStore,
  updateLeaveStatusInStore,
  reviewTaskInStore,
  updateCorrectionStatusInStore,
  CRMStoreData,
} from "@/lib/store";
import { PhoneNotificationBanner } from "@/components/PhoneNotificationBanner";

export default function AdminDashboardPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [installBanner, setInstallBanner] = useState(true);
  const [storeData, setStoreData] = useState<CRMStoreData | null>(null);

  const refreshState = () => {
    const store = getCRMStore();
    setStoreData(store);
  };

  useEffect(() => {
    refreshState();
    const unsubscribe = subscribeToCRMStore(refreshState);
    return () => unsubscribe();
  }, []);

  const employees = storeData?.employees || [];
  const attendance = storeData?.attendance || [];
  const activeShifts = storeData?.activeShifts || {};
  const orders = storeData?.orders || [];
  const tasks = storeData?.tasks || [];
  const leaves = storeData?.leaves || [];
  const corrections = storeData?.corrections || [];
  const complaints = storeData?.complaints || [];
  const ledger = storeData?.ledger || [];

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  // Working staff members (excluding System Administrator)
  const staffMembers = employees.filter((emp) => !emp.code.includes("ADMIN") && emp.department !== "Management");

  // Present employees: either in activeShifts (ACTIVE or ON_BREAK) or attendance today with status Present
  const presentEmployees = staffMembers.filter((emp) => {
    const shift = activeShifts[emp.code];
    if (shift && (shift.shiftState === "ACTIVE" || shift.shiftState === "ON_BREAK")) return true;
    const att = attendance.find((a) => a.employeeCode === emp.code && a.date === today);
    return att && att.status === "Present";
  }).map((emp) => {
    const shift = activeShifts[emp.code];
    const att = attendance.find((a) => a.employeeCode === emp.code && a.date === today);
    
    let hoursStr = "0.0h";
    if (shift && shift.checkInTimestamp) {
      const elapsedSec = Math.max(0, Math.floor((Date.now() - shift.checkInTimestamp) / 1000) - (shift.totalBreakSeconds || 0));
      hoursStr = `${(elapsedSec / 3600).toFixed(1)}h`;
    } else if (att) {
      hoursStr = `${att.workedHours}h`;
    }

    return {
      name: emp.name,
      code: emp.code,
      department: emp.department,
      checkIn: shift?.checkInTime || att?.checkIn || "—",
      hours: hoursStr,
      status: shift?.shiftState === "ON_BREAK" ? "On Break" : "Active Shift",
      geofence: shift ? `${shift.distanceM}m from shop` : "Verified GPS",
      phone: emp.phone,
    };
  });

  // Absent employees: registered active staff who have neither active shift nor attendance record today
  const absentEmployees = staffMembers.filter((emp) => {
    const shift = activeShifts[emp.code];
    if (shift && (shift.shiftState === "ACTIVE" || shift.shiftState === "ON_BREAK" || shift.shiftState === "COMPLETED")) return false;
    const att = attendance.find((a) => a.employeeCode === emp.code && a.date === today);
    return !att || att.status === "Absent";
  });

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
  const tasksForReview = tasks.filter((t) => t.status === "Submitted");
  const openOrders = orders.filter((o) => o.status === "Broadcasted");
  const pendingCorrectionsList = corrections.filter((c) => c.status === "Pending");
  const openComplaintsList = complaints.filter((c) => c.status === "OPEN");

  const totalEmpCount = employees.length || 1;
  const presentCount = presentEmployees.length;
  const absentCount = absentEmployees.length;
  const attendanceRate = Math.round((presentCount / totalEmpCount) * 100);

  // Dynamic live activity feed from latest actions
  const recentActivities: Array<{ title: string; desc: string; time: string; icon: any; color: string }> = [];

  // Add latest task submissions
  tasks.filter((t) => t.status === "Submitted" || t.status === "Completed").slice(0, 2).forEach((t) => {
    recentActivities.push({
      title: t.status === "Completed" ? "Task Approved" : "Task Submitted",
      desc: `${t.title} (${t.assignee})`,
      time: t.created,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    });
  });

  // Add latest orders
  orders.slice(0, 2).forEach((o) => {
    recentActivities.push({
      title: `Order ${o.status}: ${o.orderCode}`,
      desc: `${o.customerName} • ${o.itemsCount} items (${o.claimedBy ? `Claimed by ${o.claimedBy}` : "Pool"})`,
      time: o.created,
      icon: Package,
      color: "text-blue-600 bg-blue-50",
    });
  });

  // Add latest ledger
  ledger.slice(0, 2).forEach((l) => {
    recentActivities.push({
      title: l.type.replace(/_/g, " "),
      desc: `₹${l.amount.toLocaleString()} for ${l.employeeName}`,
      time: l.date,
      icon: CircleDollarSign,
      color: "text-purple-600 bg-purple-50",
    });
  });

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time workforce overview across attendance, tasks, orders, and ledger.</p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/attendance/qr"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] border border-blue-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <QrCode size={15} />
            <span>Open Shop QR</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Package size={15} />
            <span>+ Dispatch Order</span>
          </Link>
        </div>
      </div>

      {/* Admin Phone Notifications & Audio Controls */}
      <PhoneNotificationBanner userCode="ADMIN" isEmployee={false} />

      {/* Workforce Live Attendance Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Workforce Live Attendance Rate</h3>
            <p className="text-xs text-slate-500">
              <strong className="text-emerald-600 font-semibold">{presentCount} of {totalEmpCount} Staff</strong> checked in today ({attendanceRate}%)
            </p>
          </div>
        </div>
        <div className="w-full sm:w-64 space-y-1.5">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{presentCount} Present</span>
            <span>{absentCount} Absent</span>
          </div>
        </div>
      </div>

      {/* Section 1: ATTENDANCE TODAY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            ATTENDANCE TODAY
          </h2>
          <span className="text-[11px] text-blue-600 font-medium">Click card to inspect</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Present Card */}
          <div
            onClick={() => setActiveModal("PRESENT")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                PRESENT
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 font-semibold flex items-center gap-0.5">
                View list <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600 font-mono">
              {presentCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{presentCount > 0 ? "Active real-time shift logged" : "No staff checked in yet"}</p>
          </div>

          {/* Absent Card */}
          <div
            onClick={() => setActiveModal("ABSENT")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-red-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                NOT CHECKED IN / ABSENT
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-red-500 font-semibold flex items-center gap-0.5">
                Inspect <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-red-500 font-mono">
              {absentCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{absentCount > 0 ? `${absentCount} staff not on duty` : "All staff present"}</p>
          </div>

          {/* Incomplete Card */}
          <div
            onClick={() => setActiveModal("PRESENT")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ACTIVE SHIFTS
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-600 font-semibold flex items-center gap-0.5">
                Details <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-600 font-mono">
              {Object.keys(activeShifts).filter((k) => activeShifts[k]?.shiftState === "ACTIVE").length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Live working right now</p>
          </div>

          {/* Pending Corrections Card */}
          <div
            onClick={() => setActiveModal("CORRECTIONS")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                PENDING CORRECTIONS
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-600 font-semibold flex items-center gap-0.5">
                Review <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-600 font-mono">
              {pendingCorrectionsList.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Timestamp fix requests</p>
          </div>
        </div>
      </div>

      {/* Section 2: WORK & OPERATIONS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          WORK & OPERATIONS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Broadcast Open */}
          <div
            onClick={() => setActiveModal("ORDERS")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                BROADCAST OPEN
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-semibold flex items-center gap-0.5">
                Claim Pool <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900 font-mono">
              {openOrders.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{openOrders.length} orders in claim pool</p>
          </div>

          {/* Tasks Awaiting Review */}
          <div
            onClick={() => setActiveModal("TASKS_REVIEW")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                TASKS AWAITING REVIEW
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-semibold flex items-center gap-0.5">
                Inspect <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-[#1a73e8] font-mono">
              {tasksForReview.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{tasksForReview.length} submitted evidence</p>
          </div>

          {/* Pending Leave */}
          <div
            onClick={() => setActiveModal("LEAVE")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                PENDING LEAVE
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-600 font-semibold flex items-center gap-0.5">
                Approve <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-600 font-mono">
              {pendingLeaves.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{pendingLeaves.length} leave requests</p>
          </div>

          {/* Open Complaints */}
          <div
            onClick={() => setActiveModal("COMPLAINTS")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                OPEN COMPLAINTS
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-600 font-semibold flex items-center gap-0.5">
                Triage <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-600 font-mono">
              {openComplaintsList.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{openComplaintsList.length} active grievance items</p>
          </div>
        </div>
      </div>

      {/* Shortcuts & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Shortcuts */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Admin Modules & Shortcuts</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/admin/attendance"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Attendance
            </Link>
            <Link
              href="/admin/employees"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Employees
            </Link>
            <Link
              href="/admin/attendance/qr"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Shop QR
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Orders
            </Link>
            <Link
              href="/admin/tasks"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Tasks
            </Link>
            <Link
              href="/admin/payroll"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Payroll
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Reports
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Right: Live Activity Feed */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Live Activity Feed</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className={`w-7 h-7 rounded-lg ${act.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <act.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{act.title}</p>
                    <p className="text-slate-500 truncate">{act.desc}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0">{act.time}</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                <Inbox size={24} className="mx-auto mb-2 text-slate-300" />
                No recent activity. Actions taken on any device will appear here instantly.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: PRESENT STAFF LIST */}
      {activeModal === "PRESENT" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Present Employees Today ({presentEmployees.length})</h3>
                <p className="text-xs text-slate-500">Live GPS check-in timestamps and elapsed work hours</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {presentEmployees.length > 0 ? (
                presentEmployees.map((emp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{emp.name} ({emp.code})</span>
                      <span className="text-slate-400">In: {emp.checkIn} • {emp.geofence}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-600 block">{emp.hours}</span>
                      <span className="text-[10px] text-slate-500">{emp.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No staff members have checked in for today's shift yet.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#1a73e8] text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ABSENT EMPLOYEES LIST */}
      {activeModal === "ABSENT" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Not Checked In ({absentEmployees.length})</h3>
                <p className="text-xs text-slate-500">Staff members not yet on duty today</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {absentEmployees.length > 0 ? (
                absentEmployees.map((emp, i) => (
                  <div key={i} className="p-4 bg-red-50/70 border border-red-100 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                        <p className="text-slate-500">{emp.department} • {emp.code}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Not Checked In
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-red-200/50">
                      <span className="font-mono text-slate-600">{emp.phone}</span>
                      <a
                        href={`tel:${emp.phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a73e8] text-white rounded-lg text-xs font-semibold"
                      >
                        <Phone size={12} />
                        <span>Call Staff</span>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  All staff members have checked in for today's shift!
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PENDING LEAVE APPROVAL */}
      {activeModal === "LEAVE" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Pending Leave Applications ({pendingLeaves.length})</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {pendingLeaves.length > 0 ? (
                pendingLeaves.map((l) => (
                  <div key={l.id} className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2.5 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{l.employeeName} ({l.employeeCode})</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">{l.days} days ({l.leaveType})</span>
                    </div>
                    <div className="text-slate-600 space-y-1">
                      <p><strong>Duration:</strong> {l.startDate} to {l.endDate}</p>
                      <p className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">"{l.reason}"</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => {
                          updateLeaveStatusInStore(l.id, "REJECTED");
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          updateLeaveStatusInStore(l.id, "APPROVED");
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Approve Leave
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No pending leave applications.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TASKS AWAITING REVIEW */}
      {activeModal === "TASKS_REVIEW" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Tasks Awaiting Review ({tasksForReview.length})</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {tasksForReview.length > 0 ? (
                tasksForReview.map((t) => (
                  <div key={t.id} className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{t.title}</span>
                      <span className="text-slate-500 font-medium">By: {t.assignee}</span>
                    </div>
                    <p className="text-slate-600 italic">"{t.evidenceNote || "No note provided"}"</p>
                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
                      <button
                        onClick={() => {
                          reviewTaskInStore(t.id, "REJECT", "Incomplete verification");
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          reviewTaskInStore(t.id, "APPROVE");
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Approve Work
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No tasks currently awaiting review.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#1a73e8] text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ACTIVE ORDERS POOL */}
      {activeModal === "ORDERS" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Broadcasted Orders ({openOrders.length})</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {openOrders.length > 0 ? (
                openOrders.map((o) => (
                  <div key={o.id} className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1a73e8] font-mono">{o.orderCode}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">{o.priority} Priority</span>
                    </div>
                    <p className="font-semibold text-slate-800">{o.customerName} ({o.phone})</p>
                    <p className="text-slate-500">{o.address || "Address on file"} • {o.itemsCount} items: {o.itemsDescription || ""}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No broadcasted orders pending dispatch.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-[#1a73e8] hover:underline"
              >
                Go to full order manager →
              </Link>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#1a73e8] text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CORRECTIONS */}
      {activeModal === "CORRECTIONS" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Pending Corrections ({pendingCorrectionsList.length})</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingCorrectionsList.length > 0 ? (
                pendingCorrectionsList.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-200 space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{c.employee} ({c.code})</span>
                      <span className="text-amber-600">{c.date}</span>
                    </div>
                    <p className="text-slate-600">Requested: <strong>{c.requestedTime}</strong> (Was: {c.originalTime})</p>
                    <p className="text-slate-500 italic">"{c.reason}"</p>
                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
                      <button
                        onClick={() => updateCorrectionStatusInStore(c.id, "Rejected")}
                        className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => updateCorrectionStatusInStore(c.id, "Approved")}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No attendance correction requests pending.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#1a73e8] text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: COMPLAINTS */}
      {activeModal === "COMPLAINTS" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Open Complaints ({openComplaintsList.length})</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {openComplaintsList.length > 0 ? (
                openComplaintsList.map((c) => (
                  <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                    <span className="font-bold text-slate-900 block">{c.subject}</span>
                    <p className="text-slate-500">Raised by {c.raisedBy} ({c.department}) • Priority: {c.priority}</p>
                    <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 mt-1">"{c.description}"</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No open employee grievances or issues.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <Link
                href="/admin/complaints"
                className="text-xs font-semibold text-[#1a73e8] hover:underline"
              >
                Open complaints thread →
              </Link>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#1a73e8] text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
