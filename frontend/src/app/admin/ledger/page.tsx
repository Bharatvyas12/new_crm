"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  Filter,
  CreditCard,
  User,
  Calendar,
  CheckCircle2,
  DollarSign,
  X,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { getCRMStore, saveCRMStore, LedgerEntry } from "@/lib/store";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [employeeFilter, setEmployeeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Ledger Entry Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    employeeName: "Bharat vyas",
    employeeCode: "E001",
    type: "ADVANCE_DISBURSEMENT" as LedgerEntry["type"],
    amount: "",
    paymentMode: "Cash" as LedgerEntry["paymentMode"],
    referenceNo: "",
    description: "",
  });

  const loadData = () => {
    const store = getCRMStore();
    setEntries(store.ledger || []);
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

  const handlePostEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.amount || Number(newEntry.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!newEntry.description.trim()) {
      alert("Please enter description or reason");
      return;
    }

    const amt = Number(newEntry.amount);
    const isCredit =
      newEntry.type === "SALARY_CREDIT" ||
      newEntry.type === "BONUS_INCENTIVE" ||
      newEntry.type === "ADVANCE_REPAYMENT" ||
      newEntry.type === "EXPENSE_REIMBURSEMENT";

    const lastEmployeeEntry = entries.find((en) => en.employeeCode === newEntry.employeeCode);
    const previousBalance = lastEmployeeEntry ? lastEmployeeEntry.runningBalance : 25000;
    const newBalance = isCredit ? previousBalance + amt : previousBalance - amt;

    const entry: LedgerEntry = {
      id: `led-${Date.now()}`,
      employeeName: newEntry.employeeName,
      employeeCode: newEntry.employeeCode,
      type: newEntry.type,
      amount: amt,
      paymentMode: newEntry.paymentMode,
      referenceNo: newEntry.referenceNo.trim() || `TXN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      description: newEntry.description.trim(),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      runningBalance: newBalance,
    };

    const store = getCRMStore();
    store.ledger = [entry, ...store.ledger];
    saveCRMStore(store);

    setShowPostModal(false);
    showToast(`Ledger entry posted: ₹${amt.toLocaleString()} (${entry.type}) for ${entry.employeeName}!`);

    setNewEntry({
      employeeName: "Bharat vyas",
      employeeCode: "E001",
      type: "ADVANCE_DISBURSEMENT",
      amount: "",
      paymentMode: "Cash",
      referenceNo: "",
      description: "",
    });
  };

  // KPIs
  const totalAdvances = entries
    .filter((e) => e.type === "ADVANCE_DISBURSEMENT")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRepayments = entries
    .filter((e) => e.type === "ADVANCE_REPAYMENT")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netOutstandingAdvances = totalAdvances - totalRepayments;

  const totalSalariesPaid = entries
    .filter((e) => e.type === "SALARY_CREDIT")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBonuses = entries
    .filter((e) => e.type === "BONUS_INCENTIVE")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredEntries = entries.filter((e) => {
    if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
    if (employeeFilter !== "ALL" && e.employeeCode !== employeeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        e.employeeName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.referenceNo && e.referenceNo.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getEntryBadge = (type: LedgerEntry["type"]) => {
    switch (type) {
      case "ADVANCE_DISBURSEMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <ArrowDownLeft className="w-3 h-3 text-amber-600" /> Advance Given
          </span>
        );
      case "ADVANCE_REPAYMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <ArrowUpRight className="w-3 h-3 text-blue-600" /> Advance Repaid
          </span>
        );
      case "SALARY_CREDIT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <DollarSign className="w-3 h-3 text-emerald-600" /> Salary Payout
          </span>
        );
      case "BONUS_INCENTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <TrendingUp className="w-3 h-3 text-purple-600" /> Bonus / Incentive
          </span>
        );
      case "DEDUCTION_PENALTY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
            <TrendingDown className="w-3 h-3 text-red-600" /> Deduction / Fine
          </span>
        );
      case "EXPENSE_REIMBURSEMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Wallet className="w-3 h-3 text-teal-600" /> Reimbursement
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Double-Entry Financial Ledger</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Post and track employee advances, repayments, incentive bonuses, and salary credits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/ledger/advances"
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <span>Review Pending Advances →</span>
          </Link>
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={18} />
            <span>+ Post Ledger Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Outstanding Advances
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold">
              ₹
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-2">
            ₹{netOutstandingAdvances.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending recovery from staff</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Salaries Paid
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-2">
            ₹{totalSalariesPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total payroll disbursed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Incentives & Bonuses
            </span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-600 font-mono mt-2">
            ₹{totalBonuses.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Performance rewards credited</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Ledger Entries
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">{entries.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Immutable double-entry records</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Employee Filter */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Filter Employee</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="ALL">All Staff Members</option>
              <option value="E001">Bharat vyas (E001)</option>
              <option value="EMP001">Demo Employee (EMP001)</option>
              <option value="EMP002">Priya Sharma (EMP002)</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Entry Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="ADVANCE_DISBURSEMENT">Advance Given</option>
              <option value="ADVANCE_REPAYMENT">Advance Repaid</option>
              <option value="SALARY_CREDIT">Salary Payout</option>
              <option value="BONUS_INCENTIVE">Bonus / Incentive</option>
              <option value="DEDUCTION_PENALTY">Deduction / Fine</option>
            </select>
          </div>

          {/* Search */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search description, reference no..."
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
                setTypeFilter("ALL");
                setEmployeeFilter("ALL");
                setSearchQuery("");
              }}
              className="w-full px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Double-Entry Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Date & Time</th>
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-5">Transaction Type</th>
                <th className="py-3.5 px-5">Mode & Ref</th>
                <th className="py-3.5 px-5">Description</th>
                <th className="py-3.5 px-5 text-right">Amount</th>
                <th className="py-3.5 px-5 text-right">Running Balance</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEntries.map((e) => {
                const isDebit = e.type === "ADVANCE_DISBURSEMENT" || e.type === "DEDUCTION_PENALTY";
                return (
                  <tr key={e.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{e.employeeName}</div>
                      <div className="text-xs font-mono text-[#1a73e8]">{e.employeeCode}</div>
                    </td>
                    <td className="py-3.5 px-5">{getEntryBadge(e.type)}</td>
                    <td className="py-3.5 px-5">
                      <div className="text-xs font-semibold text-slate-800">{e.paymentMode}</div>
                      <div className="text-[10px] font-mono text-slate-400">{e.referenceNo || "—"}</div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 max-w-xs">{e.description}</td>
                    <td
                      className={`py-3.5 px-5 text-right font-mono font-bold text-sm ${
                        isDebit ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {isDebit ? "-" : "+"}₹{e.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{e.runningBalance.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Posted
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No financial ledger entries match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POST NEW ENTRY MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Post Financial Ledger Entry</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Record cash advance, repayment, bonus or salary transaction.
                </p>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostEntry} className="space-y-4 pt-4">
              {/* Employee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Employee *</label>
                <select
                  value={newEntry.employeeName}
                  onChange={(e) => {
                    const empName = e.target.value;
                    let code = "E001";
                    if (empName === "Demo Employee") code = "EMP001";
                    else if (empName === "Priya Sharma") code = "EMP002";
                    else if (empName === "Rahul Sharma") code = "EMP512";
                    setNewEntry({ ...newEntry, employeeName: empName, employeeCode: code });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-bold"
                >
                  <option value="Bharat vyas">Bharat vyas (E001 - Operations)</option>
                  <option value="Demo Employee">Demo Employee (EMP001 - Delivery)</option>
                  <option value="Priya Sharma">Priya Sharma (EMP002 - Sales)</option>
                  <option value="Rahul Sharma">Rahul Sharma (EMP512 - Sales)</option>
                </select>
              </div>

              {/* Transaction Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Transaction Type *</label>
                <select
                  value={newEntry.type}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, type: e.target.value as LedgerEntry["type"] })
                  }
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:bg-white"
                >
                  <option value="ADVANCE_DISBURSEMENT">Advance Disbursement (Cash given to staff)</option>
                  <option value="ADVANCE_REPAYMENT">Advance Repayment (Staff repaid advance)</option>
                  <option value="BONUS_INCENTIVE">Bonus / Performance Incentive</option>
                  <option value="SALARY_CREDIT">Monthly Salary Disbursement</option>
                  <option value="DEDUCTION_PENALTY">Deduction / Fine / Penalty</option>
                  <option value="EXPENSE_REIMBURSEMENT">Expense Reimbursement (Fuel / Travel)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 5000"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:bg-white"
                  />
                </div>

                {/* Payment Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Payment Mode</label>
                  <select
                    value={newEntry.paymentMode}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        paymentMode: e.target.value as LedgerEntry["paymentMode"],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-medium"
                  >
                    <option value="Cash">Cash Voucher</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Salary Deduction">Salary Deduction</option>
                  </select>
                </div>
              </div>

              {/* Reference / Voucher No */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reference / Voucher No</label>
                <input
                  type="text"
                  placeholder="e.g. VOUCHER-104, UTR-881239"
                  value={newEntry.referenceNo}
                  onChange={(e) => setNewEntry({ ...newEntry, referenceNo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Description / Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Reason for advance, bonus milestone, or invoice description..."
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Post Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
