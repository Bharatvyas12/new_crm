"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCRMStore } from "@/lib/store";
import { pullStoreFromCloud } from "@/lib/syncEngine";
import { Lock, ArrowRight, ShieldCheck, AlertTriangle, UserCheck, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, lang } = useLanguage();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    pullStoreFromCloud(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Pull latest employees from cloud before verifying
    try {
      await pullStoreFromCloud(true);
    } catch {}

    const inputId = identifier.trim().toLowerCase();
    const inputPass = password.trim();

    const store = getCRMStore();
    const employees = store.employees || [];

    // Find employee by email or code
    const matched = employees.find(
      (emp) =>
        emp.email.toLowerCase() === inputId ||
        emp.code.toLowerCase() === inputId
    );

    // Also check hardcoded fallback for default admin
    const isAdminDefault = inputId === "admin@crm.com" && inputPass === "admin123";

    if (isAdminDefault || (matched && (matched.code.includes("ADMIN") || matched.department === "Management") && (matched.initialPassword === inputPass || inputPass === "admin123"))) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("wcrm_admin_unlocked", "true");
      }
      const adminUser = matched || {
        id: "1",
        code: "ADMIN001",
        name: "System Administrator",
        email: "admin@crm.com",
      };
      login({
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.name,
        name: adminUser.name,
        role: "ADMIN",
        employee_id: "ADMIN001",
        is_superuser: true,
      });
      setIsSubmitting(false);
      router.push("/admin");
      return;
    }

    if (matched) {
      // Validate password
      const validPass = matched.initialPassword || "Emp@2026";
      if (inputPass === validPass || inputPass === "Emp@2026") {
        login({
          id: matched.id,
          email: matched.email,
          full_name: matched.name,
          name: matched.name,
          role: "EMPLOYEE",
          employee_id: matched.code,
        });
        setIsSubmitting(false);
        router.push("/app");
        return;
      }
    }

    // Invalid credentials
    setIsSubmitting(false);
    setErrorMessage(
      lang === "hi"
        ? "अमान्य आईडी/कोड या पासवर्ड। कृपया व्यवस्थापक से संपर्क करें।"
        : "Invalid Employee Code/Email or Password. Please verify credentials."
    );
  };

  const handleQuickFill = (code: string, pass: string) => {
    setIdentifier(code);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top bar with Language Switcher */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Enterprise Gateway</span>
          </div>
          <LanguageSwitcher className="bg-slate-800/80 border-slate-700" />
        </div>

        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Workforce CRM</h1>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "hi"
                  ? "हाज़िरी, टास्क, ऑर्डर्स और पेरोल कंट्रोल पोर्टल"
                  : "Field Operations, Attendance & Dispatch Control"}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle size={16} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {lang === "hi" ? "कर्मचारी कोड / ईमेल आईडी" : "Employee Code / Email"}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="E001 or admin@crm.com"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === "hi" ? "पासवर्ड" : "Password"}
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Emp@2026 / admin123</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? "Verifying..." : lang === "hi" ? "लॉगिन करें" : "Sign In to Workspace"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Login Test Chips */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === "hi" ? "त्वरित परीक्षण लॉगिन (Quick Test)" : "Quick Test Access"}
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@crm.com", "admin123")}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 text-center font-medium transition-colors"
              >
                <span className="block font-bold text-blue-400">Admin</span>
                <span className="text-[9px] text-slate-500 font-mono">admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("E001", "Emp@2026")}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 text-center font-medium transition-colors"
              >
                <span className="block font-bold text-emerald-400">E001 (Bharat)</span>
                <span className="text-[9px] text-slate-500 font-mono">Emp@2026</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("EMP002", "Emp@2026")}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 text-center font-medium transition-colors"
              >
                <span className="block font-bold text-purple-400">EMP002 (Priya)</span>
                <span className="text-[9px] text-slate-500 font-mono">Emp@2026</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck size={14} />
              <span>Multi-Device Sync Active</span>
            </div>
            <span>v2.4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
