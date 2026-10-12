"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowLeft,
  MapPin,
  Camera,
  Lock,
  FileText,
  Clock,
  CheckCircle2,
  Database,
  Building,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
            <ShieldCheck size={14} />
            <span>DPDP & Workforce Privacy Standard</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Title Section */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-bold block">
            Workforce CRM • Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Privacy Policy & Data Security
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            This document outlines how Workforce CRM collects, safeguards, and processes operational workforce data, including GPS geofence verifications, attendance logs, and financial records.
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Last Updated: October 2026 • Effective for all mobile PWA and administrative portals.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">Bounded Geofencing</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              GPS location is evaluated only during shift check-in against the shop perimeter. Continuous background tracking is never enabled.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">Ephemeral Camera Use</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Camera access is strictly utilized on-device for optical QR code verification and proof-of-delivery parcel photo confirmation.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">Encrypted Cloud Sync</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              All financial ledger transactions, advance authorizations, and payroll entries are synchronized over secure TLS 1.3 encrypted endpoints.
            </p>
          </div>
        </div>

        {/* Deep Clauses */}
        <div className="space-y-8 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-mono">1</span>
              Workforce Data We Collect
            </h2>
            <p>
              To maintain accurate store operations and lawful payroll calculations, the system processes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400 pl-2">
              <li><strong>Staff Profile:</strong> Name, assigned employee code, designation, department, contact number, and bank/UPI details for payroll disbursement.</li>
              <li><strong>Attendance & Shifts:</strong> Check-in time, check-out time, break durations, calculated worked hours, and overtime records.</li>
              <li><strong>Location Data:</strong> Device coordinate accuracy distance calculated strictly at the moment of QR attendance punch against shop coordinates.</li>
              <li><strong>Operational Tasks & Orders:</strong> Delivery claims, task submissions, proof of fulfillment photos, and supervisor remarks.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 border-t border-slate-800/80 pt-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs flex items-center justify-center font-mono">2</span>
              Financial & Payroll Ledger Policy
            </h2>
            <p>
              All advance disbursements, deductions, overtime compensation, and net salary calculations are computed algorithmically based on verifiable attendance and approved supervisor authorizations. Ledger entries are recorded immutably to prevent retroactive alterations without administrative audit logging.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 border-t border-slate-800/80 pt-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-mono">3</span>
              Role-Based Access Control (RBAC)
            </h2>
            <p>
              Administrative records, master ledgers, and global settings are accessible only to authorized administrators with verified credentials. Individual staff members may inspect only their personal attendance history, assigned tasks, and advance statements.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 border-t border-slate-800/80 pt-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-600/20 text-amber-400 text-xs flex items-center justify-center font-mono">4</span>
              Data Retention & Deletion
            </h2>
            <p>
              Workforce records are maintained for audit, taxation, and labor accounting compliance. Inactive employee profiles may be deactivated by the administrator; historical ledger vouchers remain preserved for accounting integrity.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Workforce CRM. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Login Portal
            </Link>
            <Link href="/admin" className="hover:text-slate-300 transition-colors">
              Admin Workspace
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
