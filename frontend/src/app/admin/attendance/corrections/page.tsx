"use client";

import React, { useState, useEffect } from "react";
import { ListTodo, CheckCircle2, XCircle, Clock, User, Check, X, AlertCircle } from "lucide-react";
import { getCRMStore, updateCorrectionStatusInStore, CorrectionItem } from "@/lib/store";

export default function CorrectionsPage() {
  const [corrections, setCorrections] = useState<CorrectionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const store = getCRMStore();
    setCorrections(store.corrections || []);
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

  const handleAction = (id: string, newStatus: "Approved" | "Rejected") => {
    const success = updateCorrectionStatusInStore(id, newStatus);
    if (success) {
      loadData();
      showToast(`✓ Attendance correction request ${newStatus.toUpperCase()} and permanently saved!`);
    }
  };

  const filteredCorrections = corrections.filter((c) => {
    if (statusFilter !== "ALL" && c.status.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: CorrectionItem["status"]) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Review
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved & Recomputed
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Corrections Queue</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Review, approve or reject employee timestamp fixes. Approved requests recompute work hours automatically.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: "All Requests", value: "ALL", count: corrections.length },
          { label: "Pending", value: "PENDING", count: corrections.filter((c) => c.status === "Pending").length },
          { label: "Approved", value: "APPROVED", count: corrections.filter((c) => c.status === "Approved").length },
          { label: "Rejected", value: "REJECTED", count: corrections.filter((c) => c.status === "Rejected").length },
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

      {/* Professional Tabular Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5 border-r border-slate-100">Employee</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Date of Shift</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Original Record</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Requested Timestamp</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Reason for Request</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Status</th>
                <th className="py-3.5 px-5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCorrections.map((corr) => (
                <tr key={corr.id} className="hover:bg-blue-50/30 transition-colors">
                  {/* Employee */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <div className="font-bold text-slate-900">{corr.employee}</div>
                    <div className="text-xs font-mono text-blue-600 mt-0.5">
                      {corr.code} • {corr.department}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-5 border-r border-slate-100 text-xs font-semibold text-slate-700 font-mono">
                    {corr.date}
                  </td>

                  {/* Original */}
                  <td className="py-3.5 px-5 border-r border-slate-100 text-xs text-slate-500 font-mono">
                    {corr.originalTime}
                  </td>

                  {/* Requested */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {corr.requestedTime}
                    </span>
                  </td>

                  {/* Reason */}
                  <td className="py-3.5 px-5 border-r border-slate-100 text-xs text-slate-600 max-w-xs leading-relaxed">
                    "{corr.reason}"
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-5 border-r border-slate-100 whitespace-nowrap">
                    {getStatusBadge(corr.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    {corr.status === "Pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(corr.id, "Approved")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(corr.id, "Rejected")}
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
              {filteredCorrections.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ListTodo className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No attendance corrections match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
