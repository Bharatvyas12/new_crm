"use client";

import React, { useState, useEffect } from "react";
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
  Users,
} from "lucide-react";
import { getCRMStore, subscribeToCRMStore, CRMStoreData, EmployeeItem } from "@/lib/store";

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

function computeEmployeeReport(emp: EmployeeItem, store: CRMStoreData): EmployeeReportData {
  const empCode = (emp.code || "").trim().toUpperCase();
  const empName = (emp.name || "").trim().toLowerCase();

  // 1. Attendance & Hours
  const empAttendance = (store.attendance || []).filter(
    (a) => a.employeeCode?.trim().toUpperCase() === empCode
  );
  const daysPresent = empAttendance.filter(
    (a) => a.status === "Present" || a.status === "Late"
  ).length;
  const totalDays = 26;
  const attendanceRate = totalDays > 0 ? Math.min(100, Math.round((daysPresent / totalDays) * 100)) : 0;
  const workedHours = empAttendance.reduce((sum, a) => sum + (Number(a.workedHours) || 0), 0);
  const overtimeHours = empAttendance.reduce((sum, a) => sum + (Number(a.overtimeHours) || 0), 0);
  const latePunches = empAttendance.filter((a) => a.status === "Late").length;

  const empLeaves = (store.leaves || []).filter(
    (l) => l.employeeCode?.trim().toUpperCase() === empCode && l.status === "APPROVED"
  );
  const leavesTaken = empLeaves.reduce((sum, l) => sum + (Number(l.days) || 0), 0);

  // 2. Orders Fulfillment
  const empOrders = (store.orders || []).filter(
    (o) =>
      (o.claimedBy && o.claimedBy.toLowerCase().trim() === empName) ||
      (o.claimedBy && o.claimedBy.toUpperCase().trim() === empCode)
  );
  const ordersClaimed = empOrders.length;
  const ordersDelivered = empOrders.filter((o) => o.status === "Delivered").length;
  const ordersSuccessRate = ordersClaimed > 0 ? Math.round((ordersDelivered / ordersClaimed) * 100) : 100;
  const avgDeliveryMinutes = ordersDelivered > 0 ? 35 : 0;

  const recentOrders = empOrders.slice(0, 5).map((o) => ({
    code: o.orderCode,
    customer: o.customerName,
    items: o.itemsCount || 1,
    claimedAt: o.claimedAt || "—",
    deliveredAt: o.deliveredAt || "—",
    status: o.status,
  }));

  // 3. Tasks Execution
  const empTasks = (store.tasks || []).filter(
    (t) =>
      (t.assigneeCode && t.assigneeCode.toUpperCase().trim() === empCode) ||
      (t.assignee && t.assignee.toLowerCase().trim() === empName)
  );
  const tasksTotal = empTasks.length;
  const tasksCompleted = empTasks.filter((t) => t.status === "Completed").length;

  // 4. Financials & Advances
  const baseSalary = Number(emp.baseSalary) || 0;
  const dailyRate = totalDays > 0 ? Math.round(baseSalary / totalDays) : 0;
  const hourlyRate = Math.round(dailyRate / 9);
  const overtimePay = Math.round(overtimeHours * (hourlyRate * 1.5));
  const totalEarned = daysPresent > 0 ? Math.round((daysPresent * dailyRate) + overtimePay) : 0;

  const empAdvances = (store.advances || []).filter(
    (adv) =>
      ((adv.code || adv.employeeId || "").trim().toUpperCase() === empCode) &&
      adv.status === "Disbursed"
  );
  const advanceOutstanding = empAdvances.reduce((sum, a) => sum + (Number(a.outstanding ?? a.amount) || 0), 0);

  return {
    id: emp.id,
    name: emp.name,
    code: emp.code,
    department: emp.department || "Operations",
    designation: emp.designation || "Staff",
    attendanceRate,
    daysPresent,
    totalDays,
    workedHours,
    overtimeHours,
    latePunches,
    leavesTaken,
    ordersClaimed,
    ordersDelivered,
    ordersSuccessRate,
    avgDeliveryMinutes,
    tasksCompleted,
    tasksTotal,
    totalEarned,
    advanceOutstanding,
    recentOrders,
  };
}

