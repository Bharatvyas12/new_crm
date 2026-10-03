"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EmployeeLeavesPage() {
  const [showApply, setShowApply] = useState(false);
  const [leaveType, setLeaveType] = useState("CL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [applied, setApplied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      setShowApply(false);
    }, 1500);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-foreground">My Leaves</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Apply for leave & check balance</p>
        </div>
        <button
          onClick={() => setShowApply(!showApply)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
        >
          <Plus size={14} />
          <span>Apply</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border rounded-xl p-3.5 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Casual Leave</span>
          <p className="text-xl font-bold font-mono text-foreground">8 / 12</p>
          <span className="text-[10px] text-muted-foreground">Days Remaining</span>
        </div>
        <div className="bg-card border rounded-xl p-3.5 space-y-1 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sick Leave</span>
          <p className="text-xl font-bold font-mono text-foreground">6.5 / 8</p>
          <span className="text-[10px] text-muted-foreground">Days Remaining</span>
        </div>
      </div>

      {/* Apply Form */}
      {showApply && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="bg-card border rounded-xl p-4 shadow-sm space-y-3"
        >
          <h3 className="font-semibold text-sm">Apply for Leave</h3>
          <div className="space-y-2 text-xs">
            <div>
              <label className="text-muted-foreground block mb-1">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full p-2 bg-secondary/50 border rounded-lg"
              >
                <option value="CL">Casual Leave (Paid)</option>
                <option value="SL">Sick Leave (Paid)</option>
                <option value="UL">Unpaid Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-muted-foreground block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 bg-secondary/50 border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 bg-secondary/50 border rounded-lg text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-muted-foreground block mb-1">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Brief reason for leave..."
                className="w-full p-2 bg-secondary/50 border rounded-lg text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground font-medium rounded-lg text-xs"
          >
            {applied ? "Submitted!" : "Submit Application"}
          </button>
        </motion.form>
      )}

      {/* History */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Leave History</h3>
        <div className="bg-card border rounded-xl p-3 shadow-sm flex items-center justify-between text-xs">
          <div>
            <span className="font-medium text-foreground block">Casual Leave (2 days)</span>
            <span className="text-muted-foreground">Sep 28 - Sep 29</span>
          </div>
          <Badge variant="success">Approved</Badge>
        </div>
      </div>
    </div>
  );
}
