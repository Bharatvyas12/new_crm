"use client";

import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";

import { getCRMStore, subscribeToCRMStore } from "@/lib/store";

export default function AdminDashboardPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [installBanner, setInstallBanner] = useState(true);

  // Dynamic Metrics State connected to store
  const [stats, setStats] = useState({
    present: 3,
    totalEmployees: 5,
    absent: 1,
    incomplete: 0,
    pendingCorrections: 1,
    broadcastOpen: 1,
    tasksAwaitingReview: 1,
    pendingLeave: 1,
    openComplaints: 1,
  });

  const refreshStats = () => {
    const store = getCRMStore();
    if (store) {
      const presentCount = (store.attendance || []).filter((a) => a.status === "Present").length;
      const absentCount = (store.attendance || []).filter((a) => a.status === "Absent").length;
      const broadcastedOrders = (store.orders || []).filter((o) => o.status === "Broadcasted").length;
      const pendingLeavesCount = (store.leaves || []).filter((l) => l.status === "PENDING").length;
      const pendingCorrectionsCount = (store.corrections || []).filter((c) => c.status === "Pending").length;
      const tasksToReview = (store.tasks || []).filter((t) => t.status === "Submitted").length;
      const openComplaintsCount = (store.complaints || []).filter((c) => c.status === "OPEN").length;

      setStats({
        present: presentCount,
        totalEmployees: store.employees.length || 3,
        absent: absentCount,
        incomplete: 0,
        pendingCorrections: pendingCorrectionsCount,
        broadcastOpen: broadcastedOrders,
        tasksAwaitingReview: tasksToReview,
        pendingLeave: pendingLeavesCount,
        openComplaints: openComplaintsCount,
      });
    }
  };

  React.useEffect(() => {
    refreshStats();
    const unsubscribe = subscribeToCRMStore(refreshStats);
    return () => unsubscribe();
  }, []);

  // Sample data for drill-down modals
  const presentEmployees = [
    { name: "Bharat vyas", code: "E001", checkIn: "08:55 AM", hours: "9.8h", status: "Full Day", geofence: "28m from shop" },
    { name: "Demo Employee", code: "EMP001", checkIn: "09:00 AM", hours: "10.1h", status: "Full Day (OT +0.5h)", geofence: "15m from shop" },
    { name: "Priya Sharma", code: "EMP002", checkIn: "09:05 AM", hours: "9.5h", status: "Full Day", geofence: "42m from shop" },
    { name: "Amit Patel", code: "EMP003", checkIn: "09:12 AM", hours: "5.5h", status: "Half Day", geofence: "30m from shop" },
    { name: "Sneha Reddy", code: "EMP004", checkIn: "08:45 AM", hours: "10.5h", status: "Full Day (OT +1.0h)", geofence: "18m from shop" },
    { name: "Ananya Gupta", code: "EMP006", checkIn: "09:00 AM", hours: "9.9h", status: "Full Day", geofence: "25m from shop" },
    { name: "Kavita Rao", code: "EMP008", checkIn: "08:50 AM", hours: "10.0h", status: "Full Day", geofence: "35m from shop" },
  ];

  const absentEmployees = [
    { name: "Vikram Singh", code: "EMP005", department: "Packaging", phone: "9876543210", reason: "Unreported Absent" },
  ];

  const pendingLeaves = [
    { id: "1", employee: "Priya Sharma", code: "EMP002", type: "Casual Leave (2 days)", dates: "Oct 06 - Oct 07", reason: "Family function in hometown", quota: "8 CL left" },
  ];

  const tasksForReview = [
    { id: "1", task: "Smoke task - Warehouse Gate Sensor", employee: "Demo Employee", note: "Sensor calibrated to 14.5 bar. Photo uploaded." },
    { id: "2", task: "Line 3 Safety Checklist", employee: "Bharat vyas", note: "Fire extinguishers and first-aid kits inspected." },
  ];

  const openOrders = [
    { id: "1", code: "ORD-0001", customer: "Rahul Enterprises", amount: 14500, address: "Sector 18 Noida", items: "15 items" },
    { id: "2", code: "ORD-0005", customer: "Delhi Industrial Corp", amount: 28000, address: "Okhla Phase II", items: "40 items" },
  ];

  const recentActivities = [
    { title: "Order Claimed", desc: "Demo Employee claimed order #ORD-0002 for dispatch", time: "5m ago", icon: Package, color: "text-blue-600 bg-blue-50" },
    { title: "Correction Submitted", desc: "Bharat vyas requested timestamp fix for Oct 01 shift", time: "22m ago", icon: Clock, color: "text-amber-600 bg-amber-50" },
    { title: "Task Submitted", desc: "Line 3 Safety Checklist evidence uploaded by Demo Employee", time: "1h ago", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { title: "Advance Disbursed", desc: "₹8,000 medical advance approved for Bharat vyas", time: "3h ago", icon: CircleDollarSign, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Today across attendance, work, finance and support.</p>
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

      {/* Workforce Live Attendance Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Workforce Live Attendance Rate</h3>
            <p className="text-xs text-slate-500">
              <strong className="text-emerald-600 font-semibold">{stats.present} of {stats.totalEmployees} Active Staff</strong> checked in on time today (87.5%)
            </p>
          </div>
        </div>
        <div className="w-full sm:w-64 space-y-1.5">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "87.5%" }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>7 Present</span>
            <span>1 Absent</span>
          </div>
        </div>
      </div>

      {/* Section 1: ATTENDANCE TODAY (Interactive Clickable Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            ATTENDANCE TODAY
          </h2>
          <span className="text-[11px] text-blue-600 font-medium">Click any card to inspect details</span>
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
              {stats.present}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">7 on full/half shift</p>
          </div>

          {/* Absent Card */}
          <div
            onClick={() => setActiveModal("ABSENT")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-red-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ABSENT
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-red-500 font-semibold flex items-center gap-0.5">
                Contact <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-red-500 font-mono">
              {stats.absent}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">1 unverified absent</p>
          </div>

          {/* Incomplete Card */}
          <div
            onClick={() => setActiveModal("INCOMPLETE")}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                INCOMPLETE
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-600 font-semibold flex items-center gap-0.5">
                Details <ArrowRight size={10} />
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-600 font-mono">
              {stats.incomplete}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">1 partial shift (&lt;5h)</p>
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
              {stats.pendingCorrections}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">2 timestamp edits</p>
          </div>
        </div>
      </div>

      {/* Section 2: WORK (Interactive Clickable Cards) */}
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
              {stats.broadcastOpen}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">2 orders ready to claim</p>
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
              {stats.tasksAwaitingReview}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">2 evidence uploads pending</p>
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
              {stats.pendingLeave}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">1 casual leave application</p>
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
              {stats.openComplaints}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">1 equipment repair issue</p>
          </div>
        </div>
      </div>

      {/* Grid: Shortcuts & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Shortcuts Box */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Shortcuts</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <Link
              href="/admin/audit"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Audit log
            </Link>
            <Link
              href="/admin/notifications"
              className="flex items-center justify-start px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-slate-50/70 hover:text-blue-700 transition-all shadow-2xs"
            >
              Notifications
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
            {recentActivities.map((act, i) => (
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
            ))}
          </div>
        </div>
      </div>

      {/* Bottom PWA Prompt */}
      {installBanner && (
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-700 font-medium">Install Workforce CRM for faster access.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Workforce CRM is already active and running!")}
              className="px-4 py-1.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setInstallBanner(false)}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: PRESENT STAFF LIST */}
      {activeModal === "PRESENT" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Present Employees Today (7)</h3>
                <p className="text-xs text-slate-500">Live GPS check-in timestamps and logged hours</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {presentEmployees.map((emp, i) => (
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
              ))}
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
                <h3 className="text-lg font-bold text-slate-900">Absent Employees (1)</h3>
                <p className="text-xs text-slate-500">Employees who haven't checked in for today's shift</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {absentEmployees.map((emp, i) => (
                <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                      <p className="text-slate-500">{emp.department} • {emp.code}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                      Absent
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-red-200/50">
                    <span className="font-mono text-slate-600">Phone: {emp.phone}</span>
                    <button
                      onClick={() => alert(`Calling ${emp.phone}...`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a73e8] text-white rounded-lg text-xs font-semibold"
                    >
                      <Phone size={12} />
                      <span>Contact Staff</span>
                    </button>
                  </div>
                </div>
              ))}
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
              <h3 className="text-lg font-bold text-slate-900">Pending Leave Application</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            {pendingLeaves.map((l) => (
              <div key={l.id} className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{l.employee} ({l.code})</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">{l.quota}</span>
                </div>
                <div className="text-slate-600">
                  <p><strong>Type:</strong> {l.type}</p>
                  <p><strong>Duration:</strong> {l.dates}</p>
                  <p className="mt-1 bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">"{l.reason}"</p>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  alert("Leave rejected.");
                  setStats({ ...stats, pendingLeave: 0 });
                  setActiveModal(null);
                }}
                className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-semibold"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  alert("Leave approved successfully.");
                  setStats({ ...stats, pendingLeave: 0 });
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Approve Leave
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
              <h3 className="text-lg font-bold text-slate-900">Tasks Awaiting Review (2)</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {tasksForReview.map((t) => (
                <div key={t.id} className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.task}</span>
                    <span className="text-slate-500 font-medium">By: {t.employee}</span>
                  </div>
                  <p className="text-slate-600 italic">"{t.note}"</p>
                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
                    <button
                      onClick={() => {
                        alert(`Task approved.`);
                        setStats({ ...stats, tasksAwaitingReview: stats.tasksAwaitingReview - 1 });
                      }}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Approve Work
                    </button>
                  </div>
                </div>
              ))}
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
              <h3 className="text-lg font-bold text-slate-900">Broadcasted Orders Pool (2)</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {openOrders.map((o) => (
                <div key={o.id} className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1a73e8] font-mono">{o.code}</span>
                    <span className="font-mono font-bold text-slate-900">₹{o.amount.toLocaleString()}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{o.customer}</p>
                  <p className="text-slate-500">{o.address} • {o.items}</p>
                </div>
              ))}
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
              <h3 className="text-lg font-bold text-slate-900">Pending Corrections (2)</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Bharat vyas & Demo Employee requested check-in timestamp adjustments.
            </p>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <Link
                href="/admin/attendance/corrections"
                className="text-xs font-semibold text-[#1a73e8] hover:underline"
              >
                Open corrections queue →
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

      {/* MODAL 7: COMPLAINTS */}
      {activeModal === "COMPLAINTS" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Open Complaint</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
              <span className="font-bold text-slate-900 block">Forklift Battery Not Charging (Bay B)</span>
              <p className="text-slate-500">Raised by Vikram Singh • Urgent technician check needed.</p>
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
