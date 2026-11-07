"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Banknote,
  Calendar,
  CheckCircle2,
  Download,
  Clock,
  DollarSign,
  FileText,
  Printer,
  X,
  Check,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Building,
  User,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  getCRMStore,
  subscribeToCRMStore,
  addLedgerEntryInStore,
  CRMStoreData,
  Employee,
} from "@/lib/store";

export interface EmployeeSalaryRecord {
  employeeId: string;
  name: string;
  code: string;
  department: string;
  designation: string;
  baseSalary: number;
  dailyRate: number;
  workedDays: number;
  totalDaysInMonth: number;
  earnedSalary: number;
  advanceDeduction: number;
  netPay: number;
  bankAccount: string;
  ifsc: string;
  upiId?: string;
  status: "CALCULATED" | "APPROVED" | "PAID";
}

function getDaysInMonthFromStr(monthStr: string): number {
  const months: Record<string, number> = {
    january: 31, february: 28, march: 31, april: 30, may: 31, june: 30,
    july: 31, august: 31, september: 30, october: 31, november: 30, december: 31
  };
  const lower = monthStr.toLowerCase();
  for (const [m, days] of Object.entries(months)) {
    if (lower.includes(m)) return days;
  }
  return 30;
}

function computeLivePayrollRecords(store: CRMStoreData, currentMonthStr: string): EmployeeSalaryRecord[] {
  // Operational staff
  const staff = (store.employees || []).filter(
    (e) => !e.code.includes("ADMIN") && e.department !== "Management"
  );

  const requiredHours = Number(store.settings?.requiredDailyHours) || 10;
  const totalDaysInMonth = getDaysInMonthFromStr(currentMonthStr);

  return staff.map((emp) => {
    const empCode = emp.code.trim().toUpperCase();

    // 1. Attendance calculation from store for this employee
    const empAttendance = (store.attendance || []).filter(
      (a) => a.employeeCode.trim().toUpperCase() === empCode
    );

    // Calculate worked days:
    // If worked hours >= requiredDailyHours, counts as 1 full day
    // If worked hours >= requiredDailyHours / 2, counts as 0.5 day
    let workedDays = 0;
    empAttendance.forEach((a) => {
      const worked = Number(a.workedHours) || 0;
      if (worked >= requiredHours || a.classification === "FULL_DAY" || a.status === "Present") {
        workedDays += 1;
      } else if (worked >= requiredHours / 2 || a.classification === "HALF_DAY") {
        workedDays += 0.5;
      } else if (worked > 0) {
        workedDays += Number((worked / requiredHours).toFixed(1));
      }
    });

    // Check if active today and not yet logged in store.attendance
    const shift = store.activeShifts ? store.activeShifts[emp.code] : undefined;
    const isWorkingToday = shift && (shift.shiftState === "ACTIVE" || shift.shiftState === "ON_BREAK" || shift.shiftState === "COMPLETED");
    if (isWorkingToday && !empAttendance.some((r) => r.date === shift.date)) {
      const workedSecs = shift.checkInTimestamp
        ? Math.floor(((shift.checkOutTimestamp || Date.now()) - shift.checkInTimestamp) / 1000) - (shift.totalBreakSeconds || 0)
        : 0;
      const workedHrs = workedSecs / 3600;
      if (workedHrs >= requiredHours) {
        workedDays += 1;
      } else if (workedHrs >= requiredHours / 2) {
        workedDays += 0.5;
      } else if (workedHrs > 0) {
        workedDays += Number((workedHrs / requiredHours).toFixed(1));
      }
    }

    const baseSalary = Number(emp.baseSalary) || 0;
    const dailyRate = totalDaysInMonth > 0 ? Math.round(baseSalary / totalDaysInMonth) : 0;

    // Earned salary strictly based on worked days. Overtime is completely excluded.
    const earnedSalary = Math.round(workedDays * dailyRate);

    // Advance recovery auto-deduction
    const empAdvances = (store.advances || []).filter(
      (adv) => (adv.code || adv.employeeId || "").trim().toUpperCase() === empCode && adv.status === "Disbursed"
    );
    const advanceDeduction = empAdvances
      .filter((adv) => adv.mode === "SALARY_DEDUCTION")
      .reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0);

    const netPay = Math.max(0, earnedSalary - advanceDeduction);

    return {
      employeeId: emp.id,
      name: emp.name,
      code: emp.code,
      department: emp.department || "Operations",
      designation: emp.designation || "Staff",
      baseSalary,
      dailyRate,
      workedDays,
      totalDaysInMonth,
      earnedSalary,
      advanceDeduction,
      netPay,
      bankAccount: emp.bankAccount || "—",
      ifsc: emp.bankIfsc || "—",
      upiId: emp.upiId || "",
      status: "CALCULATED",
    };
  });
}

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState("October 2026 (Live Current)");
  const [records, setRecords] = useState<EmployeeSalaryRecord[]>([]);
  const [payrollStatus, setPayrollStatus] = useState<"DRAFT" | "APPROVED" | "PAID">("DRAFT");
  const [viewingPayslip, setViewingPayslip] = useState<EmployeeSalaryRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadPayroll = () => {
    const store = getCRMStore();
    const liveRecords = computeLivePayrollRecords(store, selectedMonth);
    setRecords(liveRecords);
  };

  useEffect(() => {
    loadPayroll();
    const unsubscribe = subscribeToCRMStore(loadPayroll);
    return () => unsubscribe();
  }, [selectedMonth]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunNewPayroll = () => {
    loadPayroll();
    setPayrollStatus("DRAFT");
    showToast("✓ Payroll refreshed and recalculated using real-time attendance, shifts & advances!");
  };

  const handleApprovePayroll = () => {
    setPayrollStatus("APPROVED");
    setRecords((prev) => prev.map((r) => ({ ...r, status: "APPROVED" })));
    showToast("✓ Payroll approved! Ready for payout disbursement.");
  };

  const handleDisbursePayroll = () => {
    setPayrollStatus("PAID");
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

    // Auto-record real entries into store ledger
    records.forEach((rec) => {
      addLedgerEntryInStore({
        employeeName: rec.name,
        employeeCode: rec.code,
        type: "SALARY_CREDIT",
        amount: rec.netPay,
        paymentMode: "Bank Transfer",
        description: `Monthly Salary Disbursed for ${selectedMonth} (Net ₹${rec.netPay.toLocaleString()})`,
        date: now,
      });
    });

    setRecords((prev) => prev.map((r) => ({ ...r, status: "PAID" })));
    showToast(`✓ ₹${records.reduce((a, b) => a + b.netPay, 0).toLocaleString()} disbursed and auto-posted to Ledger!`);
  };

  // CSV Export for Accountant / Banker
  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast("No employee records to export.");
      return;
    }

    const headers = [
      "Employee Code",
      "Employee Name",
      "Department",
      "Designation",
      "Monthly Base Salary",
      "Daily Rate",
      "Days Worked",
      "Total Month Days",
      "Gross Earned Salary",
      "Advance Deductions",
      "Net Payable",
      "Bank Account",
      "IFSC Code",
      "UPI ID",
      "Status",
    ];

    const rows = records.map((r) => [
      `"${r.code}"`,
      `"${r.name}"`,
      `"${r.department}"`,
      `"${r.designation}"`,
      r.baseSalary,
      r.dailyRate,
      r.workedDays,
      r.totalDaysInMonth,
      r.earnedSalary,
      r.advanceDeduction,
      r.netPay,
      `"${r.bankAccount}"`,
      `"${r.ifsc}"`,
      `"${r.upiId || ""}"`,
      `"${r.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payroll_${selectedMonth.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("✓ Real Payroll CSV downloaded successfully!");
  };

  // KPIs
  const grossTotal = records.reduce((acc, curr) => acc + curr.earnedSalary, 0);
  const totalDeductions = records.reduce(
    (acc, curr) => acc + curr.advanceDeduction,
    0
  );
  const totalNetPayout = records.reduce((acc, curr) => acc + curr.netPay, 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monthly Payroll Engine</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Automated net salary computation based on real live attendance (daily working hours target) and advance repayments. No overtime added.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRunNewPayroll}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Recalculate Live</span>
          </button>
          <Link
            href="/admin/employees"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Users size={14} />
            <span>Manage Staff Salaries</span>
          </Link>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Automated Live Computation Formula:</span>
          <p className="text-blue-800 leading-relaxed">
            <code>Net Payable = (Monthly Base Salary / Month Days) × Days Worked - Advance Deductions</code>.
            Each full day is counted when checked-in duration meets or exceeds the daily working hours decided by admin. Overtime is not added to salary. Disbursed salaries auto-post to the Double-Entry Ledger.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Selected Period
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
            >
              <option value="October 2026 (Live Current)">Oct 2026 (Live - 31 Days)</option>
              <option value="September 2026">Sep 2026 (30 Days)</option>
              <option value="August 2026">Aug 2026 (31 Days)</option>
            </select>
          </div>
          <div className="text-base font-bold text-slate-900 mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            {selectedMonth.split(" ")[0]} 2026
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{records.length} Active Staff Enrolled</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Earned Gross Pay
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
            ₹{grossTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Earned based on worked days</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Advance Deductions
          </span>
          <div className="text-2xl font-bold text-red-600 font-mono mt-2">
            -₹{totalDeductions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Disbursed salary advances</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Net Payout Amount
          </span>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-2">
            ₹{totalNetPayout.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-700 mt-1">
            Status: <span className="text-[#1a73e8]">{payrollStatus}</span>
          </div>
        </div>
      </div>

      {/* Run Approval Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-500">Run State:</span>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold ${
              payrollStatus === "PAID"
                ? "bg-emerald-100 text-emerald-800"
                : payrollStatus === "APPROVED"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {payrollStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {payrollStatus === "DRAFT" && (
            <button
              onClick={handleApprovePayroll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              ✓ Approve & Lock Payroll
            </button>
          )}

          {payrollStatus === "APPROVED" && (
            <button
              onClick={handleDisbursePayroll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              💸 Mark as Paid & Disburse to Ledger
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Download size={14} /> Export Real CSV
          </button>
        </div>
      </div>

      {/* Salary Breakdown Table or Clean Empty State */}
      {records.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Staff Employees Enrolled</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no active operational employees in your directory. Add employees and their base salary to automatically compute monthly payroll.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/employees"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus size={14} /> Add Employees Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-5">Department</th>
                  <th className="py-3.5 px-5 text-right">Monthly Base</th>
                  <th className="py-3.5 px-5 text-right">Daily Rate</th>
                  <th className="py-3.5 px-5 text-center">Days Worked</th>
                  <th className="py-3.5 px-5 text-right">Gross Earned Pay</th>
                  <th className="py-3.5 px-5 text-right">Advance Ded.</th>
                  <th className="py-3.5 px-5 text-right">Net Payable</th>
                  <th className="py-3.5 px-5 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.map((rec) => (
                  <tr key={rec.employeeId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{rec.name}</div>
                      <div className="text-xs font-mono text-[#1a73e8]">{rec.code}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {rec.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-slate-900">
                      ₹{rec.baseSalary.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-slate-600">
                      ₹{rec.dailyRate.toLocaleString()}/day
                    </td>
                    <td className="py-3.5 px-5 text-center font-mono text-xs">
                      {rec.workedDays}/{rec.totalDaysInMonth}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-emerald-600">
                      ₹{rec.earnedSalary.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-amber-600">
                      {rec.advanceDeduction ? `-₹${rec.advanceDeduction.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-extrabold text-sm text-slate-900">
                      ₹{rec.netPay.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setViewingPayslip(rec)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <FileText size={13} /> View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORMAL PAYSLIP MODAL */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                  Official Salary Slip
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedMonth}</h3>
              </div>
              <button
                onClick={() => setViewingPayslip(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Slip Container */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <div className="font-bold text-base text-slate-900">{viewingPayslip.name}</div>
                  <div className="text-slate-500">
                    {viewingPayslip.designation} • {viewingPayslip.department}
                  </div>
                  <div className="text-[11px] font-mono text-blue-600 mt-0.5">{viewingPayslip.code}</div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-500">
                  <div>Bank: {viewingPayslip.bankAccount}</div>
                  <div>IFSC: {viewingPayslip.ifsc}</div>
                  {viewingPayslip.upiId && <div>UPI: {viewingPayslip.upiId}</div>}
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Monthly Base Salary:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{viewingPayslip.baseSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Calculated Daily Rate ({viewingPayslip.totalDaysInMonth} days/mo):</span>
                  <span className="font-mono font-semibold text-slate-700">
                    ₹{viewingPayslip.dailyRate.toLocaleString()} / day
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Days Worked:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {viewingPayslip.workedDays} / {viewingPayslip.totalDaysInMonth} days
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross Earned Salary:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ₹{viewingPayslip.earnedSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Advance Recovery Auto-Deduction:</span>
                  <span className="font-mono font-bold text-amber-600">
                    -{viewingPayslip.advanceDeduction ? `₹${viewingPayslip.advanceDeduction.toLocaleString()}` : "₹0"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-900">Net Disbursed Pay:</span>
                <span className="text-xl font-extrabold text-emerald-600 font-mono">
                  ₹{viewingPayslip.netPay.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.print();
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Printer size={14} /> Print / Save PDF
              </button>
              <button
                onClick={() => setViewingPayslip(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
