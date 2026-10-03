"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Globe,
  Plus,
  Send,
  X,
  Check,
  User,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getCRMStore, addComplaintCommentInStore, ComplaintItem } from "@/lib/store";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newStatus, setNewStatus] = useState<ComplaintItem["status"]>("UNDER_INVESTIGATION");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const store = getCRMStore();
    setComplaints(store.complaints || []);
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

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!replyText.trim()) {
      alert("Please write a response remark");
      return;
    }

    addComplaintCommentInStore(
      selectedComplaint.id,
      "System Administrator",
      "ADMIN",
      replyText.trim(),
      newStatus
    );

    const store = getCRMStore();
    const updated = store.complaints.find((c) => c.id === selectedComplaint.id);
    if (updated) setSelectedComplaint(updated);

    loadData();
    setReplyText("");
    showToast(`✓ Response posted and status updated to "${newStatus}"!`);
  };

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.subject.toLowerCase().includes(q) ||
        c.raisedBy.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: ComplaintItem["status"]) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Open
          </span>
        );
      case "UNDER_INVESTIGATION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Investigating
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Rejected
          </span>
        );
    }
  };

  const getPriorityBadge = (p: ComplaintItem["priority"]) => {
    switch (p) {
      case "URGENT":
        return "bg-red-100 text-red-800 font-extrabold";
      case "HIGH":
        return "bg-amber-100 text-amber-800 font-bold";
      default:
        return "bg-slate-100 text-slate-700 font-medium";
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workplace Helpdesk & Grievances</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Review staff incident reports, equipment issues, safety concerns, and track resolution timelines.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: "All Tickets", value: "ALL", count: complaints.length },
          { label: "Open Issues", value: "OPEN", count: complaints.filter((c) => c.status === "OPEN").length },
          { label: "Under Investigation", value: "UNDER_INVESTIGATION", count: complaints.filter((c) => c.status === "UNDER_INVESTIGATION").length },
          { label: "Resolved", value: "RESOLVED", count: complaints.filter((c) => c.status === "RESOLVED").length },
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

      {/* Professional Bordered Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5 border-r border-slate-100">Ticket Category</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Subject & Description</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Raised By</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Priority</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Status</th>
                <th className="py-3.5 px-5 border-r border-slate-100">Reported Date</th>
                <th className="py-3.5 px-5 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredComplaints.map((comp) => (
                <tr
                  key={comp.id}
                  className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  onClick={() => {
                    setSelectedComplaint(comp);
                    setNewStatus(comp.status === "OPEN" ? "UNDER_INVESTIGATION" : comp.status);
                  }}
                >
                  {/* Category */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                      {comp.category}
                    </span>
                  </td>

                  {/* Subject & Description */}
                  <td className="py-3.5 px-5 border-r border-slate-100 max-w-sm">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {comp.subject}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                      {comp.description}
                    </p>
                  </td>

                  {/* Raised By */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <div className="font-semibold text-slate-900">{comp.raisedBy}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {comp.employeeCode} • {comp.department}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-5 border-r border-slate-100">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${getPriorityBadge(comp.priority)}`}>
                      {comp.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-5 border-r border-slate-100 whitespace-nowrap">
                    {getStatusBadge(comp.status)}
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-5 border-r border-slate-100 text-xs text-slate-500 font-mono whitespace-nowrap">
                    {comp.createdAt}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedComplaint(comp);
                        setNewStatus(comp.status === "OPEN" ? "UNDER_INVESTIGATION" : comp.status);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <MessageSquare size={13} /> Inspect ({comp.comments.length})
                    </button>
                  </td>
                </tr>
              ))}
              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No workplace grievances found under this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET INVESTIGATION & REPLY DRAWER */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                    {selectedComplaint.category}
                  </span>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedComplaint.subject}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Reported by {selectedComplaint.raisedBy} ({selectedComplaint.employeeCode} - {selectedComplaint.department}) • {selectedComplaint.createdAt}
                </p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Incident Description */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Original Employee Statement:
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                "{selectedComplaint.description}"
              </p>
            </div>

            {/* Conversation / Action Thread */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Investigation Remarks & Audit Thread ({selectedComplaint.comments.length})
              </span>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {selectedComplaint.comments.map((comm, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl text-xs space-y-1 ${
                      comm.role === "ADMIN"
                        ? "bg-blue-50/80 border border-blue-200/70 ml-4"
                        : "bg-white border border-slate-200 mr-4"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-800">
                        {comm.author} {comm.role === "ADMIN" && "★ Management"}
                      </span>
                      <span className="text-slate-400 font-mono">{comm.time}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{comm.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Response & Status Action Form */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Add Management Remark / Action Taken *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain corrective action taken, inspection results, or resolution note..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Update Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ComplaintItem["status"])}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white"
                  >
                    <option value="UNDER_INVESTIGATION">Under Investigation</option>
                    <option value="RESOLVED">Mark as Resolved</option>
                    <option value="REJECTED">Reject / Dismiss</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Send size={14} /> Post & Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
