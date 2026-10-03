"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Filter,
  Search,
  Plus,
  X,
  Check,
  Building,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { getCRMStore, saveCRMStore, updateLeaveStatusInStore, LeaveRequest } from "@/lib/store";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Leave Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  const [newLeave, setNewLeave] = useState({
    employeeName: "Bharat vyas",
    employeeCode: "E001",
    department: "Operations",
    leaveType: "Casual Leave" as LeaveRequest["leaveType"],
    startDate: "",
    endDate: "",
    period: "FULL_DAY" as LeaveRequest["period"],
    days: "1",
    reason: "",
  });

  const loadData = () => {
    const store = getCRMStore();
    setLeaves(store.leaves || []);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("wcrm_store_updated", loadData);
    return () => window.removeEventListener("wcrm_store_updated", loadData);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (leave: LeaveRequest) => {
    updateLeaveStatusInStore(leave.id, "APPROVED");
    loadData();
    if (selectedLeave?.id === leave.id) {
      setSelectedLeave({ ...selectedLeave, status: "APPROVED" });
    }
    showToast(`✓ Leave application for ${leave.employeeName} (${leave.days} days) APPROVED!`);
  };

  const handleReject = (leave: LeaveRequest) => {
    updateLeaveStatusInStore(leave.id, "REJECTED");
    loadData();
    if (selectedLeave?.id === leave.id) {
      setSelectedLeave({ ...selectedLeave, status: "REJECTED" });
    }
    showToast(`Leave application for ${leave.employeeName} REJECTED.`);
  };

  const handleApplyOnBehalf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.startDate || !newLeave.reason) {
      alert("Please fill start date and reason");
      return;
    }

    const item: LeaveRequest = {
      id: `lv-${Date.now()}`,
      employeeName: newLeave.employeeName,
      employeeCode: newLeave.employeeCode,
      department: newLeave.department,
      leaveType: newLeave.leaveType,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate || newLeave.startDate,
      period: newLeave.period,
      days: Number(newLeave.days) || 1,
      reason: newLeave.reason,
      status: "APPROVED",
      appliedAt: "Just now (Admin)",
      balanceRemaining: 7,
      totalEntitlement: 12,
    };

    const store = getCRMStore();
    store.leaves = [item, ...store.leaves];
    saveCRMStore(store);

    setShowApplyModal(false);
    showToast(`✓ Leave recorded and approved for ${item.employeeName}!`);
  };

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
    if (deptFilter !== "ALL" && l.department.toLowerCase() !== deptFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        l.employeeName.toLowerCase().includes(q) ||
        l.employeeCode.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" /> Rejected
          </span>
        );
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Approvals & Queue</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Review employee leave applications, monitor remaining balances, and grant formal approvals.
          </p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Record Leave for Staff</span>
        </button>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: "All Requests", value: "ALL", count: leaves.length },
          { label: "Pending Review", value: "PENDING", count: leaves.filter((l) => l.status === "PENDING").length },
          { label: "Approved", value: "APPROVED", count: leaves.filter((l) => l.status === "APPROVED").length },
          { label: "Rejected", value: "REJECTED", count: leaves.filter((l) => l.status === "REJECTED").length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.value
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search & Department Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Department */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="ALL">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>

          {/* Search */}
          <div className="sm:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search employee name, code, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Clear */}
          <div className="sm:col-span-2">
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setDeptFilter("ALL");
                setSearchQuery("");
              }}
              className="w-full px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Crisp Professional Bordered Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5 border-r border-slate-100">Employee</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Department</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Leave Type</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Dates / Period</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Reason</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Remaining Quota</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Status</th>
                <th className="py-3.5 px-5 text-right">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLeaves.map((leave) => (
                <tr
                  key={leave.id}
                  className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  onClick={() => setSelectedLeave(leave)}
                >
                  {/* Employee */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {leave.employeeName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{leave.employeeName}</div>
                        <div className="text-xs font-mono text-[#1a73e8]">{leave.employeeCode}</div>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {leave.department}
                    </span>
                  </td>

                  {/* Leave Type */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                      {leave.leaveType}
                    </span>
                  </td>

                  {/* Dates & Period */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <div className="font-semibold text-slate-800 text-xs font-mono">
                      {leave.startDate} {leave.endDate !== leave.startDate ? `➔ ${leave.endDate}` : ""}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {leave.days} {leave.days === 1 ? "day" : "days"} ({leave.period.replace("_", " ")})
                    </div>
                  </td>

                  {/* Reason */}
                  <td className="py-3.5 px-5 border-r border-slate-100 text-xs text-slate-600 max-w-xs leading-relaxed">
                    "{leave.reason}"
                  </td>

                  {/* Balance */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <div className="text-xs font-bold text-emerald-700 font-mono">
                      {leave.balanceRemaining} / {leave.totalEntitlement} days left
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-5 border-r border-slate-100 whitespace-nowrap">
                    {getStatusBadge(leave.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {leave.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(leave)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(leave)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Decision Recorded</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No leave requests match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD LEAVE MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Leave for Employee</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyOnBehalf} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Employee *</label>
                <select
                  value={newLeave.employeeName}
                  onChange={(e) => {
                    const empName = e.target.value;
                    let code = "E001";
                    let dept = "Operations";
                    if (empName === "Priya Sharma") {
                      code = "EMP002";
                      dept = "Sales";
                    }
                    setNewLeave({
                      ...newLeave,
                      employeeName: empName,
                      employeeCode: code,
                      department: dept,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-semibold"
                >
                  <option value="Bharat vyas">Bharat vyas (E001 - Operations)</option>
                  <option value="Priya Sharma">Priya Sharma (EMP002 - Sales)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Leave Type</label>
                  <select
                    value={newLeave.leaveType}
                    onChange={(e) =>
                      setNewLeave({ ...newLeave, leaveType: e.target.value as LeaveRequest["leaveType"] })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-medium"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Period</label>
                  <select
                    value={newLeave.period}
                    onChange={(e) =>
                      setNewLeave({ ...newLeave, period: e.target.value as LeaveRequest["period"] })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-medium"
                  >
                    <option value="FULL_DAY">Full Day</option>
                    <option value="FIRST_HALF">First Half (0.5)</option>
                    <option value="SECOND_HALF">Second Half (0.5)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reason / Notes *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Reason for leave..."
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAVE DETAILS MODAL */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {selectedLeave.employeeCode}
                  </span>
                  {getStatusBadge(selectedLeave.status)}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedLeave.employeeName}</h3>
                <p className="text-xs text-slate-500">{selectedLeave.department} Department</p>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Leave Type:</span>
                  <span className="font-bold text-slate-900">{selectedLeave.leaveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Date Range:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {selectedLeave.startDate} ➔ {selectedLeave.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Duration:</span>
                  <span className="font-bold text-slate-900">
                    {selectedLeave.days} Days ({selectedLeave.period})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Remaining Quota:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {selectedLeave.balanceRemaining} of {selectedLeave.totalEntitlement} Days
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-700">Reason for Request:</span>
                <p className="text-slate-600 italic leading-relaxed">{selectedLeave.reason}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {selectedLeave.status === "PENDING" ? (
                  <div className="flex items-center gap-2 w-full justify-end">
                    <button
                      onClick={() => handleReject(selectedLeave)}
                      className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold cursor-pointer"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleApprove(selectedLeave)}
                      className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold cursor-pointer"
                    >
                      Approve Request
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedLeave(null)}
                    className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
