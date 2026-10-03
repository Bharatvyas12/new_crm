"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface EmployeeSalaryRecord {
  employeeId: string;
  name: string;
  code: string;
  department: string;
  designation: string;
  baseSalary: number;
  workedDays: number;
  totalDaysInMonth: number;
  overtimeHours: number;
  overtimePay: number;
  unpaidLeaveDays: number;
  leaveDeductions: number;
  advanceDeduction: number;
  netPay: number;
  bankAccount: string;
  ifsc: string;
  status: "CALCULATED" | "APPROVED" | "PAID";
}

const defaultSalaryRecords: EmployeeSalaryRecord[] = [
  {
    employeeId: "1",
    name: "Bharat vyas",
    code: "E001",
    department: "Operations",
    designation: "Supervisor",
    baseSalary: 35000,
    workedDays: 26,
    totalDaysInMonth: 26,
    overtimeHours: 12,
    overtimePay: 2400,
    unpaidLeaveDays: 0,
    leaveDeductions: 0,
    advanceDeduction: 2000,
    netPay: 35400,
    bankAccount: "112233445566",
    ifsc: "SBIN0004321",
    status: "PAID",
  },
  {
    employeeId: "2",
    name: "Demo Employee",
    code: "EMP001",
    department: "Delivery",
    designation: "Rider",
    baseSalary: 25000,
    workedDays: 25,
    totalDaysInMonth: 26,
    overtimeHours: 18,
    overtimePay: 2700,
    unpaidLeaveDays: 1,
    leaveDeductions: 961,
    advanceDeduction: 2500,
    netPay: 24239,
    bankAccount: "556677889900",
    ifsc: "PUNB0005566",
    status: "PAID",
  },
  {
    employeeId: "3",
    name: "Priya Sharma",
    code: "EMP002",
    department: "Sales",
    designation: "Senior Sales Lead",
    baseSalary: 32000,
    workedDays: 26,
    totalDaysInMonth: 26,
    overtimeHours: 6,
    overtimePay: 1100,
    unpaidLeaveDays: 0,
    leaveDeductions: 0,
    advanceDeduction: 1000,
    netPay: 32100,
    bankAccount: "998877665544",
    ifsc: "HDFC0001234",
    status: "PAID",
  },
  {
    employeeId: "4",
    name: "Rahul Sharma",
    code: "EMP512",
    department: "Sales",
    designation: "Sales Executive",
    baseSalary: 28000,
    workedDays: 24,
    totalDaysInMonth: 26,
    overtimeHours: 4,
    overtimePay: 650,
    unpaidLeaveDays: 2,
    leaveDeductions: 2154,
    advanceDeduction: 0,
    netPay: 26496,
    bankAccount: "332211445566",
    ifsc: "ICIC0003344",
    status: "PAID",
  },
  {
    employeeId: "5",
    name: "Suresh Jain",
    code: "EMPB87",
    department: "Accounts",
    designation: "Senior Accountant",
    baseSalary: 42000,
    workedDays: 26,
    totalDaysInMonth: 26,
    overtimeHours: 0,
    overtimePay: 0,
    unpaidLeaveDays: 0,
    leaveDeductions: 0,
    advanceDeduction: 0,
    netPay: 42000,
    bankAccount: "778899001122",
    ifsc: "AXIS0009988",
    status: "PAID",
  },
];

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState("September 2026");
  const [records, setRecords] = useState<EmployeeSalaryRecord[]>(defaultSalaryRecords);
  const [payrollStatus, setPayrollStatus] = useState<"DRAFT" | "APPROVED" | "PAID">("PAID");
  const [viewingPayslip, setViewingPayslip] = useState<EmployeeSalaryRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunNewPayroll = () => {
    setSelectedMonth("October 2026 (Live Current Run)");
    setPayrollStatus("DRAFT");
    const updated = records.map((r) => ({
      ...r,
      status: "CALCULATED" as const,
    }));
    setRecords(updated);
    showToast("October 2026 Payroll calculated based on live attendance & advance deductions!");
  };

  const handleApprovePayroll = () => {
    setPayrollStatus("APPROVED");
    const updated = records.map((r) => ({
      ...r,
      status: "APPROVED" as const,
    }));
    setRecords(updated);
    showToast("Payroll approved! Ready for payout disbursement.");
  };

  const handleDisbursePayroll = () => {
    setPayrollStatus("PAID");
    const updated = records.map((r) => ({
      ...r,
      status: "PAID" as const,
    }));
    setRecords(updated);
    showToast("Salaries disbursed & recorded in Double-Entry Financial Ledger!");
  };

  // KPIs
  const grossTotal = records.reduce((acc, curr) => acc + curr.baseSalary + curr.overtimePay, 0);
  const totalDeductions = records.reduce(
    (acc, curr) => acc + curr.leaveDeductions + curr.advanceDeduction,
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
          <p className="text-sm text-slate-500 mt-0.5">
            Automated net salary computation based on worked hours, overtime, unpaid leave deductions, and advances.
          </p>
        </div>
        <button
          onClick={handleRunNewPayroll}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          <span>+ Process Current Month Payroll</span>
        </button>
      </div>

      {/* Explanation Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">How the Payroll Engine Works:</span>
          <p className="text-blue-800 leading-relaxed">
            <code>Net Payable = Base Salary + Overtime Pay - Unpaid Leave Loss - Advance Repayments</code>.
            Once finalized and marked as paid, transactions are auto-posted to the master Double-Entry Financial Ledger.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Selected Period
          </span>
          <div className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            {selectedMonth}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{records.length} Staff Members</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Gross Base & Overtime
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
            ₹{grossTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Earnings before deduction</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Recovered Deductions
          </span>
          <div className="text-2xl font-bold text-red-600 font-mono mt-2">
            -₹{totalDeductions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Advances + Unpaid leaves</div>
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
              💸 Mark as Paid & Disburse
            </button>
          )}

          <button
            onClick={() => showToast("Exporting Excel Payroll Sheet... Download started.")}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Salary Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5 text-right">Base Salary</th>
                <th className="py-3.5 px-5 text-center">Days Worked</th>
                <th className="py-3.5 px-5 text-right">Overtime Pay</th>
                <th className="py-3.5 px-5 text-right">Leave Loss</th>
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
                  <td className="py-3.5 px-5 text-center font-mono text-xs">
                    {rec.workedDays}/{rec.totalDaysInMonth}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-emerald-600">
                    +{rec.overtimePay ? `₹${rec.overtimePay.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-red-600">
                    {rec.leaveDeductions ? `-₹${rec.leaveDeductions.toLocaleString()}` : "—"}
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
                  <span>Overtime Pay ({viewingPayslip.overtimeHours} hrs):</span>
                  <span className="font-mono font-bold text-emerald-600">
                    +₹{viewingPayslip.overtimePay.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Unpaid Leave Deductions ({viewingPayslip.unpaidLeaveDays} days):</span>
                  <span className="font-mono font-bold text-red-600">
                    -₹{viewingPayslip.leaveDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Advance Recovery Auto-Deduction:</span>
                  <span className="font-mono font-bold text-amber-600">
                    -₹{viewingPayslip.advanceDeduction.toLocaleString()}
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
                onClick={() => alert("Printing formal PDF payslip...")}
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
