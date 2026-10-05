"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Share,
  PlusSquare,
  X,
  RefreshCw,
  Smartphone,
  Check,
  MoreVertical,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { forceSyncNow } from "@/lib/syncEngine";
import { useLanguage } from "@/lib/i18n";

export function PWAInstallPrompt() {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker for PWA compliance
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration note:", err);
        });
    }

    // 2. Detect Standalone mode (already installed as PWA)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsStandalone(isStandaloneMode);

    // 3. Detect iOS vs Android/Other
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);
    setIsMobile(/android|iphone|ipad|ipod|mobile/i.test(userAgent));

    // 4. Capture native beforeinstallprompt (Chromium / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Listen to custom event to open guide modal from any button in the app
    const handleOpenModal = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === "accepted") {
            setShowBanner(false);
          }
          setDeferredPrompt(null);
        });
      } else {
        setShowGuideModal(true);
      }
    };
    window.addEventListener("open-pwa-install-modal", handleOpenModal);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-install-modal", handleOpenModal);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setShowBanner(false);
          setShowGuideModal(false);
        }
      } catch (e) {
        console.error("Install prompt error:", e);
      }
      setDeferredPrompt(null);
    } else {
      // If browser doesn't offer direct programmatic install, show clear visual guide
      setShowGuideModal(true);
    }
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

  // If already running inside standalone app, don't show install banner
  return (
    <>
      {/* Floating Controls (Bottom-Right) */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
        {/* Persistent "Add to Home Screen" chip for mobile browser */}
        {!isStandalone && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl shadow-xl border border-emerald-400/40 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 animate-bounce-subtle"
            title="Add to Home Screen / Install on Phone"
          >
            <Smartphone size={14} className="text-white shrink-0" />
            <span>{lang === "hi" ? "📲 फोन में जोड़ें" : "📲 Add to Phone"}</span>
          </button>
        )}

        {/* Live Manual Sync Button */}
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-3 py-2 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-white rounded-2xl shadow-xl border border-slate-700/80 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
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
      </div>

      {/* Top Banner on Mobile Browser */}
      {!isStandalone && showBanner && isMobile && (
        <div className="fixed top-2 inset-x-2 sm:inset-x-auto sm:left-4 sm:right-4 z-50 max-w-lg mx-auto bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Smartphone size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{lang === "hi" ? "ऐप फोन की होम स्क्रीन पर जोड़ें" : "Add App to Mobile Home Screen"}</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-md font-mono">PWA</span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                {lang === "hi"
                  ? "1-क्लिक फास्ट ओपन, फुलस्क्रीन मोड और तुरंत नोटिफिकेशन"
                  : "Instant 1-tap open, full-screen and sound notifications"}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Download size={13} />
                <span>{lang === "hi" ? "जोड़ें" : "Install"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Install Guide Modal (When direct prompt not supported by browser) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === "hi" ? "फोन में ऐप कैसे जोड़ें?" : "How to Add to Home Screen"}
                  </h3>
                  <span className="text-[10px] text-slate-400">Workforce CRM Mobile App</span>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              // iOS Safari Instructions
              <div className="space-y-3 py-1 text-xs">
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">
                      {lang === "hi" ? "Safari ब्राउज़र में नीचे Share बटन दबाएं" : "Tap the Share button in Safari"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lang === "hi" ? "स्क्रीन के नीचे बना हुआ यह निशान दबाएं: " : "Look at the bottom toolbar for this icon: "}
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-700 rounded text-blue-400 font-bold mx-1">
                        ⎋
                      </span>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">
                      {lang === "hi" ? "'Add to Home Screen' चुनें" : "Select 'Add to Home Screen'"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lang === "hi" ? "लिस्ट में नीचे स्क्रॉल करें और '+' आइकन पर टैप करें।" : "Scroll down the share sheet and tap the '+' icon."}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">
                      {lang === "hi" ? "ऊपर 'Add' पर टैप करें" : "Tap 'Add' in top right corner"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lang === "hi" ? "अब आपके iPhone की स्क्रीन पर CRM ऐप का आइकन आ जाएगा!" : "The app icon will now appear on your iPhone Home Screen!"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Android Chrome Instructions
              <div className="space-y-3 py-1 text-xs">
                {deferredPrompt ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2.5">
                    <p className="text-xs text-emerald-300 font-medium">
                      {lang === "hi"
                        ? "ब्राउज़र ऐप इंस्टॉल करने के लिए तैयार है!"
                        : "Browser is ready to install the app!"}
                    </p>
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Download size={14} />
                      <span>{lang === "hi" ? "अभी इंस्टॉल करें" : "Install App Now"}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">
                          {lang === "hi" ? "Chrome में ऊपर 3 डॉट्स (⋮) पर टैप करें" : "Tap 3 dots (⋮) menu in Chrome"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {lang === "hi" ? "स्क्रीन के ऊपर दाएँ कोने (Top-right) में देखें।" : "Located at the top-right corner of Chrome browser."}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">
                          {lang === "hi" ? "'Install app' या 'Add to Home screen' चुनें" : "Tap 'Install app' or 'Add to Home screen'"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {lang === "hi" ? "मेन्यू में यह विकल्प दिखाई देगा।" : "This option will be visible in the menu list."}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 text-xs">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">
                          {lang === "hi" ? "'Install' या 'Add' दबाएं" : "Confirm 'Install' / 'Add'"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {lang === "hi" ? "ऐप आपके फोन में इंस्टॉल होकर होम स्क्रीन पर दिखेगी।" : "The app will now open just like a regular native app!"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              {lang === "hi" ? "समझ गया (Close)" : "Got it (Close)"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