export default function ReportsPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Current Live Cycle");
  const [currentReport, setCurrentReport] = useState<EmployeeReportData | null>(null);

  const loadData = () => {
    const store = getCRMStore();
    const staff = (store.employees || []).filter(
      (e) => !e.code.includes("ADMIN") && e.department !== "Management"
    );
    setEmployees(staff);

    const activeCode = selectedEmployeeCode || staff[0]?.code || "";
    setSelectedEmployeeCode(activeCode);

    const targetEmp = staff.find((e) => e.code === activeCode) || staff[0];
    if (targetEmp) {
      setCurrentReport(computeEmployeeReport(targetEmp, store));
    } else {
      setCurrentReport(null);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToCRMStore(loadData);
    return () => unsubscribe();
  }, [selectedEmployeeCode]);

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
            onClick={() => {
              if (currentReport) {
                alert(`Exporting Performance Dossier for ${currentReport.name} (${selectedPeriod})...`);
              } else {
                alert("No employee dossier selected.");
              }
            }}
            disabled={!currentReport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a73e8] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download size={15} />
            <span>Export Report Dossier</span>
          </button>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">No Operational Staff Records</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add team members in the Employees Directory to generate real-time performance and financial analytics.
          </p>
        </div>
      ) : (
        <>
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
                  {employees.map((emp) => (
                    <option key={emp.code} value={emp.code}>
                      {emp.name} ({emp.code} - {emp.department})
                    </option>
                  ))}
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
                  <option value="Current Live Cycle">Current Live Cycle (Real-Time)</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Year to Date">Year to Date</option>
                </select>
              </div>
            </div>
          </div>

          {currentReport && (
            <>
              {/* Employee Profile Header Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
                    {currentReport.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                        {currentReport.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {currentReport.department}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{currentReport.name}</h2>
                    <p className="text-xs text-slate-500">{currentReport.designation} • Report Period: {selectedPeriod}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Attendance Reliability
                    </span>
                    <span className="text-xl font-extrabold text-emerald-600 font-mono flex items-center justify-end gap-1">
                      <Award className="w-5 h-5" /> {currentReport.attendanceRate}%
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
                      {currentReport.attendanceRate}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">
                    {currentReport.daysPresent} / {currentReport.totalDays} <span className="text-xs text-slate-400 font-normal">days</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Worked Duration:</span>
                      <span className="font-bold text-slate-900">{currentReport.workedHours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Accrued:</span>
                      <span className="font-bold text-emerald-600">+{currentReport.overtimeHours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late Check-ins:</span>
                      <span className="font-bold text-amber-600">{currentReport.latePunches} days</span>
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
                      {currentReport.ordersSuccessRate}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                    {currentReport.ordersDelivered} <span className="text-xs text-slate-400 font-normal">delivered</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Claimed Orders:</span>
                      <span className="font-bold text-slate-900">{currentReport.ordersClaimed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivered Orders:</span>
                      <span className="font-bold text-slate-900">{currentReport.ordersDelivered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-bold text-emerald-600">{currentReport.ordersSuccessRate}%</span>
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
                      {currentReport.tasksTotal > 0 ? Math.round((currentReport.tasksCompleted / currentReport.tasksTotal) * 100) : 0}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">
                    {currentReport.tasksCompleted} / {currentReport.tasksTotal}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Tasks Completed:</span>
                      <span className="font-bold text-emerald-600">{currentReport.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Tasks:</span>
                      <span className="font-bold text-slate-900">{currentReport.tasksTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate:</span>
                      <span className="font-bold text-purple-600">
                        {currentReport.tasksTotal > 0 ? Math.round((currentReport.tasksCompleted / currentReport.tasksTotal) * 100) : 0}%
                      </span>
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
                      Live
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">
                    ₹{currentReport.totalEarned.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Estimated Payout:</span>
                      <span className="font-bold text-emerald-600">₹{currentReport.totalEarned.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding Advance:</span>
                      <span className="font-bold text-amber-600 font-mono">
                        ₹{currentReport.advanceOutstanding.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved Leaves:</span>
                      <span className="font-bold text-slate-900">{currentReport.leavesTaken} days</span>
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
                      Orders claimed, packed, and fulfilled by {currentReport.name} in {selectedPeriod}.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                    {currentReport.recentOrders.length} Shipments
                  </span>
                </div>

                {currentReport.recentOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">No orders dispatched or claimed yet by {currentReport.name}.</p>
                  </div>
                ) : (
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
                        {currentReport.recentOrders.map((ord) => (
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
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
