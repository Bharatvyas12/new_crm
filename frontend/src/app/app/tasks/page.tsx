"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Camera,
  Check,
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  getCRMStore,
  submitTaskEvidenceInStore,
  updateTaskStatusInStore,
  subscribeToCRMStore,
  TaskItem,
} from "@/lib/store";

export default function EmployeeTasksPage() {
  const { t, lang } = useLanguage();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = () => {
      const store = getCRMStore();
      setTasks(store.tasks || []);
    };
    loadTasks();
    const unsubscribe = subscribeToCRMStore(loadTasks);
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartTask = (taskId: string) => {
    updateTaskStatusInStore(taskId, "In Progress");
    showToast("Task marked as In Progress");
  };

  const handleSubmitEvidence = (taskId: string) => {
    if (!evidenceNote.trim()) {
      alert("Please enter a brief note or confirmation before submitting evidence.");
      return;
    }

    submitTaskEvidenceInStore(
      taskId,
      evidenceNote.trim(),
      evidenceFileName ? evidenceFileName : "site_photo_verification.jpg"
    );

    showToast("✓ Task evidence submitted! Sent to Admin Review Queue.");
    setSelectedTask(null);
    setEvidenceNote("");
    setEvidenceFileName("");
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 right-4 z-50 p-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center justify-between border border-slate-700"
        >
          <span>{toastMessage}</span>
          <Check size={14} className="text-emerald-400" />
        </motion.div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {lang === "hi" ? "कार्य और कार्यप्रणाली (Tasks)" : "Work Tasks & SOPs"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "hi" ? "आपको सौंपे गए कार्य और सबूत सत्यापन" : "Tasks assigned to you with evidence verification"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[11px] rounded-full border border-blue-200 shrink-0">
              {tasks.length} {lang === "hi" ? "कार्य" : "Assigned"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 space-y-2">
            <CheckSquare size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No tasks assigned</p>
            <p className="text-xs text-slate-400">
              New tasks assigned by admin will appear here immediately.
            </p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{task.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Assigned to: <strong>{task.assignee}</strong>
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    task.priority === "Urgent"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : task.priority === "High"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  {task.priority} Priority
                </span>
              </div>

              {task.description && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {task.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock size={13} className="text-slate-400" />
                  <span>Due: {task.due}</span>
                </div>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                    task.status === "Completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : task.status === "Submitted"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : task.status === "In Progress"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              {/* Task Evidence Submission Form */}
              {task.status === "Submitted" ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={14} className="text-purple-600" />
                    <span>Evidence Submitted (Under Admin Review)</span>
                  </div>
                  <p className="text-[11px] text-purple-700">
                    <strong>Note:</strong> {task.evidenceNote || "Photo proof submitted"}
                  </p>
                </div>
              ) : task.status === "Completed" ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-center gap-1.5 font-bold">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Task Verified & Completed</span>
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  {selectedTask === task.id ? (
                    <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Completion Remarks / Evidence Note *
                        </label>
                        <textarea
                          placeholder="Describe work completed (e.g. Cleaned & restocked bay, counted 40 units)..."
                          value={evidenceNote}
                          onChange={(e) => setEvidenceNote(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Attach Photo Proof (Optional)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-dashed border-slate-300 hover:border-blue-500 text-slate-600 rounded-xl text-xs font-semibold transition-colors">
                            <Camera size={14} className="text-blue-600" />
                            <span>{evidenceFileName || "Take Photo / Choose File"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setEvidenceFileName(e.target.files[0].name);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleSubmitEvidence(task.id)}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Upload size={13} />
                          <span>Submit to Admin</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTask(null);
                            setEvidenceNote("");
                            setEvidenceFileName("");
                          }}
                          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {task.status === "Assigned" && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Start Task
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTask(task.id);
                          setEvidenceNote("");
                        }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Upload size={13} />
                        <span>Submit Task Proof</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
