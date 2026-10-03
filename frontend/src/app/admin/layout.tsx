"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  Clock,
  ListTodo,
  QrCode,
  CheckSquare,
  FileText,
  Package,
  CalendarOff,
  Banknote,
  CircleDollarSign,
  BookOpen,
  AlertTriangle,
  Settings,
  History,
  LogOut,
  Menu,
  X,
  FileBarChart,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

interface NavGroup {
  group: string;
  items: {
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/reports", label: "Reports & Analytics", icon: FileBarChart },
    ],
  },
  {
    group: "PEOPLE",
    items: [
      { href: "/admin/employees", label: "Employees", icon: Users },
      { href: "/admin/roles", label: "Roles & permissions", icon: Shield },
    ],
  },
  {
    group: "ATTENDANCE",
    items: [
      { href: "/admin/attendance", label: "Register", icon: Clock },
      { href: "/admin/attendance/corrections", label: "Corrections", icon: ListTodo },
      { href: "/admin/attendance/qr", label: "Shop QR", icon: QrCode },
    ],
  },
  {
    group: "WORK",
    items: [
      { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/admin/tasks/review", label: "Review queue", icon: FileText },
      { href: "/admin/orders", label: "Orders", icon: Package },
    ],
  },
  {
    group: "TIME OFF",
    items: [
      { href: "/admin/leaves", label: "Leave queue", icon: CalendarOff },
    ],
  },
  {
    group: "FINANCE",
    items: [
      { href: "/admin/ledger/advances", label: "Advances", icon: Banknote },
      { href: "/admin/payroll", label: "Payroll", icon: CircleDollarSign },
      { href: "/admin/ledger", label: "Ledger", icon: BookOpen },
    ],
  },
  {
    group: "SUPPORT",
    items: [
      { href: "/admin/complaints", label: "Complaints", icon: AlertTriangle },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit", label: "Audit log", icon: History },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1a73e8] text-white font-bold flex items-center justify-center text-sm shadow-xs">
              W
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900">Workforce CRM</span>
              <span className="text-[10px] text-slate-600 font-medium -mt-0.5">Admin Workspace</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {group.group}
              </div>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group",
                        isActive
                          ? "bg-blue-50 text-[#1a73e8] font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          size={16}
                          className={cn(
                            "transition-colors",
                            isActive
                              ? "text-[#1a73e8]"
                              : "text-slate-600 group-hover:text-slate-600"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#1a73e8]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.full_name ? user.full_name.charAt(0) : "A"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {user?.full_name || "System Admin"}
                </span>
                <span className="text-[10px] text-slate-600 truncate">{user?.email || "admin@crm.com"}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Mobile Toggle */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 lg:hidden sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <div className="font-bold text-sm text-slate-900">Workforce CRM</div>
          <div className="w-8" />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
