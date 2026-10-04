"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Plus,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { getCRMStore, saveCRMStore, disburseAdvanceInStore, subscribeToCRMStore, AdvanceRequest } from "@/lib/store";

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<AdvanceRequest[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const store = getCRMStore();
    setAdvances(store.advances || []);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToCRMStore(loadData);
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDisburse = (adv: AdvanceRequest) => {
    const res = disburseAdvanceInStore(adv.id);
    if (res.success) {
      showToast(res.message);
      loadData();
    }
  };

  const handleReject = (adv: AdvanceRequest) => {
    const store = getCRMStore();
    const target = store.advances.find((a) => a.id === adv.id);
    if (target) {
      target.status = "Rejected";
      saveCRMStore(store);
      loadData();
      showToast(`Advance request for ${adv.employee} rejected.`);
    }
  };

  const pendingCount = advances.filter((a) => a.status === "Pending Approval").length;
  const totalDisbursed = advances
    .filter((a) => a.status === "Disbursed")
    .reduce((acc, curr) => acc + curr.amount, 0);

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Advance Approvals</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Review employee advance applications, authorize disbursements, and track auto-deduction schedules.
          </p>
        </div>
        <Link
          href="/admin/ledger"
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <FileText size={16} />
          <span>View Master Ledger →</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pending Approval Requests
          </span>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-2">{pendingCount} requests</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting disbursement decision</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Disbursed Advances
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
            ₹{totalDisbursed.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active ledger loans</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recovery Mode
          </span>
          <div className="text-sm font-bold text-indigo-700 mt-2">Auto-Deducted in Payroll</div>
          <div className="text-[11px] text-slate-400 mt-1">Directly deducted on monthly pay day</div>
        </div>
      </div>

      {/* Advances Queue List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Advance Applications Queue ({advances.length})
        </h2>

        {advances.map((adv) => (
          <div
            key={adv.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-slate-900 text-base">{adv.employee}</span>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {adv.code}
                </span>
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {adv.department}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    adv.status === "Disbursed"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : adv.status === "Pending Approval"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {adv.status}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                <strong>Reason:</strong> <em>"{adv.reason}"</em> • Repayment: <span className="font-semibold text-slate-800">{adv.mode}</span>
              </p>

              <div className="text-[11px] text-slate-400 font-mono">
                Requested on {adv.requestedAt} {adv.disbursedAt && `• Disbursed on ${adv.disbursedAt}`}
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="text-left md:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Requested Amount
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono block">
                  ₹{adv.amount.toLocaleString()}
                </span>
              </div>

              {adv.status === "Pending Approval" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDisburse(adv)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Disburse Funds
                  </button>
                  <button
                    onClick={() => handleReject(adv)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              ) : adv.status === "Disbursed" ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Disbursed & Active in Ledger
                </span>
              ) : (
                <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                  Request Rejected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
