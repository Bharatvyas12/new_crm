"use client";

import React, { useState } from "react";
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  User,
  Clock,
  Package,
  CheckCircle2,
  TrendingUp,
  Award,
  AlertTriangle,
  Printer,
  DollarSign,
  Truck,
  CheckSquare,
} from "lucide-react";

interface EmployeeReportData {
  id: string;
  name: string;
  code: string;
  department: string;
  designation: string;
  attendanceRate: number;
  daysPresent: number;
  totalDays: number;
  workedHours: number;
  overtimeHours: number;
  latePunches: number;
  leavesTaken: number;
  ordersClaimed: number;
  ordersDelivered: number;
  ordersSuccessRate: number;
  avgDeliveryMinutes: number;
  tasksCompleted: number;
  tasksTotal: number;
  totalEarned: number;
  advanceOutstanding: number;
  recentOrders: {
    code: string;
    customer: string;
    items: number;
    claimedAt: string;
    deliveredAt: string;
    status: string;
  }[];
}

const mockEmployeeReports: Record<string, EmployeeReportData> = {
  E001: {
    id: "2",
    name: "Bharat vyas",
    code: "E001",
    department: "Operations",
    designation: "Supervisor",
    attendanceRate: 96.1,
    daysPresent: 25,
    totalDays: 26,
    workedHours: 258,
    overtimeHours: 12,
    latePunches: 1,
    leavesTaken: 1,
    ordersClaimed: 32,
    ordersDelivered: 31,
    ordersSuccessRate: 96.8,
    avgDeliveryMinutes: 42,
    tasksCompleted: 18,
    tasksTotal: 19,
    totalEarned: 37400,
    advanceOutstanding: 6000,
    recentOrders: [
      { code: "ORD-0003", customer: "Sharma Electronics", items: 12, claimedAt: "Sep 28, 05:10 AM", deliveredAt: "Sep 28, 06:15 AM", status: "Delivered" },
      { code: "ORD-0007", customer: "Metro Builders", items: 45, claimedAt: "Sep 27, 10:00 AM", deliveredAt: "Sep 27, 11:20 AM", status: "Delivered" },
      { code: "ORD-0012", customer: "National Hardware", items: 20, claimedAt: "Sep 26, 02:30 PM", deliveredAt: "Sep 26, 03:15 PM", status: "Delivered" },
    ],
  },
  EMP001: {
    id: "4",
    name: "Demo Employee",
    code: "EMP001",
    department: "Delivery",
    designation: "Rider",
    attendanceRate: 92.3,
    daysPresent: 24,
    totalDays: 26,
    workedHours: 248,
    overtimeHours: 18,
    latePunches: 3,
    leavesTaken: 2,
    ordersClaimed: 48,
    ordersDelivered: 47,
    ordersSuccessRate: 97.9,
    avgDeliveryMinutes: 28,
    tasksCompleted: 12,
    tasksTotal: 12,
    totalEarned: 27700,
    advanceOutstanding: 2500,
    recentOrders: [
      { code: "ORD-0002", customer: "Apex Logistics Ltd", items: 70, claimedAt: "Sep 28, 09:15 AM", deliveredAt: "Sep 28, 10:10 AM", status: "Delivered" },
      { code: "ORD-0008", customer: "City Center Mart", items: 15, claimedAt: "Sep 27, 03:00 PM", deliveredAt: "Sep 27, 03:40 PM", status: "Delivered" },
      { code: "ORD-0014", customer: "Vikas Automobiles", items: 8, claimedAt: "Sep 26, 11:00 AM", deliveredAt: "Sep 26, 11:35 AM", status: "Delivered" },
    ],
  },
  EMP002: {
    id: "5",
    name: "Priya Sharma",
    code: "EMP002",
    department: "Sales",
    designation: "Senior Sales Lead",
    attendanceRate: 100,
    daysPresent: 26,
    totalDays: 26,
    workedHours: 260,
    overtimeHours: 6,
    latePunches: 0,
    leavesTaken: 0,
    ordersClaimed: 15,
    ordersDelivered: 15,
    ordersSuccessRate: 100,
    avgDeliveryMinutes: 35,
    tasksCompleted: 22,
    tasksTotal: 22,
    totalEarned: 33100,
    advanceOutstanding: 4000,
    recentOrders: [
      { code: "ORD-0001", customer: "Rahul Enterprises", items: 15, claimedAt: "Sep 28, 09:30 AM", deliveredAt: "Sep 28, 10:25 AM", status: "Delivered" },
      { code: "ORD-0010", customer: "Universal Traders", items: 30, claimedAt: "Sep 27, 01:15 PM", deliveredAt: "Sep 27, 02:00 PM", status: "Delivered" },
    ],
  },
};

