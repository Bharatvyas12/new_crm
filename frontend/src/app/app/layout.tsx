"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, CheckSquare, Package, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

const employeeNav = [
  { href: "/app", labelKey: "dashboard", defaultLabel: "Home", icon: Home },
  { href: "/app/attendance", labelKey: "attendance", defaultLabel: "Attendance", icon: Clock },
  { href: "/app/tasks", labelKey: "tasks", defaultLabel: "Tasks", icon: CheckSquare },
  { href: "/app/orders", labelKey: "orders", defaultLabel: "Orders", icon: Package },
  { href: "/app/complaints", labelKey: "complaints", defaultLabel: "Alerts", icon: Bell },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      {/* Main Page Area with comfortable bottom padding so all cards scroll above nav */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 pb-36">
        {children}
      </main>

      {/* Persistent Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 max-w-lg mx-auto shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {employeeNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 transition-colors text-center cursor-pointer",
                  isActive
                    ? "text-[#1a73e8] font-bold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon size={20} className={cn("mb-1", isActive && "stroke-[2.5px]")} />
                <span className="text-[11px] leading-tight">{t(item.labelKey, item.defaultLabel)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
