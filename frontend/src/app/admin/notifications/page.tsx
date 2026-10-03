"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, Clock, AlertTriangle, Package } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    { id: "1", title: "Order #ORD-0002 Claimed", desc: "Demo Employee claimed order #ORD-0002 for dispatch.", time: "10 mins ago", unread: true },
    { id: "2", title: "New Correction Request", desc: "Bharat vyas submitted an attendance correction for Oct 01.", time: "25 mins ago", unread: true },
    { id: "3", title: "Leave Request Submitted", desc: "Priya Sharma requested 2 days Casual Leave starting Oct 06.", time: "2 hours ago", unread: false },
    { id: "4", title: "Task Evidence Uploaded", desc: "Demo Employee submitted completion evidence for Smoke task.", time: "4 hours ago", unread: false },
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time alerts across workforce activities and claims.</p>
        </div>
        <button
          onClick={() => setNotifications(notifications.map((n) => ({ ...n, unread: false })))}
          className="text-xs text-[#1a73e8] font-semibold hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`bg-white border rounded-2xl p-4 shadow-xs flex items-start gap-3.5 transition-colors ${
              n.unread ? "border-blue-200 bg-blue-50/20" : "border-slate-200"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1a73e8] flex items-center justify-center shrink-0 mt-0.5">
              <Bell size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                <span className="text-xs text-slate-400">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
