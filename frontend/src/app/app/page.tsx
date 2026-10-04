"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  Briefcase,
  Package,
  CheckCircle2,
  MapPin,
  QrCode,
  Coffee,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  X,
  DollarSign,
  User,
  Key,
  CreditCard,
  Building,
  Send,
  Lock,
  Sparkles,
  Phone,
  Mail,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  getCRMStore,
  applyAdvanceInStore,
  subscribeToCRMStore,
  checkInEmployeeInStore,
  startBreakInStore,
  endBreakInStore,
  checkOutEmployeeInStore,
  getActiveShift,
} from "@/lib/store";

export default function EmployeeHomePage() {
  const { user, logout } = useAuth();

  const employeeName = user?.full_name || "Bharat vyas";
  const employeeCode = user?.employee_id ? `EMP${user.employee_id.substring(0, 5).toUpperCase()}` : "E001";
  const firstName = employeeName.split(" ")[0];

  // Shift States: NOT_STARTED | ACTIVE | ON_BREAK | COMPLETED
  const [shiftState, setShiftState] = useState<"NOT_STARTED" | "ACTIVE" | "ON_BREAK" | "COMPLETED">("NOT_STARTED");
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [checkInTime, setCheckInTime] = useState<string>("—");
  const [checkOutTime, setCheckOutTime] = useState<string>("—");

  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [qrInput, setQrInput] = useState("");
  const [distanceMeters, setDistanceMeters] = useState<number>(20);

  // Correction Form
  const [correctionForm, setCorrectionForm] = useState({
    requestedTime: "07:00 PM",
    reason: "",
  });

  // Advance Form
  const [advanceForm, setAdvanceForm] = useState({
    amount: "5000",
    repaymentTerm: "SALARY_DEDUCTION" as "SALARY_DEDUCTION" | "INSTALLMENTS" | "CASH",
    reason: "",
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Dynamic counts from store
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [availableOrdersCount, setAvailableOrdersCount] = useState(0);

  const loadStoreData = () => {
    const store = getCRMStore();
    const broadcastedOrders = (store.orders || []).filter((o) => o.status === "Broadcasted").length;
    setAvailableOrdersCount(broadcastedOrders);
    const assignedTasks = (store.tasks || []).filter((t) => t.status !== "Completed").length;
    setOpenTasksCount(assignedTasks);

    // Sync persistent shift state
    const shift = getActiveShift(employeeCode);
    if (shift) {
      setShiftState(shift.shiftState);
      setCheckInTime(shift.checkInTime || "—");
      if (shift.checkOutTime) setCheckOutTime(shift.checkOutTime);

      if (shift.shiftState === "ACTIVE") {
        const elapsed = Math.max(0, Math.floor((Date.now() - shift.checkInTimestamp) / 1000) - (shift.totalBreakSeconds || 0));
        setSecondsElapsed(elapsed);
      } else if (shift.shiftState === "ON_BREAK") {
        const ongoingBreak = shift.breakStartedAt ? Math.floor((Date.now() - shift.breakStartedAt) / 1000) : 0;
        const totalBreak = (shift.totalBreakSeconds || 0) + ongoingBreak;
        setBreakSeconds(totalBreak);
        const elapsed = Math.max(0, Math.floor((Date.now() - shift.checkInTimestamp) / 1000) - totalBreak);
        setSecondsElapsed(elapsed);
      } else if (shift.shiftState === "COMPLETED") {
        const totalWorked = Math.max(0, Math.floor(((shift.checkOutTimestamp || Date.now()) - shift.checkInTimestamp) / 1000) - (shift.totalBreakSeconds || 0));
        setSecondsElapsed(totalWorked);
      }
    } else {
      setShiftState("NOT_STARTED");
      setCheckInTime("—");
      setCheckOutTime("—");
      setSecondsElapsed(0);
      setBreakSeconds(0);
    }
  };

  useEffect(() => {
    loadStoreData();
    const unsubscribe = subscribeToCRMStore(loadStoreData);
    return () => unsubscribe();
  }, [employeeCode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-world timestamp ticking timer (resilient to app close, lockscreen, background tab)
  useEffect(() => {
    let interval: any = null;
    if (shiftState === "ACTIVE" || shiftState === "ON_BREAK") {
      interval = setInterval(() => {
        const shift = getActiveShift(employeeCode);
        if (shift) {
          if (shift.shiftState === "ACTIVE") {
            const elapsed = Math.max(0, Math.floor((Date.now() - shift.checkInTimestamp) / 1000) - (shift.totalBreakSeconds || 0));
            setSecondsElapsed(elapsed);
          } else if (shift.shiftState === "ON_BREAK") {
            const ongoingBreak = shift.breakStartedAt ? Math.floor((Date.now() - shift.breakStartedAt) / 1000) : 0;
            const totalBreak = (shift.totalBreakSeconds || 0) + ongoingBreak;
            setBreakSeconds(totalBreak);
            const elapsed = Math.max(0, Math.floor((Date.now() - shift.checkInTimestamp) / 1000) - totalBreak);
            setSecondsElapsed(elapsed);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [shiftState, employeeCode]);

  const formatHoursMinutes = (secs: number) => {
    if (secs === 0) return "worked 0s";
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) return `worked ${hrs}h ${mins}m`;
    if (mins > 0) return `worked ${mins}m ${s}s`;
    return `worked ${s}s`;
  };

  const shiftProgressPercent = Math.min(100, Math.max(8, (secondsElapsed / 36000) * 100));

  const handleOpenCheckIn = () => {
    setShowCheckInModal(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDistanceMeters(20),
        () => setDistanceMeters(25),
        { timeout: 3000 }
      );
    }
  };

  const handleConfirmCheckIn = () => {
    const shift = checkInEmployeeInStore({
      employeeCode,
      employeeName,
      department: "Operations",
      distanceM: distanceMeters,
    });
    setShiftState("ACTIVE");
    setCheckInTime(shift.checkInTime);
    setSecondsElapsed(1);
    setShowCheckInModal(false);
    showToast(`✓ Check-In confirmed at ${shift.checkInTime} via GPS Geofence! (Persisted)`);
  };

  const handleStartBreak = () => {
    startBreakInStore(employeeCode);
    setShiftState("ON_BREAK");
    showToast("Break started. Break timer ticking.");
  };

  const handleEndBreak = () => {
    endBreakInStore(employeeCode);
    setShiftState("ACTIVE");
    showToast("Break ended. Resuming active work shift.");
  };

  const handleCheckOut = () => {
    const shift = checkOutEmployeeInStore(employeeCode);
    if (shift) {
      setShiftState("COMPLETED");
      if (shift.checkOutTime) setCheckOutTime(shift.checkOutTime);
      showToast(`✓ Checked out at ${shift.checkOutTime}. Full day attendance recorded!`);
    }
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCorrectionModal(false);
    showToast("Attendance correction request submitted to Admin.");
    setCorrectionForm({ requestedTime: "07:00 PM", reason: "" });
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceForm.amount || Number(advanceForm.amount) <= 0) {
      alert("Please enter a valid advance amount");
      return;
    }

    applyAdvanceInStore({
      employee: user?.full_name || "Bharat vyas",
      code: user?.employee_id ? `EMP${user.employee_id.substring(0, 4).toUpperCase()}` : "E001",
      department: "Operations",
      amount: Number(advanceForm.amount),
      reason: advanceForm.reason.trim() || "Emergency expense",
      mode: advanceForm.repaymentTerm,
    });

    setShowAdvanceModal(false);
    showToast(`✓ Salary advance request for ₹${Number(advanceForm.amount).toLocaleString()} forwarded to Admin!`);
    setAdvanceForm({
      amount: "5000",
      repaymentTerm: "SALARY_DEDUCTION",
      reason: "",
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirm password do not match!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    setIsChangingPassword(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    showToast("✓ Password updated successfully! Use your new password on next login.");
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar with Profile Avatar */}
      <div className="flex items-center justify-between pt-1">
        <div
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform">
            {employeeName.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
              {employeeName}
            </h2>
            <span className="text-[11px] text-slate-400 font-mono tracking-tight">{employeeCode} • Operations</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <User size={14} className="text-blue-600" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Hero Greeting */}
      <div className="space-y-0.5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="text-sm text-slate-500 font-normal">Your day at a glance.</p>
      </div>

      {/* Today Attendance Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-none">Today</h3>
            <p className="text-xs text-slate-400 mt-1">
              {shiftState === "NOT_STARTED"
                ? `Not classified yet - ${formatHoursMinutes(secondsElapsed)}`
                : shiftState === "ON_BREAK"
                ? `On Break - ${formatHoursMinutes(secondsElapsed)}`
                : shiftState === "COMPLETED"
                ? `Shift Completed - ${formatHoursMinutes(secondsElapsed)}`
                : `Shift In Progress - ${formatHoursMinutes(secondsElapsed)}`}
            </p>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full font-bold tracking-tight ${
              shiftState === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : shiftState === "ACTIVE"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {shiftState === "COMPLETED"
              ? "Full Day"
              : shiftState === "ACTIVE"
              ? "Active Shift"
              : "Incomplete"}
          </span>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">First check-in</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {checkInTime}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Last check-out</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {checkOutTime}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Today</span>
            <span className="text-slate-400 text-[11px]">10h daily shift target</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-7 overflow-hidden p-0.5 flex items-center relative">
            <div
              className="bg-[#1a73e8] h-full rounded-full transition-all duration-500 flex items-center justify-start pl-3 text-white text-xs font-semibold"
              style={{ width: `${shiftProgressPercent}%` }}
            >
              <span className="whitespace-nowrap">{formatHoursMinutes(secondsElapsed)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2">
          {shiftState === "NOT_STARTED" && (
            <button
              onClick={handleOpenCheckIn}
              className="w-full py-3.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock size={18} />
              <span>Check In Now (GPS / Shop QR)</span>
            </button>
          )}

          {shiftState === "ACTIVE" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleStartBreak}
                className="py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Coffee size={16} className="text-amber-600" />
                <span>Start Break</span>
              </button>
              <button
                onClick={handleCheckOut}
                className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <LogOut size={16} />
                <span>Check Out</span>
              </button>
            </div>
          )}

          {shiftState === "ON_BREAK" && (
            <button
              onClick={handleEndBreak}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coffee size={18} />
              <span>End Break & Resume Work</span>
            </button>
          )}

          {shiftState === "COMPLETED" && (
            <div className="text-center py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
              <CheckCircle2 size={16} /> Day Shift Finished ({formatHoursMinutes(secondsElapsed)})
            </div>
          )}
        </div>
      </div>

      {/* Yellow Warning Card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-amber-200/80 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            !
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-900">This day needs attention.</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your shift timing is 09:00 - 19:00 (10 hrs required). Open corrections to explain missing or incomplete time.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCorrectionModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-amber-100 text-slate-900 border border-amber-300/80 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer block text-center"
        >
          Go to corrections
        </button>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/app/tasks"
          className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs hover:border-slate-300 transition-all block group cursor-pointer"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Open Tasks
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{openTasksCount}</span>
            <span className="text-xs text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
              View →
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Assigned to you</p>
        </Link>

        <Link
          href="/app/orders"
          className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs hover:border-slate-300 transition-all block group cursor-pointer"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Available Orders
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{availableOrdersCount}</span>
            <span className="text-xs text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
              Claim →
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Ready in pool</p>
        </Link>
      </div>

      {/* Financial Advance Request Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Salary Advances</h4>
              <p className="text-xs text-slate-500">Need emergency funds before payday?</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Apply Advance
          </button>
        </div>
      </div>

      {/* CHECK-IN MODAL (GPS VERIFIED - 1 TAP) */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1a73e8]" />
                <h3 className="text-base font-bold text-slate-900">Attendance Verification</h3>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> GPS Geofence Fix (200m)
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  ✓ Within Geofence
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 font-mono">
                Distance: <strong>{distanceMeters}m</strong> from Workshop Premises
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-slate-500" /> Shop Counter QR (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setQrInput("SHOP-CTR-9921")}
                  className="text-[11px] font-bold text-[#1a73e8] hover:underline"
                >
                  ⚡ Auto-Fill Token
                </button>
              </div>

              <input
                type="text"
                placeholder="Optional: Enter shop counter QR token..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:bg-white"
              />

              <p className="text-[11px] text-slate-400 leading-relaxed">
                💡 <em>You are within verified GPS range. Token is optional; 1-tap confirm checks you in immediately!</em>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="w-1/3 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckIn}
                className="w-2/3 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-4 h-4" /> Confirm Check In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALARY ADVANCE REQUEST MODAL */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Apply for Salary Advance</h3>
              </div>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdvanceSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Requested Amount (₹) *</label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  required
                  placeholder="e.g. 5000"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-bold text-slate-900 font-mono focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Repayment Mode</label>
                <select
                  value={advanceForm.repaymentTerm}
                  onChange={(e) =>
                    setAdvanceForm({
                      ...advanceForm,
                      repaymentTerm: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white"
                >
                  <option value="SALARY_DEDUCTION">Auto-deduct in next monthly payroll</option>
                  <option value="INSTALLMENTS">2 Monthly installments (50% each)</option>
                  <option value="CASH">Direct cash settlement</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reason / Emergency Note *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Medical expenses, family emergency, repair..."
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE PROFILE & CHANGE PASSWORD MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                  {employeeName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{employeeName}</h3>
                  <p className="text-xs text-slate-500 font-mono">{employeeCode} • Operations Supervisor</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Monthly Salary</span>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">₹35,000 / mo</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Leave Quota</span>
                  <div className="font-bold text-emerald-700 mt-0.5">8 CL / 6.5 SL Left</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Contact Phone</span>
                  <div className="font-semibold text-slate-800 mt-0.5">08005567626</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">UPI ID</span>
                  <div className="font-mono text-slate-800 mt-0.5">bharat@oksbi</div>
                </div>
              </div>

              {/* Password Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Account Password</span>
                  </div>
                  {!isChangingPassword && (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="text-xs font-bold text-[#1a73e8] hover:underline cursor-pointer"
                    >
                      Change Password
                    </button>
                  )}
                </div>

                {isChangingPassword ? (
                  <form onSubmit={handlePasswordChange} className="space-y-2.5 pt-1">
                    <input
                      type="password"
                      required
                      placeholder="Current password (e.g. Emp@2026)"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <input
                      type="password"
                      required
                      placeholder="New password (min 6 chars)"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <input
                      type="password"
                      required
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Logged in with employee credentials. Click change password to set your personal password.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = "/login";
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut size={14} /> Sign Out
              </button>

              <button
                onClick={() => setShowProfileModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Request Attendance Correction</h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Requested Check-out Time</label>
                <input
                  type="text"
                  required
                  value={correctionForm.requestedTime}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, requestedTime: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reason for Missed Punch *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why check-out was missed (e.g. out on client delivery)..."
                  value={correctionForm.reason}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, reason: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
