"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, CheckCircle2, XCircle, Clock, Image as ImageIcon, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { getCRMStore, reviewTaskInStore, subscribeToCRMStore, TaskItem } from "@/lib/store";

export default function ReviewQueuePage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
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

  const submissions = tasks.filter((t) => t.status === "Submitted");

  const handleReview = (id: string, action: "Approved" | "Rejected") => {
    reviewTaskInStore(id, action);
    if (action === "Approved") {
      showToast("✓ Task verified, approved, and marked as Completed!");
    } else {
      showToast("Revision requested. Task moved back to In Progress for assignee.");
    }
  };

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900/90 flex items-center justify-between border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Task Completion Photo Proof</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
              >
                Close ✕
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Enlarged evidence"
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/tasks"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Back to Tasks</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspect proof and verify task evidence submitted by assignees. Segregation of duties enforced.
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl self-start sm:self-auto flex items-center gap-2">
          <Clock size={14} />
          <span>{submissions.length} Submissions Pending Review</span>
        </div>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700">Review queue is empty!</p>
            <p className="text-xs text-slate-400">All task submissions have been reviewed and verified.</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{sub.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {sub.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitted by: <strong>{sub.assignee}</strong> ({sub.assigneeCode || "E001"}) • Due: {sub.due}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 self-start md:self-auto border border-blue-200">
                  Awaiting Review
                </span>
              </div>

              {sub.description && (
                <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  <strong>Task Brief:</strong> {sub.description}
                </p>
              )}

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-3 text-slate-700 border border-slate-200">
                <p><strong>Assignee Evidence Note:</strong> {sub.evidenceNote || "Task completed and verified on-site."}</p>
                {sub.evidenceFile && (
                  <div>
                    {sub.evidenceFile.startsWith("data:image") || sub.evidenceFile.startsWith("http") ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-bold">
                          <ImageIcon size={13} className="text-blue-600" />
                          <span>Submitted Photo Proof (Click to inspect):</span>
                        </div>
                        <div
                          onClick={() => setPreviewImage(sub.evidenceFile!)}
                          className="group relative inline-block cursor-pointer overflow-hidden rounded-xl border-2 border-blue-400 hover:border-blue-600 shadow-xs transition-all"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sub.evidenceFile}
                            alt="Submitted evidence"
                            className="h-28 w-44 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <span>🔍 Enlarge Photo</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-600 bg-white border border-slate-200 p-2 rounded-lg font-medium">
                        <ImageIcon size={14} />
                        <span>Evidence attachment: {sub.evidenceFile}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleReview(sub.id, "Rejected")}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition-colors border border-red-200 cursor-pointer"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => handleReview(sub.id, "Approved")}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Approve & Complete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
