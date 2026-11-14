"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  Power,
  Store,
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
  autoCheckOutAllActiveEmployeesInStore,
  getDynamicWorkedHours,
  AttendanceRecord,
  CRMStoreData,
  getEmployeeLiveStatus,
} from "@/lib/store";

export interface AttendanceDisplayRecord extends AttendanceRecord {
  shiftState?: "NOT_STARTED" | "ACTIVE" | "ON_BREAK" | "COMPLETED";
  breakStartTime?: string;
  breakEndTime?: string;
  totalBreakSeconds?: number;
  ongoingBreakSeconds?: number;
  excessBreakMinutes?: number;
}

const getLocalDateString = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function AdminAttendanceRegisterPage() {
  const [records, setRecords] = useState<AttendanceDisplayRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [filter, setFilter] = useState("ALL");
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [requiredDailyHours, setRequiredDailyHours] = useState(10);
  const [allowedBreakMinutes, setAllowedBreakMinutes] = useState(60);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  const loadRecords = (sourceStore?: CRMStoreData) => {
    const store = sourceStore || getCRMStore();
      if (store.settings?.requiredDailyHours) {
        setRequiredDailyHours(Number(store.settings.requiredDailyHours) || 10);
      }
      const allowedBreak = Number(store.settings?.allowedBreakMinutes) || 60;
      setAllowedBreakMinutes(allowedBreak);

      const atts = store.attendance || [];
      const employees = store.employees || [];
      const activeShifts = store.activeShifts || {};

      // Parse selected date safely
      const [y, m, d] = (selectedDate || getLocalDateString())
        .split("-")
        .map(Number);
      const targetDateObj = new Date(y, m - 1, d);
      const targetDateStr = targetDateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });

      const todayStr = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      const todayISO = getLocalDateString();
      const isTargetToday = targetDateStr === todayStr || selectedDate === todayISO;

      const staffEmployees = employees.filter(
        (emp: any) => emp && emp.code && !emp.code.includes("ADMIN") && emp.department !== "Management"
      );

      // Build roster for selected date
      const dateRecords: AttendanceDisplayRecord[] = staffEmployees.map((emp: any) => {
        const empCodeTrim = (emp.code || "").trim().toLowerCase();
        const empNameTrim = (emp.name || "").trim().toLowerCase();

        const matchingAtts = atts.filter((a: any) => {
          if (!a) return false;
          const aCode = (a.employeeCode || "").trim().toLowerCase();
          const aName = (a.employeeName || "").trim().toLowerCase();
          const empCodeMatch = aCode === empCodeTrim;
          const empNameMatch = aName === empNameTrim;
          if (!empCodeMatch && !empNameMatch) return false;

          const aDate = (a.date || "").trim();
          if (aDate === targetDateStr) return true;
          if (isTargetToday && (aDate === todayStr || aDate === todayISO || aDate.includes(todayStr.split(",")[0]))) return true;

          const dt = new Date(aDate);
          if (!isNaN(dt.getTime())) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, "0");
            const d = String(dt.getDate()).padStart(2, "0");
            if (`${y}-${m}-${d}` === selectedDate) return true;
          }
          return false;
        });

        const existing =
          matchingAtts.find((a: any) => a.status === "Present" || a.status === "On Break" || (a.checkIn && a.checkIn !== "—")) ||
          matchingAtts[0] ||
          null;

        const live = getEmployeeLiveStatus(store, emp.code, emp.name);
        const shift: any =
          activeShifts[emp.code] ||
          activeShifts[(emp.code || "").toUpperCase()] ||
          activeShifts[(emp.code || "").toLowerCase()] ||
          Object.values(activeShifts).find((s: any) => {
            if (!s || typeof s !== "object") return false;
            const sc = String(s.employeeCode || "").trim().toLowerCase();
            const sn = String(s.employeeName || "").trim().toLowerCase();
            return (sc && sc === empCodeTrim) || (sn && sn === empNameTrim);
          }) ||
          live.shift ||
          null;

        const isShiftOnDuty = Boolean(
          shift && (shift.shiftState === "ACTIVE" || shift.shiftState === "ON_BREAK")
        );
        const isAttPresent = Boolean(
          existing && (existing.status === "Present" || existing.status === "On Break")
        );

        // 1. If target is TODAY: Check live status or active shift or existing present record
        if (isTargetToday && (live.isOnDuty || isShiftOnDuty || isAttPresent)) {
          const isOnBreak = live.isOnBreak || shift?.shiftState === "ON_BREAK" || existing?.status === "On Break";
          const checkIn = shift?.checkInTime || live.checkInTime || existing?.checkIn || "09:00 AM";
          const checkOut = (!isShiftOnDuty && existing?.checkOut && existing.checkOut !== "—") ? existing.checkOut : "—";
          const workedHours = live.workedHours > 0 ? live.workedHours : (existing?.workedHours || 0);
          const classification = live.classification || (workedHours >= requiredDailyHours ? "FULL_DAY" : workedHours >= requiredDailyHours / 2 ? "HALF_DAY" : "PARTIAL_DAY");

          return {
            id: existing?.id || `att-live-${emp.code}`,
            employeeName: emp.name,
            employeeCode: emp.code,
            department: emp.department,
            date: todayStr,
            checkIn,
            checkOut,
            workedHours,
            overtimeHours: Math.max(0, Number((workedHours - requiredDailyHours).toFixed(1))),
            classification: classification as any,
            status: isOnBreak ? ("On Break" as any) : "Present",
            distanceM: shift?.distanceM || live.distanceM || existing?.distanceM || 10,
            shiftState: isOnBreak ? "ON_BREAK" : "ACTIVE",
            breakStartTime: shift?.breakStartTime,
            breakEndTime: shift?.breakEndTime,
            totalBreakSeconds: live.totalBreakSeconds || shift?.totalBreakSeconds || 0,
            ongoingBreakSeconds: live.ongoingBreakSeconds || 0,
            excessBreakMinutes: live.excessBreakMinutes || 0,
          };
        }

        // 2. If existing record exists for this date
        if (existing) {
          if (!isTargetToday && (existing.checkOut === "—" || !existing.checkOut)) {
            const worked = existing.workedHours > 0.1 ? existing.workedHours : 7.5;
            return {
              ...existing,
              checkOut: "19:00",
              workedHours: worked,
              classification: worked >= requiredDailyHours ? "FULL_DAY" : "HALF_DAY",
              shiftState: shift?.shiftState || "COMPLETED",
              totalBreakSeconds: 0,
              ongoingBreakSeconds: 0,
              excessBreakMinutes: 0,
            };
          }
          return {
            ...existing,
            shiftState: shift?.shiftState || (existing.checkOut && existing.checkOut !== "—" ? "COMPLETED" : "NOT_STARTED"),
            totalBreakSeconds: shift?.totalBreakSeconds || 0,
            ongoingBreakSeconds: 0,
            excessBreakMinutes: 0,
          };
        }

        // 3. Otherwise Absent
        return {
          id: `att-absent-${emp.code}-${targetDateStr}`,
          employeeName: emp.name,
          employeeCode: emp.code,
          department: emp.department,
          date: targetDateStr,
          checkIn: "—",
          checkOut: "—",
          workedHours: 0,
          overtimeHours: 0,
          classification: "ABSENT",
          status: "Absent",
          distanceM: 0,
          shiftState: "NOT_STARTED",
          totalBreakSeconds: 0,
          ongoingBreakSeconds: 0,
          excessBreakMinutes: 0,
        };
      });

    setRecords(dateRecords);
  };

  useEffect(() => {
    loadRecords();
    const unsubscribe = subscribeToCRMStore(() => loadRecords());

    // Immediate fresh pull on register mount
    import("@/lib/syncEngine").then(async (mod) => {
      const cloudData = await mod.pullStoreFromCloud(true);
      if (cloudData) {
        loadRecords(cloudData);
      }
    });

    // Auto pull every 6 seconds to keep live attendance in real-time sync with mobile phones
    const liveSyncInterval = setInterval(async () => {
      const { pullStoreFromCloud } = await import("@/lib/syncEngine");
      const cloudData = await pullStoreFromCloud(true);
      if (cloudData) {
        loadRecords(cloudData);
      } else {
        loadRecords();
      }
    }, 6000);

    return () => {
      unsubscribe();
      clearInterval(liveSyncInterval);
    };
  }, [selectedDate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filtered = records.filter((a) => {
    if (filter === "ALL") return true;
    return a.classification === filter || a.status === filter;
  });

    const handleDayOffAutoCheckout = () => {
    const isToday = selectedDate === new Date().toISOString().split("T")[0];
    const confirmMsg = isToday
      ? "क्या आप आज 'Day Off / दुकान बंद' घोषित करना चाहते हैं?\n\n• जिन कर्मचारियों ने आज चेक-आउट नहीं किया था, उनका अभी ऑटो चेक-आउट हो जाएगा।\n• जिन्होंने पहले ही चेक-आउट कर लिया है, उनका दर्ज समय सुरक्षित रहेगा।"
      : "आज की तारीख के सभी खुले चेक-इन को बंद करें?";

    if (window.confirm(confirmMsg)) {
      const res = autoCheckOutAllActiveEmployeesInStore();
      if (res.checkedOutCount > 0) {
        showToast(`✓ Day Off: ${res.checkedOutCount} कर्मचारियों का ऑटो चेक-आउट (${res.checkOutTime}) दर्ज हुआ।`);
      } else {
        showToast(`✓ सभी कर्मचारी पहले से चेक-आउट हैं या कोई खुला चेक-इन नहीं था।`);
      }
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    updateAttendanceRecordInStore(editingRecord);
    showToast(`✓ Attendance for ${editingRecord.employeeName} updated and saved.`);
    setEditingRecord(null);
  };

  const getStatusBadge = (classification: string, status: string, shiftState?: string) => {
    if (shiftState === "ON_BREAK" || status === "On Break") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          On Break
        </span>
      );
    }
    if (status === "Absent" || classification === "ABSENT") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#c5221f]">Not Checked In / Absent</span>;
    }
    switch (classification) {
      case "FULL_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333]">Full Day (≥{requiredDailyHours}h)</span>;
      case "HALF_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef7e0] text-[#b06000]">Half Day (≥{Math.round(requiredDailyHours / 2)}h)</span>;
      case "PARTIAL_DAY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">Present (Active Shift)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">{status || classification}</span>;
    }
  };

  const presentCount = records.filter((r) => r.status === "Present" || r.status === "On Break" as any).length;
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
            Daily work-hour tracking with real-time GPS check-in sync, live break monitoring, and excess break deduction.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate(getLocalDateString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === getLocalDateString()
                  ? "bg-[#1a73e8] text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Today (Live)
            </button>
            <button
              type="button"
              onClick={() => {
                const yest = new Date();
                yest.setDate(yest.getDate() - 1);
                setSelectedDate(getLocalDateString(yest));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate !== getLocalDateString()
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Yesterday
            </button>
          </div>

          <Link
            href="/admin/settings"
            title="Configure allowed break duration in Settings"
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <span>Allowed Break: {allowedBreakMinutes}m</span>
          </Link>

          <button
            type="button"
            disabled={isSyncingLive}
            onClick={async () => {
              setIsSyncingLive(true);
              showToast("Syncing Live Register with Cloud...");
              try {
                const { pullStoreFromCloud } = await import("@/lib/syncEngine");
                const cloudData = await pullStoreFromCloud(true);
                if (cloudData) {
                  loadRecords(cloudData);
                } else {
                  loadRecords();
                }
                showToast("✓ Live Register synced with Cloud!");
              } catch (e) {
                showToast("⚠️ Cloud sync timeout, will retry automatically");
              } finally {
                setIsSyncingLive(false);
              }
            }}
            title="Pull latest live check-ins from Cloud"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncingLive ? "animate-spin" : ""} />
            <span>{isSyncingLive ? "Syncing..." : "Sync Live Register"}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (window.confirm("क्या आप ब्राउज़र कैश साफ करके क्लाउड से 100% फ्रेश डेटा लोड करना चाहते हैं?")) {
                const { resetAndResyncFromCloud } = await import("@/lib/syncEngine");
                await resetAndResyncFromCloud();
              }
            }}
            title="Purge local cache and hard-resync from Cloud"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Reset Cache & Sync</span>
          </button>

          <button
            type="button"
            onClick={handleDayOffAutoCheckout}
            title="दुकान बंद होने पर सभी छूटे हुए कर्मचारियों का ऑटो चेक-आउट करें"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Power size={14} />
            <span>Day Off / दुकान बंद (Auto Checkout)</span>
          </button>

          <Link
            href="/admin/attendance/qr"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] border border-blue-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
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
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
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
                <th className="py-3.5 px-5">Break Details</th>
                <th className="py-3.5 px-5">Worked Hours</th>
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
                    <td className="py-3.5 px-5 text-xs">
                      {row.shiftState === "ON_BREAK" ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-amber-700 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            On Break ({Math.floor((row.ongoingBreakSeconds || 0) / 60)}m)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Started: {row.breakStartTime || "—"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Allowed: {allowedBreakMinutes}m
                          </span>
                          {(row.excessBreakMinutes || 0) > 0 && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 w-fit">
                              ⚠️ -{row.excessBreakMinutes}m excess deducted
                            </span>
                          )}
                        </div>
                      ) : (row.totalBreakSeconds || 0) > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-700">
                            {Math.round((row.totalBreakSeconds || 0) / 60)}m total break
                          </span>
                          {row.breakStartTime && (
                            <span className="text-[11px] text-slate-500">
                              {row.breakStartTime} {row.breakEndTime ? `– ${row.breakEndTime}` : "(Ended)"}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            Allowed: {allowedBreakMinutes}m
                          </span>
                          {(row.excessBreakMinutes || 0) > 0 ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 w-fit">
                              ⚠️ -{row.excessBreakMinutes}m excess deducted
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              ✓ Within allowed limit
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No break taken</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs">
                      {row.status === "Present" && (row.checkOut === "—" || !row.checkOut) ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 inline-block w-fit">
                            {row.workedHours} hrs
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {Math.floor(row.workedHours * 60)}m net active
                          </span>
                          {(row.excessBreakMinutes || 0) > 0 && (
                            <span className="text-[9px] text-red-500 font-medium">
                              (includes -{row.excessBreakMinutes}m break deduction)
                            </span>
                          )}
                        </div>
                      ) : row.workedHours > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{row.workedHours} hrs</span>
                          {(row.excessBreakMinutes || 0) > 0 && (
                            <span className="text-[9px] text-red-500 font-medium">
                              (-{row.excessBreakMinutes}m break excess)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">0 hrs</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">{getStatusBadge(row.classification, row.status, row.shiftState)}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 font-mono">
                      {row.distanceM > 0 ? `${row.distanceM}m from shop` : row.status === "Present" || (row.status as any) === "On Break" ? "Verified GPS" : "—"}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setEditingRecord(row)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
                  <option value="FULL_DAY">Full Day (≥{requiredDailyHours}h)</option>
                  <option value="HALF_DAY">Half Day (≥{Math.round(requiredDailyHours / 2)}h)</option>
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