export default function ReportsPage() {
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string>("E001");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("September 2026");

  const report = mockEmployeeReports[selectedEmployeeCode] || mockEmployeeReports["E001"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Performance & Periodical Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspect individual employee performance, attendance punctuality, order track record, and financial summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert(`Exporting Performance Dossier for ${report.name} (${selectedPeriod})...`)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download size={15} />
            <span>Export Report Dossier</span>
          </button>
        </div>
      </div>

      {/* Filter Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Employee Selector */}
          <div className="sm:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Employee</label>
            <select
              value={selectedEmployeeCode}
              onChange={(e) => setSelectedEmployeeCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="E001">Bharat vyas (E001 - Operations Supervisor)</option>
              <option value="EMP001">Demo Employee (EMP001 - Delivery Rider)</option>
              <option value="EMP002">Priya Sharma (EMP002 - Senior Sales Lead)</option>
            </select>
          </div>

          {/* Period Selector */}
          <div className="sm:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Evaluation Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="September 2026">September 2026 (Last Closed Month)</option>
              <option value="October 2026">October 2026 (Current Live Period)</option>
              <option value="Quarter 3 (Jul - Sep 2026)">Quarter 3 (Jul - Sep 2026)</option>
              <option value="Full Year 2026">Full Year 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
            {report.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                {report.code}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                {report.department}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{report.name}</h2>
            <p className="text-xs text-slate-500">{report.designation} • Report Period: {selectedPeriod}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Overall Performance Rating
            </span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono flex items-center justify-end gap-1">
              <Award className="w-5 h-5" /> 98.4% Exceptional
            </span>
          </div>
        </div>
      </div>

      {/* 4 Multi-Dimensional Performance KPI Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Attendance & Hours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" /> Attendance Punctuality
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {report.attendanceRate}%
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {report.daysPresent} / {report.totalDays} <span className="text-xs text-slate-400 font-normal">days</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Worked Duration:</span>
              <span className="font-bold text-slate-900">{report.workedHours} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>Overtime Accrued:</span>
              <span className="font-bold text-emerald-600">+{report.overtimeHours} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>Late Check-ins:</span>
              <span className="font-bold text-amber-600">{report.latePunches} days</span>
            </div>
          </div>
        </div>

        {/* 2. Order Dispatch & Delivery Track Record */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" /> Order Fulfillment
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {report.ordersSuccessRate}%
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            {report.ordersDelivered} <span className="text-xs text-slate-400 font-normal">delivered</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Claimed from Pool:</span>
              <span className="font-bold text-slate-900">{report.ordersClaimed} orders</span>
            </div>
            <div className="flex justify-between">
              <span>Avg. Delivery Speed:</span>
              <span className="font-bold text-slate-900">{report.avgDeliveryMinutes} mins</span>
            </div>
            <div className="flex justify-between">
              <span>POD Verified:</span>
              <span className="font-bold text-emerald-600">100% Photos</span>
            </div>
          </div>
        </div>

        {/* 3. Task Execution Velocity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-purple-600" /> Task Execution
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              {Math.round((report.tasksCompleted / report.tasksTotal) * 100)}%
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {report.tasksCompleted} / {report.tasksTotal}
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Tasks Approved:</span>
              <span className="font-bold text-emerald-600">{report.tasksCompleted} tasks</span>
            </div>
            <div className="flex justify-between">
              <span>Revision Required:</span>
              <span className="font-bold text-slate-500">0 tasks</span>
            </div>
            <div className="flex justify-between">
              <span>On-Time Submission:</span>
              <span className="font-bold text-slate-900">100%</span>
            </div>
          </div>
        </div>

        {/* 4. Financial & Advance Ledger */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-600" /> Financial Balance
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Active
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{report.totalEarned.toLocaleString()}
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Total Payout Earned:</span>
              <span className="font-bold text-emerald-600">₹{report.totalEarned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Outstanding Advance:</span>
              <span className="font-bold text-amber-600 font-mono">
                ₹{report.advanceOutstanding.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payroll Deduction:</span>
              <span className="font-bold text-slate-900">Auto-Scheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Order Fulfillment Log Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Past Orders & Delivery Track Record</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Orders claimed, packed, and fulfilled by {report.name} in {selectedPeriod}.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            {report.recentOrders.length} Recent Shipments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Claimed Time</th>
                <th className="py-3 px-4">Delivered Time</th>
                <th className="py-3 px-4 text-center">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {report.recentOrders.map((ord) => (
                <tr key={ord.code} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 text-xs">{ord.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{ord.customer}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{ord.items} items parcel</td>
                  <td className="py-3 px-4 text-xs text-slate-500 font-mono">{ord.claimedAt}</td>
                  <td className="py-3 px-4 text-xs text-slate-500 font-mono">{ord.deliveredAt}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
