"use client";

import React, { useState } from "react";
import {
  Shield,
  Plus,
  Check,
  Search,
  Lock,
  CheckCircle2,
  Users,
  Settings,
  Save,
  Trash2,
  X,
  AlertTriangle,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface PermissionDef {
  code: string;
  name: string;
  description: string;
}

interface PermissionCategory {
  id: string;
  category: string;
  icon: string;
  description: string;
  permissions: PermissionDef[];
}

const PERMISSION_MODULES: PermissionCategory[] = [
  {
    id: "attendance",
    category: "Attendance & Geofencing",
    icon: "🕒",
    description: "Check-in verification, geofence validations, manual overrides and shop QR management",
    permissions: [
      { code: "attendance.checkin.self", name: "Self Check-in & Break", description: "Allow employee to perform daily GPS/QR check-in, breaks and checkout" },
      { code: "attendance.read.all", name: "View All Attendance Records", description: "Monitor live workforce presence, timestamps and location fixes" },
      { code: "attendance.override", name: "Manual Attendance Override", description: "Edit hours, punch times, and day classifications manually" },
      { code: "attendance.qr.generate", name: "Generate Shop QR Codes", description: "Display and rotate dynamic cryptographic shop QR tokens" },
      { code: "attendance.corrections.approve", name: "Approve Correction Requests", description: "Review and approve employee missed punch correction requests" },
    ],
  },
  {
    id: "orders",
    category: "Orders & Delivery Pool",
    icon: "📦",
    description: "Order broadcast engine, atomic pool claiming, packing and proof-of-delivery",
    permissions: [
      { code: "orders.read.self", name: "View Claimed Orders", description: "View orders assigned to or claimed by the user" },
      { code: "orders.read.all", name: "View Full Order Queue", description: "Monitor broadcasted pool, packing stages, and delivery statuses" },
      { code: "orders.claim", name: "Claim Broadcasted Orders", description: "Atomically lock and claim available orders from the queue" },
      { code: "orders.broadcast", name: "Register & Broadcast Orders", description: "Create new customer orders and broadcast to active employees" },
      { code: "orders.edit", name: "Modify & Update Orders", description: "Update items count, parchi receipts, customer notes, or reassign" },
      { code: "orders.pod.verify", name: "Verify Proof of Delivery (POD)", description: "Review customer delivery signature and parcel handover photos" },
    ],
  },
  {
    id: "tasks",
    category: "Task Management & Review",
    icon: "📋",
    description: "Multi-employee task assignment, proof uploads and review workflows",
    permissions: [
      { code: "tasks.read.self", name: "View Assigned Tasks", description: "See tasks assigned to current user with deadlines" },
      { code: "tasks.submit.self", name: "Submit Completed Tasks", description: "Upload proof/photos and mark tasks as submitted for review" },
      { code: "tasks.create", name: "Create & Assign Tasks", description: "Create operational tasks and assign to individuals or teams" },
      { code: "tasks.review", name: "Review & Approve Submissions", description: "Accept proof submissions or request task revisions" },
      { code: "tasks.delete", name: "Archive & Delete Tasks", description: "Remove closed tasks from active project lists" },
    ],
  },
  {
    id: "leaves",
    category: "Leave Management & Entitlements",
    icon: "🏖️",
    description: "Leave application queue, half-day entitlements, and balance tracking",
    permissions: [
      { code: "leaves.apply.self", name: "Apply For Leave", description: "Submit casual, sick, or emergency leave requests" },
      { code: "leaves.read.all", name: "View Workforce Leave Queue", description: "Inspect calendar leave schedules and active team requests" },
      { code: "leaves.approve", name: "Approve & Reject Leaves", description: "Authorize leave applications with formal balance deduction" },
      { code: "leaves.balance.adjust", name: "Adjust Entitlement Quotas", description: "Manually credit or debit annual leave days for staff" },
    ],
  },
  {
    id: "ledger_payroll",
    category: "Financial Ledger & Payroll",
    icon: "💰",
    description: "Double-entry advance ledgers, salary calculations and payout approvals",
    permissions: [
      { code: "ledger.read.self", name: "View Personal Balance & Advances", description: "Check own advance disbursements and salary slips" },
      { code: "ledger.read.all", name: "View Master Financial Ledger", description: "View all double-entry advance, repayment and bonus logs" },
      { code: "ledger.post_entry", name: "Post Financial Entries", description: "Record cash advances, repayments, penalties, and reimbursements" },
      { code: "payroll.run", name: "Generate Payroll Runs", description: "Compute monthly net pay based on worked hours and deductions" },
      { code: "payroll.approve", name: "Approve & Finalize Payslips", description: "Lock monthly payroll records and generate downloadable slips" },
    ],
  },
  {
    id: "admin_settings",
    category: "Employees, System & RBAC",
    icon: "⚙️",
    description: "Employee records, custom role definition and business rule parameters",
    permissions: [
      { code: "employees.create", name: "Create New Employees", description: "Register new staff members with department and compensation" },
      { code: "employees.edit", name: "Modify Employee Profiles", description: "Update banking, designation, base salary and credentials" },
      { code: "roles.manage", name: "Manage Roles & Permissions", description: "Create custom roles and toggle access permission matrices" },
      { code: "settings.modify", name: "Configure Business Settings", description: "Tune geofence coordinates, shift hours, grace periods & tolerances" },
    ],
  },
];

interface RoleItem {
  id: string;
  name: string;
  description: string;
  isAdmin: boolean;
  usersCount: number;
  permissions: string[];
}

const initialRoles: RoleItem[] = [
  {
    id: "1",
    name: "ADMIN",
    description: "Super Administrator with full, unrestricted authority across all operations, financial ledgers, and configurations.",
    isAdmin: true,
    usersCount: 1,
    permissions: ["*"],
  },
  {
    id: "2",
    name: "SUPERVISOR",
    description: "Shift operations lead responsible for monitoring attendance, assigning operational tasks, broadcasting orders, and approving leaves.",
    isAdmin: false,
    usersCount: 3,
    permissions: [
      "attendance.read.all",
      "attendance.qr.generate",
      "attendance.corrections.approve",
      "orders.read.all",
      "orders.broadcast",
      "orders.edit",
      "tasks.create",
      "tasks.review",
      "leaves.read.all",
      "leaves.approve",
    ],
  },
  {
    id: "3",
    name: "EMPLOYEE",
    description: "Standard field and shop floor workforce member with self-service attendance, order pool claiming, and task execution.",
    isAdmin: false,
    usersCount: 18,
    permissions: [
      "attendance.checkin.self",
      "orders.claim",
      "orders.read.self",
      "tasks.read.self",
      "tasks.submit.self",
      "leaves.apply.self",
      "ledger.read.self",
    ],
  },
  {
    id: "4",
    name: "ACCOUNTS_LEAD",
    description: "Finance and accounts officer handling double-entry advance disbursements, bonus postings, and monthly payroll processing.",
    isAdmin: false,
    usersCount: 2,
    permissions: [
      "attendance.read.all",
      "ledger.read.all",
      "ledger.post_entry",
      "payroll.run",
      "payroll.approve",
      "leaves.read.all",
    ],
  },
  {
    id: "5",
    name: "DISPATCH_MANAGER",
    description: "Logistics coordinator focused on customer order intake, dispatching, driver assignment, and delivery proof verification.",
    isAdmin: false,
    usersCount: 2,
    permissions: [
      "orders.read.all",
      "orders.broadcast",
      "orders.edit",
      "orders.pod.verify",
      "attendance.read.all",
    ],
  },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("2"); // Default to Supervisor to show interactive toggles
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Role Modal
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const togglePermission = (permissionCode: string) => {
    if (selectedRole.isAdmin) return; // Admin has all immutable

    const currentPerms = selectedRole.permissions;
    const hasPerm = currentPerms.includes(permissionCode);
    const updatedPerms = hasPerm
      ? currentPerms.filter((p) => p !== permissionCode)
      : [...currentPerms, permissionCode];

    const updatedRoles = roles.map((r) =>
      r.id === selectedRole.id ? { ...r, permissions: updatedPerms } : r
    );

    setRoles(updatedRoles);
  };

  const toggleModuleAll = (module: PermissionCategory) => {
    if (selectedRole.isAdmin) return;

    const moduleCodes = module.permissions.map((p) => p.code);
    const hasAll = moduleCodes.every((code) => selectedRole.permissions.includes(code));

    let updatedPerms: string[];
    if (hasAll) {
      // Remove all in this module
      updatedPerms = selectedRole.permissions.filter((code) => !moduleCodes.includes(code));
    } else {
      // Add all missing in this module
      const toAdd = moduleCodes.filter((code) => !selectedRole.permissions.includes(code));
      updatedPerms = [...selectedRole.permissions, ...toAdd];
    }

    const updatedRoles = roles.map((r) =>
      r.id === selectedRole.id ? { ...r, permissions: updatedPerms } : r
    );
    setRoles(updatedRoles);
  };

  const handleSaveRole = () => {
    showToast(`Permissions updated & saved for ${selectedRole.name} role!`);
  };

  const handleCreateNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const newRole: RoleItem = {
      id: String(Date.now()),
      name: newRoleName.trim().toUpperCase().replace(/\s+/g, "_"),
      description: newRoleDescription.trim() || "Custom workspace operational role",
      isAdmin: false,
      usersCount: 0,
      permissions: ["attendance.checkin.self", "tasks.read.self"],
    };

    setRoles([...roles, newRole]);
    setSelectedRoleId(newRole.id);
    setShowAddRoleModal(false);
    setNewRoleName("");
    setNewRoleDescription("");
    showToast(`Custom role ${newRole.name} created! Configure its permissions below.`);
  };

  const handleDeleteRole = (roleId: string) => {
    if (roleId === "1") return;
    const updated = roles.filter((r) => r.id !== roleId);
    setRoles(updated);
    setSelectedRoleId(updated[0].id);
    showToast("Role removed successfully");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Roles & Permissions Matrix</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC) engine. Select a role to toggle granular permission access.
          </p>
        </div>
        <button
          onClick={() => setShowAddRoleModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Create Custom Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Roles Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            System & Custom Roles ({roles.length})
          </div>
          {roles.map((role) => {
            const isSelected = selectedRole.id === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`group bg-white border rounded-2xl p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 shadow-md ring-2 ring-blue-500/20 bg-blue-50/10"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                        role.isAdmin
                          ? "bg-purple-100 text-purple-700"
                          : isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {role.isAdmin ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        {role.name}
                        {role.isAdmin && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            ROOT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    {role.usersCount} users
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                  {role.description}
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">
                    {role.isAdmin
                      ? "All 56 Permissions Active"
                      : `${role.permissions.length} permissions granted`}
                  </span>
                  <span className="text-[#1a73e8] font-bold group-hover:translate-x-0.5 transition-transform">
                    Configure →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Permission Matrix */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          {/* Active Role Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  Configuring Role
                </span>
                {selectedRole.isAdmin && (
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Immutable Root
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedRole.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xl">{selectedRole.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {!selectedRole.isAdmin && (
                <button
                  onClick={handleSaveRole}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Permissions
                </button>
              )}
              {!selectedRole.isAdmin && !["SUPERVISOR", "EMPLOYEE"].includes(selectedRole.name) && (
                <button
                  onClick={() => handleDeleteRole(selectedRole.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Custom Role"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Root Admin Notice if applicable */}
          {selectedRole.isAdmin ? (
            <div className="bg-purple-50/80 border border-purple-200/70 rounded-2xl p-5 text-purple-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Shield className="w-5 h-5 text-purple-600 shrink-0" />
                Full Administrative Super-Access Granted
              </div>
              <p className="text-xs text-purple-700 leading-relaxed">
                The <strong>ADMIN</strong> role holds global wildcard bypass (<code>*</code>). All 56 system permissions across Geofence verification, Order claiming, Task reviews, Financial ledgers, and Payroll runs are permanently active.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Permission Categories & Granular Access
                </span>
                <span className="text-xs font-semibold text-blue-600">
                  {selectedRole.permissions.length} permissions active for {selectedRole.name}
                </span>
              </div>

              {/* Modules Accordion / Groups */}
              <div className="space-y-4">
                {PERMISSION_MODULES.map((module) => {
                  const moduleCodes = module.permissions.map((p) => p.code);
                  const activeCount = moduleCodes.filter((c) => selectedRole.permissions.includes(c)).length;
                  const isAllActive = activeCount === moduleCodes.length;

                  return (
                    <div
                      key={module.id}
                      className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/40"
                    >
                      {/* Module Header with Quick Toggle All */}
                      <div className="bg-white p-4 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{module.icon}</span>
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                              {module.category}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isAllActive
                                    ? "bg-emerald-100 text-emerald-800"
                                    : activeCount > 0
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {activeCount} / {moduleCodes.length} Active
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{module.description}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleModuleAll(module)}
                          className="text-xs font-bold text-[#1a73e8] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {isAllActive ? "Revoke All" : "Grant All"}
                        </button>
                      </div>

                      {/* Granular Permission Toggles */}
                      <div className="divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
                        {module.permissions.map((perm) => {
                          const isGranted = selectedRole.permissions.includes(perm.code);
                          return (
                            <div
                              key={perm.code}
                              onClick={() => togglePermission(perm.code)}
                              className={`flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all ${
                                isGranted
                                  ? "bg-white border border-blue-100 shadow-2xs"
                                  : "hover:bg-white/80 border border-transparent"
                              }`}
                            >
                              <div className="space-y-0.5 pr-4">
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                  {perm.name}
                                  <code className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {perm.code}
                                  </code>
                                </div>
                                <p className="text-[11px] text-slate-500">{perm.description}</p>
                              </div>

                              {/* Interactive Switch Toggle */}
                              <div
                                className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                                  isGranted ? "bg-[#1a73e8]" : "bg-slate-200"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                    isGranted ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CUSTOM ROLE MODAL */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Custom Role</h3>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewRole} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INVENTORY_AUDITOR, CASHIER"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Role Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe duties and system access scope..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create & Configure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
