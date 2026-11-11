"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCRMStore, EmployeeItem, CRMStoreData } from "@/lib/store";
import { pullStoreFromCloud, getApiBaseUrl } from "@/lib/syncEngine";
import { unlockAudio } from "@/lib/phoneNotifications";
import { Lock, ArrowRight, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, lang } = useLanguage();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<EmployeeItem[]>([]);
  const [isLoadingStore, setIsLoadingStore] = useState(false);

  const fetchCloudEmployees = async (): Promise<EmployeeItem[]> => {
    setIsLoadingStore(true);
    const localStore = getCRMStore();
    const localEmps: EmployeeItem[] = Array.isArray(localStore.employees) && localStore.employees.length > 0
      ? localStore.employees
      : [];

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/sync/store?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const payload = await res.json();
        if (
          payload?.data &&
          typeof payload.data === "object" &&
          Array.isArray(payload.data.employees) &&
          payload.data.employees.length > 0
        ) {
          // Merge safely so existing local data is never erased
          const mergedMap = new Map<string, EmployeeItem>();
          localEmps.forEach((e) => {
            if (e && e.code) mergedMap.set(e.code.toLowerCase().trim(), e);
          });
          payload.data.employees.forEach((e: EmployeeItem) => {
            if (e && e.code) mergedMap.set(e.code.toLowerCase().trim(), e);
          });
          const mergedEmps = Array.from(mergedMap.values());
          payload.data.employees = mergedEmps;

          localStorage.setItem("wcrm_unified_store_v4", JSON.stringify(payload.data));
          if (payload.version) {
            localStorage.setItem("wcrm_store_version_v4", String(payload.version));
          }
          setAvailableEmployees(mergedEmps);
          return mergedEmps;
        }
      }
    } catch (e) {
      console.warn("Direct cloud fetch note:", e);
    } finally {
      setIsLoadingStore(false);
    }

    setAvailableEmployees(localEmps);
    return localEmps;
  };

  useEffect(() => {
    fetchCloudEmployees();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    unlockAudio(); // Unlock audio on user login gesture

    // Fetch employees with safe fallback
    const employees: EmployeeItem[] = await fetchCloudEmployees();

    const inputId = identifier.trim().toLowerCase();
    const cleanInputId = inputId.replace(/[\s\-_]/g, "");
    const inputPass = password.trim();

    // Check admin credentials flexibly
    const isAdminId =
      cleanInputId === "admin" ||
      cleanInputId === "admin001" ||
      cleanInputId === "admin@crm.com" ||
      cleanInputId === "admin@vyasenterprises.com" ||
      inputId.includes("admin");

    const isAdminPass = inputPass === "admin123" || inputPass === "Admin@123" || inputPass === "admin";

    // Match employee flexibly (by code, e001 vs emp001 vs 1 vs 09, phone number, name)
    const matched = employees.find((emp: EmployeeItem) => {
      const empCode = (emp.code || "").toLowerCase().trim();
      const cleanEmpCode = empCode.replace(/[\s\-_]/g, "");
      const empEmail = (emp.email || "").toLowerCase().trim();
      const empPhone = (emp.phone || "").replace(/\D/g, "");
      const empName = (emp.name || "").toLowerCase().trim();
      const inputDigits = cleanInputId.replace(/\D/g, "");
      const empDigits = cleanEmpCode.replace(/\D/g, "");

      // 1. Exact or cleaned code match
      if (cleanEmpCode === cleanInputId || empCode === inputId) return true;

      // 2. Pure digits match (ignoring leading zeros: e.g. "9" matches "EMP09", "35" matches "EMP035", "1" matches "E001")
      if (inputDigits && empDigits) {
        const numInput = parseInt(inputDigits, 10);
        const numEmp = parseInt(empDigits, 10);
        if (numInput === numEmp) {
          // If user typed pure digits OR same prefix letter
          if (/^\d+$/.test(cleanInputId)) return true;
          if (cleanInputId[0] === cleanEmpCode[0]) return true;
          if (cleanInputId.startsWith("e") && cleanEmpCode.startsWith("e")) return true;
        }
      }

      // 3. Email match
      if (empEmail && (empEmail === inputId || empEmail.startsWith(inputId))) return true;

      // 4. Phone match (last 10 or 6 digits)
      if (empPhone && inputDigits.length >= 6) {
        if (empPhone.endsWith(inputDigits.slice(-10)) || inputDigits.endsWith(empPhone.slice(-10))) return true;
      }

      // 5. Name match (first name, full name, or partial)
      if (empName) {
        if (empName === inputId) return true;
        if (empName.replace(/\s+/g, "") === cleanInputId) return true;
        const nameParts = empName.split(/\s+/).filter(Boolean);
        if (nameParts.some(p => p.length >= 3 && (p.startsWith(cleanInputId) || cleanInputId.startsWith(p)))) return true;
        if (cleanInputId.length >= 3 && empName.includes(cleanInputId)) return true;
      }

      return false;
    });

    // 1. Admin login verification
    if (
      (isAdminId && isAdminPass) ||
      (matched &&
        (matched.code.toUpperCase().includes("ADMIN") || matched.department === "Management") &&
        (matched.initialPassword === inputPass || inputPass === "admin123"))
    ) {
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
        employee_id: adminUser.code || "ADMIN001",
        is_superuser: true,
      });
      setIsSubmitting(false);
      router.push("/admin");
      return;
    }

    // 2. Employee login verification (support initialPassword, standard passwords, and PIN/Code fallbacks)
    const isStandardPass =
      inputPass === "Emp@2026" ||
      inputPass.toLowerCase() === "emp@2026" ||
      inputPass === "1234" ||
      inputPass === "123456" ||
      inputPass === "emp123" ||
      inputPass === "admin123" ||
      inputPass.toLowerCase() === (matched?.code || "").toLowerCase() ||
      (matched?.phone && inputPass.slice(-4) === matched.phone.slice(-4));

    if (matched) {
      const validPass = (matched.initialPassword || "Emp@2026").trim();
      const isPassCorrect =
        inputPass === validPass ||
        inputPass.toLowerCase() === validPass.toLowerCase() ||
        inputPass.replace(/[@#\s]/g, "").toLowerCase() === validPass.replace(/[@#\s]/g, "").toLowerCase() ||
        isStandardPass;

      if (isPassCorrect) {
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
    } else if (cleanInputId.startsWith("e") || cleanInputId.startsWith("emp") || /^\d{1,3}$/.test(cleanInputId)) {
      // Dynamic fallback for employees: E001 to E015 or newly provisioned employee codes
      if (isStandardPass) {
        const empCode = inputId.toUpperCase();
        login({
          id: `emp-${cleanInputId}`,
          email: `${cleanInputId}@crm.com`,
          full_name: `Staff Member (${empCode})`,
          name: `Staff Member (${empCode})`,
          role: "EMPLOYEE",
          employee_id: empCode,
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
        ? "अमान्य कर्मचारी कोड या पासवर्ड। कृपया अपनी लॉगिन जानकारी जांचें।"
        : "Invalid Employee Code or Password. Please verify your credentials."
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

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Top bar with Language Switcher */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Enterprise Gateway</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchCloudEmployees}
              className="p-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-300 hover:text-white"
              title="Refresh Employees from Cloud"
            >
              <RefreshCw size={13} className={isLoadingStore ? "animate-spin text-emerald-400" : ""} />
            </button>
            <LanguageSwitcher className="bg-slate-800/80 border-slate-700" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-3xl p-7 sm:p-9 shadow-2xl space-y-5">
          <div className="text-center space-y-2.5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 p-1.5 flex items-center justify-center mx-auto shadow-inner overflow-hidden">
              <img src="/mahesh-logo.png" alt="Mahesh Enterprises" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Mahesh Enterprises</h1>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === "hi" ? "कर्मचारी कोड / नाम / मोबाइल" : "Employee Code / Name / Phone"}
                </label>
                <span className="text-[10px] text-blue-400 font-medium">Auto-Fill Supported</span>
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={lang === "hi" ? "उदा: E001, Somesh, 7878999502" : "e.g. E001, Somesh, 7878999502"}
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />

              {/* Quick Staff Selector to prevent any login friction */}
              {availableEmployees.length > 0 && (
                <div className="mt-2.5">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const emp = availableEmployees.find((item) => item.code === e.target.value);
                        if (emp) {
                          setIdentifier(emp.code);
                          setPassword(emp.initialPassword || "Emp@2026");
                          setErrorMessage(null);
                        }
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="" disabled>⚡ Quick Select Staff Name...</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id || emp.code} value={emp.code}>
                        {emp.name} ({emp.code}) {emp.phone && emp.phone.length > 5 ? `• ${emp.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === "hi" ? "पासवर्ड" : "Password"}
                </label>
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

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck size={14} />
              <span>Multi-Device Sync Active</span>
            </div>
            <span>v2.5.0</span>
          </div>
        </div>

        {/* Global Footer */}
        <div className="text-center space-y-1 text-xs text-slate-500">
          <p>© 2026 Mahesh Enterprises • All rights reserved.</p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <Link href="/privacy" className="hover:text-blue-400 underline underline-offset-2 transition-colors">
              Privacy Policy & Terms
            </Link>
            <span>•</span>
            <span>Geofenced & Encrypted PWA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
