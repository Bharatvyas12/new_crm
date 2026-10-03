"use client";

import React, { useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([
    { id: "1", name: "New Year's Day", date: "Jan 01, 2026", type: "Public Holiday" },
    { id: "2", name: "Republic Day", date: "Jan 26, 2026", type: "National Holiday" },
    { id: "3", name: "Holi", date: "Mar 04, 2026", type: "Gazetted Holiday" },
    { id: "4", name: "Independence Day", date: "Aug 15, 2026", type: "National Holiday" },
    { id: "5", name: "Gandhi Jayanti", date: "Oct 02, 2026", type: "National Holiday" },
    { id: "6", name: "Diwali", date: "Nov 08, 2026", type: "Gazetted Holiday" },
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Holidays (2026)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Declared non-working days. Attendance calculations auto-waive required daily hours on holidays.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-100 text-[11px] font-bold text-slate-700 tracking-wider">
            <tr>
              <th className="py-3.5 px-5">Holiday Name</th>
              <th className="py-3.5 px-5">Date</th>
              <th className="py-3.5 px-5">Classification</th>
              <th className="py-3.5 px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holidays.map((h) => (
              <tr key={h.id} className="hover:bg-slate-50/70">
                <td className="py-3.5 px-5 font-semibold text-slate-900">{h.name}</td>
                <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">{h.date}</td>
                <td className="py-3.5 px-5 text-slate-600 text-xs">{h.type}</td>
                <td className="py-3.5 px-5 text-right">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    Paid Off
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
