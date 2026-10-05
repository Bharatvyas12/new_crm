"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Plus, Lock, Globe, MessageSquare, CheckCircle2, Clock, X, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { getCRMStore, createComplaintInStore, ComplaintItem } from "@/lib/store";

export default function EmployeeComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Complaint Form
  const [form, setForm] = useState({
    category: "Workplace Safety" as ComplaintItem["category"],
    priority: "MEDIUM" as ComplaintItem["priority"],
    visibility: "EMPLOYEE_PRIVATE" as ComplaintItem["visibility"],
    subject: "",
    description: "",
  });

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      alert("Please fill in subject and description");
      return;
    }

    createComplaintInStore({
      category: form.category,
      priority: form.priority,
      visibility: form.visibility,
      subject: form.subject.trim(),
      description: form.description.trim(),
      raisedBy: user?.full_name || user?.name || "Staff",
      employeeCode: user?.employee_id || "",
      department: "Operations",
    });

    setShowNewModal(false);
    setForm({
      category: "Workplace Safety",
      priority: "MEDIUM",
      visibility: "EMPLOYEE_PRIVATE",
      subject: "",
      description: "",
    });
    showToast("✓ Issue report submitted to management!");
  };

  const getStatusBadge = (status: ComplaintItem["status"]) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Open
          </span>
        );
      case "UNDER_INVESTIGATION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> In Progress
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 font-sans pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Helpdesk & Grievances</h1>
          <p className="text-xs text-slate-500 mt-0.5">Report maintenance, facility or workplace concerns</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Report Issue</span>
        </button>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {complaints.map((comp) => (
          <div
            key={comp.id}
            className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 uppercase">
                  {comp.category}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">{comp.subject}</h3>
              </div>
              {getStatusBadge(comp.status)}
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl leading-relaxed">
              "{comp.description}"
            </p>

            {/* Conversation Timeline */}
            {comp.comments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Management Responses ({comp.comments.length})
                </span>
                {comp.comments.map((c, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl text-xs space-y-0.5 ${
                      c.role === "ADMIN"
                        ? "bg-blue-50 text-blue-950 border border-blue-100"
                        : "bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>{c.author} {c.role === "ADMIN" && "★ Management"}</span>
                      <span className="font-mono">{c.time}</span>
                    </div>
                    <p className="leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
              <span>Reported on {comp.createdAt}</span>
              <span>Priority: {comp.priority}</span>
            </div>
          </div>
        ))}

        {complaints.length === 0 && (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            No issues reported. Click "+ Report Issue" if you need any facility help.
          </div>
        )}
      </div>

      {/* NEW COMPLAINT MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Report Workplace Grievance</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                >
                  <option value="Workplace Safety">Workplace Safety & Hazards</option>
                  <option value="Equipment & Tools">Equipment & Tools Repair</option>
                  <option value="Facility / Cleanliness">Facility, Water & Cleanliness</option>
                  <option value="Salary & Payroll">Salary & Payroll Discrepancy</option>
                  <option value="General Feedback">General Workforce Feedback</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subject Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Packing tape dispenser broken in Bay 2"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the issue, location in shop, and urgency..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  <Send size={13} /> Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
