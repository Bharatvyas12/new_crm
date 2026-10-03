"use client";

import React, { useState } from "react";
import { Clock, Calendar, AlertCircle, CheckCircle2, ChevronRight, Plus } from "lucide-react";

export default function EmployeeAttendancePage() {
  const [records] = useState([
    { date: "Oct 02, 2026", in: "02:09 PM", out: "-", hours: "In progress", classification: "Active", overtime: "0h" },
    { date: "Oct 01, 2026", in: "08:55 AM", out: "07:05 PM", hours: "10.2h", classification: "Full Day", overtime: "+0.5h" },
    { date: "Sep 30, 2026", in: "09:00 AM", out: "07:00 PM", hours: "10.0h", classification: "Full Day", overtime: "0h" },
    { date: "Sep 29, 2026", in: "09:15 AM", out: "02:30 PM", hours: "5.2h", classification: "Half Day", overtime: "0h" },
    { date: "Sep 28, 2026", in: "08:50 AM", out: "07:30 PM", hours: "10.7h", classification: "Full Day", overtime: "+1.0h" },
  ]);

  return (
    <div className="space-y-6 font-sans">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
        <p className="text-xs text-slate-500">History of worked hours, shift classifications, and overtime.</p>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FULL DAYS</span>
          <span className="text-xl font-bold font-mono text-emerald-600">22</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">HALF DAYS</span>
          <span className="text-xl font-bold font-mono text-amber-600">2</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OVERTIME</span>
          <span className="text-xl font-bold font-mono text-blue-600">+4.5h</span>
        </div>
      </div>

      {/* Attendance History List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Recent Shifts</h3>
        {records.map((r, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-900 block">{r.date}</span>
              <span className="text-[11px] text-slate-400">In: {r.in} • Out: {r.out}</span>
            </div>
            <div className="text-right space-y-0.5">
              <span className="font-mono font-bold text-xs text-slate-800 block">{r.hours}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                r.classification === "Full Day"
                  ? "bg-emerald-100 text-emerald-700"
                  : r.classification === "Half Day"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {r.classification}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
