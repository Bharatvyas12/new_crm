"use client";

import React, { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, RefreshCw, Smartphone, Check } from "lucide-react";
import { forceSyncNow } from "@/lib/syncEngine";
import { useLanguage } from "@/lib/i18n";

export function PWAInstallPrompt() {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Check iOS device
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIosDevice);

      // Catch Android/Chrome beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // Show iOS prompt if not standalone and not dismissed
      const dismissed = localStorage.getItem("wcrm_pwa_dismissed");
      if (isIosDevice && !isStandaloneMode && !dismissed) {
        setShowPrompt(true);
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("wcrm_pwa_dismissed", "true");
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      await forceSyncNow();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Floating Manual Sync Trigger (Bottom-Right) */}
      <button
        type="button"
        onClick={handleManualSync}
        disabled={isSyncing}
        className="fixed bottom-20 right-4 z-40 px-3 py-2 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white rounded-2xl shadow-xl border border-slate-700/80 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
        title="Force Live Cloud Synchronization"
      >
        <RefreshCw
          size={14}
          className={`text-emerald-400 ${isSyncing ? "animate-spin" : ""}`}
        />
        <span>
          {isSyncing
            ? lang === "hi"
              ? "सिंक हो रहा है..."
              : "Syncing..."
            : syncSuccess
            ? lang === "hi"
              ? "✓ सिंक हुआ"
              : "✓ Synced"
            : lang === "hi"
            ? "लाइव सिंक"
            : "Sync Now"}
        </span>
      </button>

      {/* PWA Home Screen Install Banner */}
      {showPrompt && !isStandalone && (
        <div className="fixed top-3 inset-x-3 z-50 max-w-md mx-auto bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-4 rounded-3xl shadow-2xl border border-blue-500/40 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Smartphone size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white tracking-tight">
                {lang === "hi"
                  ? "होम स्क्रीन पर CRM ऐप जोड़ें"
                  : "Install Workforce App on Home Screen"}
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {isIOS
                  ? lang === "hi"
                    ? "Safari में नीचे Share ⎋ दबाएं और 'Add to Home Screen' ⊞ चुनें।"
                    : "In Safari: Tap Share button ⎋ below & select 'Add to Home Screen' ⊞."
                  : lang === "hi"
                  ? "फोन में 1-क्लिक फास्ट एक्सेस और लाइव साउंड अलर्ट्स के लिए इंस्टॉल करें।"
                  : "Instant 1-tap full screen access with live audio notifications."}
              </p>

              {!isIOS && deferredPrompt && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="mt-2.5 px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>{lang === "hi" ? "ऐप इंस्टॉल करें (Install)" : "Install App"}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
