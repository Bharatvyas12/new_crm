"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`inline-flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 rounded-xl p-1 text-xs shadow-2xs ${className}`}>
      <Globe size={13} className="text-slate-500 ml-1 shrink-0" />
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
          lang === "en"
            ? "bg-white text-blue-700 shadow-xs font-bold"
            : "text-slate-600 hover:text-slate-900"
        }`}
        type="button"
      >
        English
      </button>
      <button
        onClick={() => setLang("hi")}
        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
          lang === "hi"
            ? "bg-white text-blue-700 shadow-xs font-bold"
            : "text-slate-600 hover:text-slate-900"
        }`}
        type="button"
      >
        हिंदी
      </button>
    </div>
  );
}
