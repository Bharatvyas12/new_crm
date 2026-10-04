"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  RefreshCw,
  Edit2,
  Save,
  X,
  Plus,
  QrCode,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  getCRMStore,
  subscribeToCRMStore,
  updateAttendanceRecordInStore,
  AttendanceRecord,
} from "@/lib/store";

export default function AdminAttendanceRegisterPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [filter, setFilter] = useState("ALL");
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadRecords = () => {
      const store = getCRMStore();
      const atts = store.attendance || [];
      const employees = store.employees || [];
      const activeShifts = store.activeShifts || {};
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

      // Build today's live employee roster
      const todayRecords: AttendanceRecord[] = employees.map((emp) => {
        const existing = atts.find((a) => a.employeeCode === emp.code && a.date === today);
        if (existing) return existing;
        const shift = activeShifts[emp.code];
        if (shift && shift.date === today && (shift.shiftState === "ACTIVE" || shift.shiftState === "ON_BREAK")) {
          const elapsedHours = Number(((Date.now() - shift.checkInTimestamp) / 3600000).toFixed(1));
          return {
            id: `att-live-${emp.code}`,
            employeeName: emp.name,
            employeeCode: emp.code,
            department: emp.department,
            date: today,
            checkIn: shift.checkInTime,
            checkOut: "—",
            workedHours: elapsedHours > 0 ? elapsedHours : 0.1,
            overtimeHours: 0,
            classification: "PARTIAL_DAY",
            status: "Present",
            distanceM: shift.distanceM,
          };
        }
        return {
          id: `att-absent-${emp.code}`,
          employeeName: emp.name,
          employeeCode: emp.code,
          department: emp.department,
          date: today,
          checkIn: "—",
          checkOut: "—",
          workedHours: 0,
          overtimeHours: 0,
          classification: "ABSENT",
          status: "Absent",
          distanceM: 0,
        };
      });

      const pastRecords = atts.filter((a) => a.date !== today);
      setRecords([...todayRecords, ...pastRecords]);
    };

    loadRecords();
    const unsubscribe = subscribeToCRMStore(loadRecords);
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filtered = records.filter((a) => {
    if (filter === "ALL") return true;
    return a.classification === filter || a.status === filter;
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    updateAttendanceRecordInStore(editingRecord);
    showToast(`✓ Attendance for ${editingRecord.employeeName} updated and saved.`);
    setEditingRecord(null);
  };

  const getStatusBadge = (classification: string, status: string) => {
    if (status === "Absent" || classification === "ABSENT") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#c5221f]">Not Checked In / Absent</span>;
    }
    switch (classification) {
      case "FULL_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333]">Full Day (≥10h)</span>;
      case "HALF_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef7e0] text-[#b06000]">Half Day (≥5h)</span>;
      case "PARTIAL_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Present (Active Shift)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">{status || classification}</span>;
    }
  };

  const presentCount = records.filter((r) => r.status === "Present").length;
  const fullDayCount = records.filter((r) => r.classification === "FULL_DAY").length;
  const halfOrPartialCount = records.filter((r) => r.classification === "HALF_DAY" || r.classification === "PARTIAL_DAY").length;
  const absentCount = records.filter((r) => r.status === "Absent" || r.classification === "ABSENT").length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 border border-slate-700">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daily work-hour tracking with real-time GPS check-in sync, full Admin override, and edit control.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/attendance/qr"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] border border-blue-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <QrCode size={14} />
            <span>Shop QR</span>
          </Link>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PRESENT</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
            {presentCount} / {records.length || 1}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">FULL DAY</span>
          <span className="text-2xl font-bold font-mono text-blue-600 mt-1 block">{fullDayCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">IN PROGRESS / HALF</span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">{halfOrPartialCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NOT ON DUTY</span>
          <span className="text-2xl font-bold font-mono text-red-500 mt-1 block">{absentCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {["ALL", "FULL_DAY", "HALF_DAY", "PARTIAL_DAY", "ABSENT"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              filter === tab
                ? "bg-[#1a73e8] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Attendance Register Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-100 text-[11px] font-bold text-slate-700 tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Check In</th>
                <th className="py-3.5 px-5">Check Out</th>
                <th className="py-3.5 px-5">Worked Hours</th>
                <th className="py-3.5 px-5">Overtime</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Geofence (Distance)</th>
                <th className="py-3.5 px-5 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    No attendance records found matching this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5">
                      <div>
                        <span className="font-semibold text-slate-900 block">{row.employeeName}</span>
                        <span className="text-xs text-slate-400 font-mono">({row.employeeCode})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 text-xs">{row.department}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-mono text-xs">{row.checkIn}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-mono text-xs">{row.checkOut || "—"}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900 text-xs">
                      {row.workedHours > 0 ? `${row.workedHours} hrs` : row.status === "Present" ? "In Progress" : "0 hrs"}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs">
                      {row.overtimeHours > 0 ? (
                        <span className="text-emerald-600 font-bold">+{row.overtimeHours}h</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">{getStatusBadge(row.classification, row.status)}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 font-mono">
                      {row.distanceM > 0 ? `${row.distanceM}m from shop` : row.status === "Present" ? "Verified GPS" : "—"}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setEditingRecord(row)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Edit2 size={12} />
                        <span>Edit & Save</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Admin Edit / Modify Attendance Record */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Modify Attendance Record</h3>
                <p className="text-xs text-slate-500">{editingRecord.employeeName} ({editingRecord.employeeCode})</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Check In Time</label>
                <input
                  type="text"
                  value={editingRecord.checkIn}
                  onChange={(e) => setEditingRecord({ ...editingRecord, checkIn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Check Out Time</label>
                <input
                  type="text"
                  value={editingRecord.checkOut}
                  onChange={(e) => setEditingRecord({ ...editingRecord, checkOut: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Worked Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRecord.workedHours}
                    onChange={(e) => setEditingRecord({ ...editingRecord, workedHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Overtime Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRecord.overtimeHours}
                    onChange={(e) => setEditingRecord({ ...editingRecord, overtimeHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Day Classification</label>
                <select
                  value={editingRecord.classification}
                  onChange={(e) => setEditingRecord({ ...editingRecord, classification: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="FULL_DAY">Full Day (≥10h)</option>
                  <option value="HALF_DAY">Half Day (≥5h)</option>
                  <option value="PARTIAL_DAY">In Progress / Partial Day</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attendance Status</label>
                <select
                  value={editingRecord.status}
                  onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="On Break">On Break</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
