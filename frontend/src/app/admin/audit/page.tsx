"use client";

import React, { useState } from "react";
import { History, ShieldCheck, User } from "lucide-react";

export default function AuditLogPage() {
  const [logs] = useState([
    {
      id: "1",
      actor: "admin@crm.com (Administrator)",
      category: "ORDER",
      action: "BROADCAST_ORDER",
      entity: "Order #ORD-0001",
      timestamp: "Oct 02, 2026, 10:15 AM",
      ip: "127.0.0.1",
      details: "Broadcasted order to active workforce pool.",
    },
    {
      id: "2",
      actor: "admin@crm.com (Administrator)",
      category: "EMPLOYEE",
      action: "CREATE_EMPLOYEE",
      entity: "Employee E001",
      timestamp: "Oct 01, 2026, 09:30 AM",
      ip: "127.0.0.1",
      details: "Provisioned profile for Bharat vyas in Operations.",
    },
    {
      id: "3",
      actor: "admin@crm.com (Administrator)",
      category: "SETTINGS",
      action: "UPDATE_RULE",
      entity: "BusinessSetting attendance.geofence_radius_meters",
      timestamp: "Oct 01, 2026, 09:00 AM",
      ip: "127.0.0.1",
      details: "Updated radius from 100m to 200m.",
    },
    {
      id: "4",
      actor: "Demo Employee (EMP001)",
      category: "ORDER",
      action: "ATOMIC_CLAIM",
      entity: "Order #ORD-0002",
      timestamp: "Sep 28, 2026, 04:57 AM",
      ip: "10.42.50.12",
      details: "Successfully acquired lock and claimed order for dispatch.",
    },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Append-only cryptographic security audit trail for all business-critical operations.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-100 text-[11px] font-bold text-slate-700 tracking-wider">
            <tr>
              <th className="py-3.5 px-5">Timestamp</th>
              <th className="py-3.5 px-5">Actor</th>
              <th className="py-3.5 px-5">Category</th>
              <th className="py-3.5 px-5">Action</th>
              <th className="py-3.5 px-5">Entity / Details</th>
              <th className="py-3.5 px-5">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70">
                <td className="py-3.5 px-5 text-slate-500 font-mono text-xs whitespace-nowrap">{log.timestamp}</td>
                <td className="py-3.5 px-5 font-semibold text-slate-900 text-xs">{log.actor}</td>
                <td className="py-3.5 px-5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {log.category}
                  </span>
                </td>
                <td className="py-3.5 px-5 font-mono text-xs font-bold text-slate-700">{log.action}</td>
                <td className="py-3.5 px-5 text-xs text-slate-600">
                  <strong className="text-slate-900">{log.entity}</strong> — {log.details}
                </td>
                <td className="py-3.5 px-5 text-slate-400 font-mono text-xs">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
