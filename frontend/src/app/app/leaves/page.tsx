"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import {
  getCRMStore,
  subscribeToCRMStore,
  applyLeaveInStore,
  LeaveRequest,
  EmployeeItem,
} from "@/lib/store";

export default function EmployeeLeavesPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"]>("Casual Leave");
  const [period, setPeriod] = useState<LeaveRequest["period"]>("FULL_DAY");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    const store = getCRMStore();
    const empCode = user?.employee_id || user?.id || "";
    const empName = user?.full_name || user?.name || "";

    // Find current employee in store
    const currentEmp = (store.employees || []).find(
      (e) =>
        e.code === empCode ||
        (empCode && e.code.toLowerCase() === empCode.toLowerCase()) ||
        (empName && e.name.toLowerCase() === empName.toLowerCase())
    );
    setEmployee(currentEmp || null);

    // Filter leaves for this employee
    const filtered = (store.leaves || []).filter((l) => {
      if (empCode && l.employeeCode === empCode) return true;
      if (empName && l.employeeName.toLowerCase().includes(empName.toLowerCase())) return true;
      return false;
    });
    setMyLeaves(filtered);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToCRMStore(loadData);
    return () => unsub();
  }, [user]);

  // Compute calculated days
  const calculateDays = (): number => {
    if (period === "FIRST_HALF" || period === "SECOND_HALF") {
      return 0.5;
    }
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 1;
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const daysCount = calculateDays();

  // Balances
  const casualRemaining = employee ? employee.casualLeaves ?? 12 : 12;
  const sickRemaining = employee ? employee.sickLeaves ?? 8 : 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast(lang === "hi" ? "कृपया छुट्टी का कारण लिखें।" : "Please specify a reason for leave.");
      return;
    }

    setIsSubmitting(true);
    try {
      const empCode = employee?.code || user?.employee_id || user?.id || "EMP";
      const empName = employee?.name || user?.full_name || user?.name || "Employee";
      const empDept = employee?.department || "Operations";

      const created = applyLeaveInStore({
        employeeName: empName,
        employeeCode: empCode,
        department: empDept,
        leaveType,
        startDate,
        endDate: period === "FULL_DAY" ? endDate : startDate,
        period,
        days: daysCount,
        reason: reason.trim(),
      });

      showToast(
        lang === "hi"
          ? `✓ छुट्टी आवेदन (${daysCount} दिन) सफलतापूर्वक भेजा गया!`
          : `✓ Leave application (${daysCount} days) submitted successfully!`
      );
      setShowApplyModal(false);
      setReason("");
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to submit leave application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-3xl mx-auto animate-in fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 rounded-3xl text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-blue-100 backdrop-blur-xs mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{lang === "hi" ? "कर्मचारी अवकाश पोर्टल" : "Employee Leave Management"}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {lang === "hi" ? "छुट्टी आवेदन & बैलेंस" : "Leaves & Applications"}
          </h1>
          <p className="text-xs text-blue-100/90 mt-1">
            {employee
              ? `${employee.name} (${employee.code}) • ${employee.department}`
              : (lang === "hi" ? "आधिकारिक अवकाश के लिए आवेदन करें" : "Apply for planned or medical leave")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowApplyModal(true)}
          className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-md hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-blue-700" />
          <span>{lang === "hi" ? "छुट्टी के लिए आवेदन करें" : "Apply for Leave"}</span>
        </button>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === "hi" ? "कैजुअल लीव (CL)" : "Casual Leave (CL)"}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono">{casualRemaining}</span>
            <span className="text-xs text-slate-400 font-medium">/ 12 {lang === "hi" ? "दिन" : "days"}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {lang === "hi" ? "सवैतनिक पारिवारिक/निजी अवकाश" : "Paid personal & family leave"}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === "hi" ? "मेडिकल लीव (SL)" : "Sick Leave (SL)"}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono">{sickRemaining}</span>
            <span className="text-xs text-slate-400 font-medium">/ 8 {lang === "hi" ? "दिन" : "days"}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {lang === "hi" ? "सवैतनिक स्वास्थ्य अवकाश" : "Paid medical & illness leave"}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              {lang === "hi" ? "कुल आवेदन" : "Total Applied"}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono">{myLeaves.length}</span>
            <span className="text-xs text-slate-400 font-medium">{lang === "hi" ? "रिकॉर्ड" : "requests"}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {myLeaves.filter((l) => l.status === "APPROVED").length} {lang === "hi" ? "स्वीकृत" : "approved"} •{" "}
            {myLeaves.filter((l) => l.status === "PENDING").length} {lang === "hi" ? "लंबित" : "pending"}
          </p>
        </div>
      </div>

      {/* Applied Leaves History List */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {lang === "hi" ? "आपके आवेदन और स्थिति" : "Application History & Status"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "hi"
                ? "मालिक/एडमिन द्वारा स्वीकृत या लंबित छुट्टियां"
                : "Real-time approval status from management"}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {myLeaves.length} {lang === "hi" ? "आवेदन" : "records"}
          </span>
        </div>

        {myLeaves.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">
                {lang === "hi" ? "कोई छुट्टी आवेदन नहीं मिला" : "No leave applications yet"}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {lang === "hi"
                  ? "यदि आपको छुट्टी चाहिए, तो ऊपर दिए गए 'छुट्टी के लिए आवेदन करें' बटन पर क्लिक करके फॉर्म भरें।"
                  : "Tap 'Apply for Leave' above whenever you need time off from store shifts."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {myLeaves.map((lv) => {
              const isPending = lv.status === "PENDING";
              const isApproved = lv.status === "APPROVED";
              const isRejected = lv.status === "REJECTED";

              return (
                <div
                  key={lv.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isPending
                      ? "bg-amber-50/50 border-amber-200"
                      : isApproved
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-red-50/40 border-red-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{lv.leaveType}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 font-semibold text-slate-700">
                          {lv.days} {lv.days === 1 ? (lang === "hi" ? "दिन" : "Day") : (lang === "hi" ? "दिन" : "Days")}
                        </span>
                        {lv.period !== "FULL_DAY" && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {lv.period === "FIRST_HALF" ? (lang === "hi" ? "पहला हाफ" : "First Half") : (lang === "hi" ? "दूसरा हाफ" : "Second Half")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {lv.startDate} {lv.endDate && lv.endDate !== lv.startDate ? `— ${lv.endDate}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isPending && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          <span>{lang === "hi" ? "लंबित (Pending)" : "Pending"}</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{lang === "hi" ? "स्वीकृत (Approved)" : "Approved"}</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1.5 shadow-2xs">
                          <XCircle className="w-3.5 h-3.5 text-red-700" />
                          <span>{lang === "hi" ? "अस्वीकृत (Rejected)" : "Rejected"}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason Text */}
                  <div className="bg-white/80 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {lang === "hi" ? "कारण (Reason)" : "Reason"}
                    </span>
                    <p className="leading-relaxed">{lv.reason || "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* APPLY LEAVE MODAL */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === "hi" ? "छुट्टी का आवेदन पत्र" : "Leave Application Form"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === "hi" ? "विवरण भरें और अनुमोदन के लिए भेजें" : "Fill details for manager approval"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Employee Info Header */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">{employee?.name || user?.full_name || "Employee"}</span>
                  </div>
                  <span className="font-mono text-slate-500 font-semibold">{employee?.code || user?.employee_id || ""}</span>
                </div>

                {/* Leave Type */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {lang === "hi" ? "छुट्टी का प्रकार (Leave Type)" : "Leave Type"} *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "Casual Leave", label: lang === "hi" ? "कैजुअल लीव (Paid)" : "Casual Leave (Paid)" },
                      { value: "Sick Leave", label: lang === "hi" ? "मेडिकल लीव (Paid)" : "Sick Leave (Paid)" },
                      { value: "Emergency Leave", label: lang === "hi" ? "आपातकालीन (Emergency)" : "Emergency Leave" },
                      { value: "Unpaid Leave", label: lang === "hi" ? "अवैतनिक (Unpaid)" : "Unpaid Leave" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLeaveType(opt.value as any)}
                        className={`p-2.5 rounded-xl border text-left font-semibold cursor-pointer transition-all ${
                          leaveType === opt.value
                            ? "bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {lang === "hi" ? "अवधि (Duration)" : "Period"} *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "FULL_DAY", label: lang === "hi" ? "पूरा दिन" : "Full Day" },
                      { value: "FIRST_HALF", label: lang === "hi" ? "पहला हाफ" : "First Half" },
                      { value: "SECOND_HALF", label: lang === "hi" ? "दूसरा हाफ" : "Second Half" },
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPeriod(p.value as any)}
                        className={`p-2 rounded-xl border text-center font-semibold cursor-pointer transition-all ${
                          period === p.value
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      {lang === "hi" ? "प्रारंभ तिथि (Start Date)" : "Start Date"} *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (period !== "FULL_DAY" || e.target.value > endDate) {
                          setEndDate(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {period === "FULL_DAY" && (
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">
                        {lang === "hi" ? "समाप्ति तिथि (End Date)" : "End Date"} *
                      </label>
                      <input
                        type="date"
                        required
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Days Summary Badge */}
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between text-blue-950 font-medium">
                  <span>{lang === "hi" ? "कुल छुट्टियां:" : "Total Requested Days:"}</span>
                  <strong className="text-sm font-mono font-extrabold text-blue-800">
                    {daysCount} {daysCount === 1 ? (lang === "hi" ? "दिन" : "Day") : (lang === "hi" ? "दिन" : "Days")}
                  </strong>
                </div>

                {/* Reason Field */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {lang === "hi" ? "कारण / विवरण (Reason)" : "Reason / Purpose"} *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      lang === "hi"
                        ? "जैसे: पारिवारिक कार्य, जरूरी व्यक्तिगत काम या स्वास्थ्य समस्या..."
                        : "e.g., Attending family wedding, doctor appointment, personal work..."
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="w-1/3 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer hover:bg-slate-50"
                  >
                    {lang === "hi" ? "रद्द करें" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reason.trim()}
                    className={`w-2/3 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      reason.trim()
                        ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95 shadow-blue-500/20"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === "hi" ? "आवेदन जमा करें" : "Submit Leave Application"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
