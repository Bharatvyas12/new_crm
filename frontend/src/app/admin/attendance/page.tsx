"use client";

import React, { useState } from "react";
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
  ShieldCheck
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  employee: string;
  code: string;
  checkIn: string;
  checkOut: string;
  hours: number;
  status: "FULL_DAY" | "HALF_DAY" | "PARTIAL_DAY" | "ABSENT";
  overtime: number;
  late: boolean;
}

const initialAttendance: AttendanceRecord[] = [
  { id: "1", employee: "Rajesh Kumar", code: "EMP001", checkIn: "08:55 AM", checkOut: "07:05 PM", hours: 10.2, status: "FULL_DAY", overtime: 0.5, late: false },
  { id: "2", employee: "Priya Sharma", code: "EMP002", checkIn: "09:12 AM", checkOut: "07:00 PM", hours: 9.8, status: "FULL_DAY", overtime: 0, late: true },
  { id: "3", employee: "Bharat vyas", code: "E001", checkIn: "09:00 AM", checkOut: "02:30 PM", hours: 5.5, status: "HALF_DAY", overtime: 0, late: false },
  { id: "4", employee: "Sneha Reddy", code: "EMP004", checkIn: "08:45 AM", checkOut: "07:30 PM", hours: 10.75, status: "FULL_DAY", overtime: 1.0, late: false },
  { id: "5", employee: "Vikram Singh", code: "EMP005", checkIn: "-", checkOut: "-", hours: 0, status: "ABSENT", overtime: 0, late: false },
  { id: "6", employee: "Ananya Gupta", code: "EMP006", checkIn: "09:05 AM", checkOut: "07:15 PM", hours: 10.15, status: "FULL_DAY", overtime: 0.5, late: false },
  { id: "7", employee: "Deepak Verma", code: "EMP007", checkIn: "09:30 AM", checkOut: "01:00 PM", hours: 3.5, status: "PARTIAL_DAY", overtime: 0, late: true },
  { id: "8", employee: "Kavita Rao", code: "EMP008", checkIn: "08:50 AM", checkOut: "07:00 PM", hours: 10.15, status: "FULL_DAY", overtime: 0.5, late: false },
];

export default function AdminAttendanceRegisterPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialAttendance);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [filter, setFilter] = useState("ALL");
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const filtered = records.filter((a) => {
    if (filter === "ALL") return true;
    return a.status === filter;
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setRecords(records.map((r) => (r.id === editingRecord.id ? editingRecord : r)));
    alert(`Attendance for ${editingRecord.employee} updated and saved.`);
    setEditingRecord(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FULL_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333]">Full Day (≥10h)</span>;
      case "HALF_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef7e0] text-[#b06000]">Half Day (≥5h)</span>;
      case "PARTIAL_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Partial (&lt;5h)</span>;
      case "ABSENT":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#c5221f]">Absent</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daily work-hour tracking with full Admin override, edit, and recalculation control.
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
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">7 / 8</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">FULL DAY</span>
          <span className="text-2xl font-bold font-mono text-blue-600 mt-1 block">5</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">HALF / PARTIAL</span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">2</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ABSENT</span>
          <span className="text-2xl font-bold font-mono text-red-500 mt-1 block">1</span>
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
                <th className="py-3.5 px-5">Check In</th>
                <th className="py-3.5 px-5">Check Out</th>
                <th className="py-3.5 px-5">Worked Hours</th>
                <th className="py-3.5 px-5">Overtime</th>
                <th className="py-3.5 px-5">Classification</th>
                <th className="py-3.5 px-5">Flags</th>
                <th className="py-3.5 px-5 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5">
                    <div>
                      <span className="font-semibold text-slate-900 block">{row.employee}</span>
                      <span className="text-xs text-slate-400 font-mono">({row.code})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-700 font-mono text-xs">{row.checkIn}</td>
                  <td className="py-3.5 px-5 text-slate-700 font-mono text-xs">{row.checkOut}</td>
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900 text-xs">
                    {row.hours > 0 ? `${row.hours} hrs` : "-"}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs">
                    {row.overtime > 0 ? (
                      <span className="text-emerald-600 font-bold">+{row.overtime}h</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">{getStatusBadge(row.status)}</td>
                  <td className="py-3.5 px-5">
                    {row.late && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                        <AlertCircle size={12} /> Late
                      </span>
                    )}
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
              ))}
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
                <p className="text-xs text-slate-500">{editingRecord.employee} ({editingRecord.code})</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Check In Time</label>
                  <input
                    type="text"
                    value={editingRecord.checkIn}
                    onChange={(e) => setEditingRecord({ ...editingRecord, checkIn: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Check Out Time</label>
                  <input
                    type="text"
                    value={editingRecord.checkOut}
                    onChange={(e) => setEditingRecord({ ...editingRecord, checkOut: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Worked Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRecord.hours}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hours: parseFloat(e.target.value) || 0 })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Overtime (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRecord.overtime}
                    onChange={(e) => setEditingRecord({ ...editingRecord, overtime: parseFloat(e.target.value) || 0 })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Classification</label>
                <select
                  value={editingRecord.status}
                  onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="FULL_DAY">FULL_DAY (≥10 hours)</option>
                  <option value="HALF_DAY">HALF_DAY (≥5 hours)</option>
                  <option value="PARTIAL_DAY">PARTIAL_DAY (&lt;5 hours)</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Save size={14} />
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
