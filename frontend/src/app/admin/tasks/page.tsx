"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, CheckSquare, FileText, X, Clock, User, AlertCircle, CheckCircle2 } from "lucide-react";

import {
  getCRMStore,
  createTaskInStore,
  updateTaskStatusInStore,
  deleteTaskInStore,
  subscribeToCRMStore,
  TaskItem,
  EmployeeItem,
} from "@/lib/store";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("Any");
  const [priorityFilter, setPriorityFilter] = useState("Any");
  const [searchFilter, setSearchFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    status: "Any",
    priority: "Any",
    search: "",
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Sync with unified store across all tabs and windows
  React.useEffect(() => {
    const loadTasks = () => {
      const store = getCRMStore();
      setTasks(store.tasks || []);
      setEmployees(store.employees || []);
    };
    loadTasks();
    const unsubscribe = subscribeToCRMStore(loadTasks);
    return () => unsubscribe();
  }, []);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Normal" as "Normal" | "High" | "Urgent",
    due: "",
    assignee: "Bharat vyas",
  });

  const handleApply = () => {
    setAppliedFilters({
      status: statusFilter,
      priority: priorityFilter,
      search: searchFilter,
    });
  };

  const handleClear = () => {
    setStatusFilter("Any");
    setPriorityFilter("Any");
    setSearchFilter("");
    setAppliedFilters({
      status: "Any",
      priority: "Any",
      search: "",
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    createTaskInStore({
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      priority: newTask.priority,
      due: newTask.due.trim() || "-",
      assignee: newTask.assignee || "Bharat vyas",
      assigneeCode: employees.find((emp) => emp.name === newTask.assignee)?.code || "E001",
    });

    setShowCreateModal(false);
    setNewTask({
      title: "",
      description: "",
      priority: "Normal",
      due: "",
      assignee: "Bharat vyas",
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (appliedFilters.status !== "Any" && t.status !== appliedFilters.status) {
      return false;
    }
    if (appliedFilters.priority !== "Any" && t.priority !== appliedFilters.priority) {
      return false;
    }
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333]">
            Completed
          </span>
        );
      case "Submitted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8]">
            Submitted
          </span>
        );
      case "In Progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef7e0] text-[#b06000]">
            In Progress
          </span>
        );
      case "Assigned":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Assigned
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700">
            Urgent
          </span>
        );
      case "High":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700">
            High
          </span>
        );
      case "Normal":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-700">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create and assign work. Review happens in the review queue.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/tasks/review"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-2xs transition-colors flex items-center gap-2"
          >
            <span>Review queue</span>
            {tasks.filter((t) => t.status === "Submitted").length > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                {tasks.filter((t) => t.status === "Submitted").length}
              </span>
            )}
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>Create task</span>
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Status Filter */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Any">Any</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Any">Any</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Search Filter */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Search</label>
            <input
              type="text"
              placeholder="Search title, description, assignee..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              onClick={handleApply}
              className="flex-1 h-10 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center"
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              className="h-10 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-100 text-[11px] font-bold text-slate-700 tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Task ↕</th>
                <th className="py-3.5 px-5">Priority ↕</th>
                <th className="py-3.5 px-5">Status ↕</th>
                <th className="py-3.5 px-5">Due ↕</th>
                <th className="py-3.5 px-5 uppercase">ASSIGNEE</th>
                <th className="py-3.5 px-5">Created ↓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No tasks found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Task Title Link */}
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="text-[#1a73e8] hover:underline font-semibold text-xs tracking-tight text-left"
                      >
                        {task.title}
                      </button>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-5">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      {getStatusBadge(task.status)}
                    </td>

                    {/* Due */}
                    <td className="py-3.5 px-5 text-slate-600 text-xs">
                      {task.due}
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-5 text-slate-700 text-xs font-medium">
                      {task.assignee || "Unassigned"}
                    </td>

                    {/* Created */}
                    <td className="py-3.5 px-5 text-slate-600 text-xs whitespace-nowrap">
                      {task.created}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-700">1-{filteredTasks.length}</strong> of{" "}
            <strong className="text-slate-700">{filteredTasks.length}</strong>
          </div>
        </div>
      </div>

      {/* Modal: Create Task */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Task</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Warehouse Bay B"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed task instructions..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Due Time / Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Today, 5:00 PM"
                    value={newTask.due}
                    onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Assignee</label>
                  <select
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.code})
                      </option>
                    ))}
                    <option value="Bharat vyas">Bharat vyas</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Task Detail */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedTask.title}</h3>
                <p className="text-xs text-slate-500">Created {selectedTask.created}</p>
              </div>
              {getStatusBadge(selectedTask.status)}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 text-slate-700">
              <p><strong>Description:</strong> {selectedTask.description || "No additional description provided."}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div><strong>Priority:</strong> {selectedTask.priority}</div>
                <div><strong>Assignee:</strong> {selectedTask.assignee || "Unassigned"}</div>
              </div>
              {selectedTask.evidenceNote && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-blue-700"><strong>Submitted Evidence:</strong> {selectedTask.evidenceNote}</p>
                </div>
              )}
              {selectedTask.evidenceFile && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="font-semibold text-slate-700 mb-1">Attached Photo Proof:</p>
                  {selectedTask.evidenceFile.startsWith("data:image") || selectedTask.evidenceFile.startsWith("http") ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedTask.evidenceFile}
                      alt="Task Evidence"
                      className="max-h-48 w-auto rounded-lg border border-slate-300 shadow-xs"
                    />
                  ) : (
                    <span className="text-slate-600">{selectedTask.evidenceFile}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                {selectedTask.status === "Submitted" && (
                  <button
                    onClick={() => {
                      updateTaskStatusInStore(selectedTask.id, "Completed");
                      setSelectedTask({ ...selectedTask, status: "Completed" });
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Approve Work
                  </button>
                )}
                {selectedTask.status !== "Completed" && (
                  <button
                    onClick={() => {
                      updateTaskStatusInStore(selectedTask.id, "Completed");
                      setSelectedTask({ ...selectedTask, status: "Completed" });
                    }}
                    className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
