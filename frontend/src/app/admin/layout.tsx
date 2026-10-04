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
  Lock,
  ArrowRight,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCRMStore } from "@/lib/store";

interface NavGroup {
  groupKey: string;
  groupLabel: string;
  items: {
    href: string;
    labelKey: string;
    defaultLabel: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    groupKey: "OVERVIEW",
    groupLabel: "OVERVIEW",
    items: [
      { href: "/admin", labelKey: "dashboard", defaultLabel: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/reports", labelKey: "reports", defaultLabel: "Reports & Analytics", icon: FileBarChart },
    ],
  },
  {
    groupKey: "PEOPLE",
    groupLabel: "PEOPLE",
    items: [
      { href: "/admin/employees", labelKey: "employees", defaultLabel: "Employees", icon: Users },
      { href: "/admin/roles", labelKey: "roles", defaultLabel: "Roles & permissions", icon: Shield },
    ],
  },
  {
    groupKey: "ATTENDANCE",
    groupLabel: "ATTENDANCE",
    items: [
      { href: "/admin/attendance", labelKey: "register", defaultLabel: "Register", icon: Clock },
      { href: "/admin/attendance/corrections", labelKey: "corrections", defaultLabel: "Corrections", icon: ListTodo },
      { href: "/admin/attendance/qr", labelKey: "shopQr", defaultLabel: "Shop QR", icon: QrCode },
    ],
  },
  {
    groupKey: "WORK",
    groupLabel: "WORK",
    items: [
      { href: "/admin/tasks", labelKey: "tasks", defaultLabel: "Tasks", icon: CheckSquare },
      { href: "/admin/tasks/review", labelKey: "reviewQueue", defaultLabel: "Review queue", icon: FileText },
      { href: "/admin/orders", labelKey: "orders", defaultLabel: "Orders", icon: Package },
    ],
  },
  {
    groupKey: "TIME OFF",
    groupLabel: "TIME OFF",
    items: [
      { href: "/admin/leaves", labelKey: "leaves", defaultLabel: "Leave queue", icon: CalendarOff },
    ],
  },
  {
    groupKey: "FINANCE",
    groupLabel: "FINANCE",
    items: [
      { href: "/admin/ledger/advances", labelKey: "advances", defaultLabel: "Advances", icon: Banknote },
      { href: "/admin/payroll", labelKey: "payroll", defaultLabel: "Payroll", icon: CircleDollarSign },
      { href: "/admin/ledger", labelKey: "ledger", defaultLabel: "Ledger", icon: BookOpen },
    ],
  },
  {
    groupKey: "SUPPORT",
    groupLabel: "SUPPORT",
    items: [
      { href: "/admin/complaints", labelKey: "complaints", defaultLabel: "Complaints", icon: AlertTriangle },
    ],
  },
  {
    groupKey: "SYSTEM",
    groupLabel: "SYSTEM",
    items: [
      { href: "/admin/settings", labelKey: "settings", defaultLabel: "Settings", icon: Settings },
      { href: "/admin/audit", labelKey: "auditLog", defaultLabel: "Audit log", icon: History },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, login, logout, isLoading } = useAuth();
  const { t, lang } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Admin Auth Form State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    const emailTrim = adminEmail.trim().toLowerCase();
    const passTrim = adminPassword.trim();

    // Check against store admin or default credentials
    const store = getCRMStore();
    const adminEmp = store.employees.find(
      (e) => (e.email.toLowerCase() === emailTrim || e.code.toLowerCase() === emailTrim) && (e.initialPassword === passTrim || passTrim === "admin123")
    );

    if (
      (emailTrim === "admin@crm.com" && passTrim === "admin123") ||
      (adminEmp && (adminEmp.code.includes("ADMIN") || adminEmp.department === "Management"))
    ) {
      login({
        id: adminEmp?.id || "1",
        email: adminEmp?.email || "admin@crm.com",
        full_name: adminEmp?.name || "System Administrator",
        name: adminEmp?.name || "System Administrator",
        role: "ADMIN",
        is_superuser: true,
      });
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      setAuthError(t("invalidAdminCredentials", "Invalid admin email or password. Default is admin@crm.com / admin123"));
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. Strict Admin Auth Guard: If not logged in as Admin, prompt for credentials
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Language Switcher in Login */}
          <div className="flex justify-end">
            <LanguageSwitcher className="bg-slate-800/80 border-slate-700" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{t("adminLoginTitle", "Workforce CRM — Admin Security")}</h1>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {t("adminLoginDesc", "Please enter administrator credentials to access the management portal.")}
                </p>
              </div>
            </div>

            {authError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2.5">
                <AlertTriangle size={16} className="shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t("emailAddress", "Email Address")} / ID
                </label>
                <input
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@crm.com"
                  className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {t("password", "Password")}
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Default: admin123</span>
                </div>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? "Verifying..." : t("loginButton", "Authenticate & Open Admin")}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <Link href="/app" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                ← {t("employeePortal", "Employee Portal")}
              </Link>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                <ShieldCheck size={14} />
                <span>{t("syncLive", "Cloud Live Synced")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Interface
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
              <span className="text-[10px] text-slate-600 font-medium -mt-0.5">{t("adminWorkspace", "Admin Workspace")}</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Language Switcher in Sidebar */}
        <div className="px-4 pt-3 pb-1">
          <LanguageSwitcher className="w-full justify-center" />
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.groupKey} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {group.groupLabel}
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
                        <span>{t(item.labelKey, item.defaultLabel)}</span>
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
          <LanguageSwitcher />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
