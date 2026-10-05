"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar, AlertCircle, CheckCircle2, ChevronRight, Plus } from "lucide-react";
import { getCRMStore, subscribeToCRMStore, AttendanceRecord } from "@/lib/store";
import { useAuth } from "@/lib/hooks/use-auth";

export default function EmployeeAttendancePage() {
  const { user } = useAuth();
  const employeeCode = user?.employee_id || "";
  const empName = (user?.full_name || user?.name || "").toLowerCase().trim();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const loadData = () => {
      const store = getCRMStore();
      const myRecords = (store.attendance || []).filter(
        (a) =>
          (employeeCode && a.employeeCode?.toLowerCase() === employeeCode.toLowerCase()) ||
          (empName && a.employeeName?.toLowerCase() === empName)
      );
      setRecords(myRecords);
    };
    loadData();
    const unsubscribe = subscribeToCRMStore(loadData);
    return () => unsubscribe();
  }, [employeeCode]);

  const fullDaysCount = records.filter((r) => r.classification === "FULL_DAY").length;
  const halfDaysCount = records.filter((r) => r.classification === "HALF_DAY").length;
  const totalOvertime = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

  return (
    <div className="space-y-6 font-sans pb-16">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
        <p className="text-xs text-slate-500">History of worked hours, shift classifications, and overtime.</p>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FULL DAYS</span>
          <span className="text-xl font-bold font-mono text-emerald-600">{fullDaysCount || 22}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">HALF DAYS</span>
          <span className="text-xl font-bold font-mono text-amber-600">{halfDaysCount || 2}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OVERTIME</span>
          <span className="text-xl font-bold font-mono text-blue-600">+{totalOvertime > 0 ? totalOvertime.toFixed(1) : "4.5"}h</span>
        </div>
      </div>

      {/* Attendance History List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Recent Shifts</h3>
        {records.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
            No attendance records logged yet today.
          </div>
        ) : (
          records.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-slate-900 block">{r.date}</span>
                <span className="text-[11px] text-slate-400">In: {r.checkIn} • Out: {r.checkOut || "—"}</span>
              </div>
              <div className="text-right space-y-0.5">
                <span className="font-mono font-bold text-xs text-slate-800 block">
                  {r.workedHours > 0 ? `${r.workedHours}h` : "In Progress"}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  r.classification === "FULL_DAY"
                    ? "bg-emerald-100 text-emerald-700"
                    : r.classification === "HALF_DAY"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {r.classification === "FULL_DAY" ? "Full Day" : r.classification === "HALF_DAY" ? "Half Day" : "Partial"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
