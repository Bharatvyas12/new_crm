"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  X,
  User,
  Phone,
  Mail,
  Building,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  Shield,
  CreditCard,
  Key,
  Trash2,
  Check,
  UserCheck,
  UserX,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  getCRMStore,
  saveCRMStore,
  subscribeToCRMStore,
  EmployeeItem,
} from "@/lib/store";

export const DEPARTMENTS = [
  "Sales",
  "Accounts",
  "Operations",
  "Warehouse",
  "Packaging",
  "Logistics",
  "Delivery",
  "Management",
  "Quality",
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("Any");
  const [deptFilter, setDeptFilter] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");

  const loadEmployees = () => {
    const store = getCRMStore();
    setEmployees(store.employees || []);
  };

  useEffect(() => {
    loadEmployees();
    const unsubscribe = subscribeToCRMStore(loadEmployees);
    return () => unsubscribe();
  }, []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<EmployeeItem>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add Employee with Password Setup
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    department: "Operations",
    designation: "",
    type: "Full Time",
    initialPassword: "Emp@2026",
    baseSalary: "28000",
    bankAccount: "",
    bankIfsc: "",
    upiId: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClearFilters = () => {
    setStatusFilter("Any");
    setDeptFilter("All");
    setSearchFilter("");
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email || !newEmployee.department) {
      alert("Please fill in Name, Email and select a Department (compulsory)!");
      return;
    }

    const assignedCode = newEmployee.code.trim().toUpperCase() || `EMP${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const item: EmployeeItem = {
      id: String(Date.now()),
      code: assignedCode,
      name: newEmployee.name.trim(),
      email: newEmployee.email.trim(),
      department: newEmployee.department,
      designation: newEmployee.designation.trim() || "Staff",
      type: newEmployee.type,
      status: "Active",
      joined: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      phone: newEmployee.phone.trim() || "—",
      initialPassword: newEmployee.initialPassword.trim() || "Emp@2026",
      baseSalary: Number(newEmployee.baseSalary) || 0,
      bankAccount: newEmployee.bankAccount.trim(),
      bankIfsc: newEmployee.bankIfsc.trim(),
      upiId: newEmployee.upiId.trim(),
      casualLeaves: 12,
      sickLeaves: 8,
    };

    const store = getCRMStore();
    const updatedEmployees = [item, ...(store.employees || []).filter((e) => e.code !== item.code)];
    store.employees = updatedEmployees;
    saveCRMStore(store);
    setEmployees(updatedEmployees);
    setShowAddModal(false);
    showToast(`✓ Employee "${item.name}" (${item.code}) registered & synced to cloud! Password: "${item.initialPassword}"`);
    setNewEmployee({
      name: "",
      code: "",
      email: "",
      phone: "",
      department: "Operations",
      designation: "",
      type: "Full Time",
      initialPassword: "Emp@2026",
      baseSalary: "28000",
      bankAccount: "",
      bankIfsc: "",
      upiId: "",
    });
  };

  const handleQuickAddBharatVyas = () => {
    const item: EmployeeItem = {
      id: "2",
      code: "E001",
      name: "Bharat vyas",
      email: "bharat1@crm.com",
      department: "Operations",
      designation: "Supervisor",
      type: "Full Time",
      status: "Active",
      joined: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      phone: "08005567626",
      initialPassword: "Emp@2026",
      baseSalary: 35000,
      bankAccount: "112233445566",
      bankIfsc: "SBIN0004321",
      upiId: "bharat@oksbi",
      casualLeaves: 12,
      sickLeaves: 8,
    };
    const store = getCRMStore();
    const updatedEmployees = [item, ...(store.employees || []).filter((e) => e.code !== "E001")];
    store.employees = updatedEmployees;
    saveCRMStore(store);
    setEmployees(updatedEmployees);
    showToast(`✓ Bharat vyas (E001) registered and synced to cloud!`);
  };

  const openEmployeeDetails = (emp: EmployeeItem) => {
    setSelectedEmployee(emp);
    setEditFormData(emp);
    setIsEditMode(false);
  };

  const handleSaveEmployeeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const updated = {
      ...selectedEmployee,
      ...editFormData,
    } as EmployeeItem;

    const store = getCRMStore();
    const updatedEmployees = (store.employees || []).map((emp) => (emp.id === updated.id ? updated : emp));
    store.employees = updatedEmployees;
    saveCRMStore(store);
    setEmployees(updatedEmployees);
    setSelectedEmployee(updated);
    setIsEditMode(false);
    showToast(`✓ Employee profile for ${updated.name} (${updated.code}) updated & saved to cloud!`);
  };

  const toggleEmployeeStatus = (emp: EmployeeItem) => {
    const newStatus = emp.status === "Active" ? "Inactive" : "Active";
    const updated = { ...emp, status: newStatus as "Active" | "Inactive" };
    const store = getCRMStore();
    const updatedEmployees = (store.employees || []).map((e) => (e.id === emp.id ? updated : e));
    store.employees = updatedEmployees;
    saveCRMStore(store);
    setEmployees(updatedEmployees);
    if (selectedEmployee?.id === emp.id) {
      setSelectedEmployee(updated);
      setEditFormData(updated);
    }
    showToast(`Status for ${emp.name} set to ${newStatus}`);
  };

  const handleDeleteEmployee = (emp: EmployeeItem) => {
    if (!confirm(`Are you sure you want to remove employee "${emp.name}" (${emp.code})? This will delete the account from the cloud.`)) return;
    const store = getCRMStore();
    const updatedEmployees = (store.employees || []).filter((e) => e.id !== emp.id && e.code !== emp.code);
    store.employees = updatedEmployees;
    saveCRMStore(store);
    setEmployees(updatedEmployees);
    if (selectedEmployee?.id === emp.id) {
      setSelectedEmployee(null);
    }
    showToast(`✓ Employee "${emp.name}" removed from cloud.`);
  };

  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter !== "Any" && emp.status !== statusFilter) {
      return false;
    }
    if (deptFilter !== "All" && emp.department.toLowerCase() !== deptFilter.toLowerCase()) {
      return false;
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const match =
        emp.name.toLowerCase().includes(q) ||
        emp.code.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage staff by department, assign initial passwords, modify profiles and track active status.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {!employees.some((e) => e.code === "E001") && (
            <button
              onClick={handleQuickAddBharatVyas}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Add supervisor Bharat vyas (E001) for instant phone login"
            >
              <Sparkles size={14} />
              <span>+ Add Bharat Vyas (E001)</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={18} />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* Department Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setDeptFilter("All")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            deptFilter === "All"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
          }`}
        >
          All Departments ({employees.length})
        </button>
        {DEPARTMENTS.map((dept) => {
          const count = employees.filter((e) => e.department.toLowerCase() === dept.toLowerCase()).length;
          return (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                deptFilter.toLowerCase() === dept.toLowerCase()
                  ? "bg-[#1a73e8] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {dept} ({count})
            </button>
          );
        })}
      </div>

      {/* Filter Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Department Filter */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="Any">Any Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Search */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, code, phone, role..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Actions */}
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className="w-full px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Code</th>
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Designation</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Base Salary</th>
                <th className="py-3.5 px-5">Initial Creds</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  onClick={() => openEmployeeDetails(emp)}
                >
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-[#1a73e8] hover:underline font-mono text-xs">
                      {emp.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-xs text-slate-400">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      {emp.department}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-700">{emp.designation}</td>
                  <td className="py-3.5 px-5 text-slate-600 text-xs">{emp.type}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        emp.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          emp.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-800">
                    ₹{emp.baseSalary ? emp.baseSalary.toLocaleString() : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 text-xs font-mono">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {emp.initialPassword || "Emp@2026"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          openEmployeeDetails(emp);
                          setIsEditMode(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Employee"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleEmployeeStatus(emp)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          emp.status === "Active"
                            ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={emp.status === "Active" ? "Deactivate" : "Activate"}
                      >
                        {emp.status === "Active" ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No employees found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL (Department + Password Setup) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add New Employee</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create staff profile with department and initial login password.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Employee Code <span className="text-slate-400 font-normal">(e.g. E001 or leave blank)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. E001"
                    value={newEmployee.code}
                    onChange={(e) => setNewEmployee({ ...newEmployee, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase font-semibold"
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@crm.com"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                {/* DEPARTMENT (MANDATORY) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-700 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> Department (Compulsory) *
                  </label>
                  <select
                    required
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INITIAL PASSWORD (ADMIN SETS THIS) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Initial Password (Set by Admin) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emp@2026"
                    value={newEmployee.initialPassword}
                    onChange={(e) => setNewEmployee({ ...newEmployee, initialPassword: e.target.value })}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Executive, Cashier, Driver"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Employment Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Employment Type</label>
                  <select
                    value={newEmployee.type}
                    onChange={(e) => setNewEmployee({ ...newEmployee, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                {/* Base Salary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Monthly Base Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={newEmployee.baseSalary}
                    onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Password notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                🔒 <strong>Initial Login:</strong> Employee logs in with this password initially, and can change it anytime from their profile settings.
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save & Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE DETAILS & EDIT MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {selectedEmployee.code}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        selectedEmployee.status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {selectedEmployee.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedEmployee.name}</h2>
                  <p className="text-xs text-slate-500">
                    {selectedEmployee.designation} • {selectedEmployee.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditMode ? (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* VIEW MODE */}
            {!isEditMode ? (
              <div className="space-y-6 pt-5">
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/75 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{selectedEmployee.phone}</div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{selectedEmployee.email}</div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joined Date</span>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{selectedEmployee.joined}</div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employment Type</span>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{selectedEmployee.type}</div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Base Salary</span>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      ₹{selectedEmployee.baseSalary ? selectedEmployee.baseSalary.toLocaleString() : "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Initial / Active Password</span>
                    <div className="text-sm font-mono font-bold text-indigo-700 mt-0.5 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                      {selectedEmployee.initialPassword || "Emp@2026"}
                    </div>
                  </div>
                </div>

                {/* Banking */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Banking & Payout Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Bank A/C</span>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                        {selectedEmployee.bankAccount || "Not Provided"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</span>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                        {selectedEmployee.bankIfsc || "Not Provided"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">UPI ID</span>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                        {selectedEmployee.upiId || "Not Provided"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => toggleEmployeeStatus(selectedEmployee)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedEmployee.status === "Active"
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {selectedEmployee.status === "Active" ? "Deactivate Account" : "Activate Account"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        showToast(`Temporary password reset: "Emp@2026" sent to ${selectedEmployee.email}`);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleSaveEmployeeEdit} className="space-y-4 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-medium"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-700">Department (Mandatory) *</label>
                    <select
                      required
                      value={editFormData.department || "Sales"}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:bg-white"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-700">Password</label>
                    <input
                      type="text"
                      value={editFormData.initialPassword || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, initialPassword: e.target.value })}
                      className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:bg-white"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Designation</label>
                    <input
                      type="text"
                      value={editFormData.designation || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-medium"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Phone</label>
                    <input
                      type="tel"
                      value={editFormData.phone || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-medium"
                    />
                  </div>

                  {/* Monthly Base Salary */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Monthly Base Salary (₹)</label>
                    <input
                      type="number"
                      value={editFormData.baseSalary || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, baseSalary: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-mono font-medium"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Status</label>
                    <select
                      value={editFormData.status || "Active"}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as "Active" | "Inactive" })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white font-medium"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
