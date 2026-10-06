"use client";

import React, { useState, useEffect } from "react";
import { Bell, Volume2, CheckCircle2, AlertTriangle, Smartphone, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  requestPhoneNotificationPermission,
  isNotificationPermissionGranted,
  triggerTestPhonePush,
  playNotificationTune,
  ensureWebPushSubscribed,
} from "@/lib/phoneNotifications";
import { useLanguage } from "@/lib/i18n";

interface PhoneNotificationBannerProps {
  userCode?: string;
  isEmployee?: boolean;
}

export function PhoneNotificationBanner({ userCode = "E001", isEmployee = true }: PhoneNotificationBannerProps) {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const [isIOSWeb, setIsIOSWeb] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setIsIOSWeb(ios && !standalone);
    setIsStandalone(standalone);

    if ("Notification" in window) {
      setPermissionState(Notification.permission);
      setHasPermission(Notification.permission === "granted");
      if (Notification.permission === "granted") {
        ensureWebPushSubscribed(userCode);
      }
    } else {
      setPermissionState("unsupported");
    }
  }, [userCode]);

  if (!mounted) return null;

  const handleRequestPermission = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const granted = await requestPhoneNotificationPermission(userCode);
      setHasPermission(granted);
      if ("Notification" in window) {
        setPermissionState(Notification.permission);
      }
      if (granted) {
        setStatusMessage(
          lang === "hi"
            ? "✓ सूचनाएं व रिंगटोन चालू हो गई हैं! अब ऐप बंद होने पर भी अलर्ट मिलेगा।"
            : "✓ Notifications & Ringtone Active! You will now receive background alerts."
        );
      } else {
        if (Notification.permission === "denied") {
          setStatusMessage(
            lang === "hi"
              ? "⚠️ ब्राउज़र ने अनुमति रोक रखी है। Chrome में ऊपर 🔒 या ⋮ आइकन दबाकर 'Site settings' > 'Notifications' > 'Allow' करें।"
              : "⚠️ Permission was denied. Please allow notifications in browser site settings."
          );
        }
      }
    } catch (e: any) {
      setStatusMessage("Error: " + (e?.message || "Failed to enable notifications"));
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      // 1. Play local loud chime
      playNotificationTune();

      // 2. Vibrate phone hardware
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([250, 100, 250, 100, 400]);
        } catch {}
      }

      // 3. Dispatch backend Web Push to device
      const res = await triggerTestPhonePush();
      setLoading(false);
      setStatusMessage(
        res.success
          ? lang === "hi"
            ? `✓ रिंगटोन बजी और ${res.registered} फोन पर पुश भेजा गया! नोटिफिकेशन बार चेक करें या फोन लॉक करके देखें।`
            : `✓ Ringtone played & Web Push dispatched to ${res.registered} device(s)! Check notification bar.`
          : lang === "hi"
          ? "✓ लोकल ट्यून बजी! बैकग्राउंड पुश सर्वर से भेजा जा रहा है।"
          : "✓ Ringtone played locally! Push dispatched."
      );
    } catch (err: any) {
      setLoading(false);
      setStatusMessage("Test completed locally.");
    }
  };

  // State A: Permission NOT Granted
  if (!hasPermission) {
    return (
      <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-orange-500/20 border-2 border-amber-300 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-orange-600 flex items-center justify-center shrink-0 shadow-md animate-bounce">
              <Bell size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/25 text-white tracking-wider">
                  {lang === "hi" ? "अति आवश्यक" : "ACTION REQUIRED"}
                </span>
                <span className="text-xs font-bold text-amber-100">
                  {lang === "hi" ? "फोन अलर्ट बंद हैं" : "Push Alerts Off"}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 leading-snug">
                {lang === "hi"
                  ? "🔔 फोन में नोटिफिकेशन और रिंगटोन चालू करें"
                  : "🔔 Allow Phone Notifications & Sound Alert"}
              </h3>
              <p className="text-xs text-amber-100 mt-1 max-w-xl leading-relaxed">
                {lang === "hi"
                  ? "नया कार्य, ऑर्डर या एडमिन संदेश आने पर ऐप बंद होने पर भी आपके फोन में रिंगटोन बजेगी और नोटिफिकेशन दिखेगा।"
                  : "Get ringtone and notification alerts for new tasks & orders even when the app is completely closed."}
              </p>

              {isIOSWeb && (
                <p className="text-[11px] text-amber-200 mt-1 font-semibold flex items-center gap-1">
                  <Smartphone size={13} />
                  {lang === "hi"
                    ? "iPhone: नीचे Safari Share बटन दबाएं > 'Add to Home Screen' करें।"
                    : "iPhone: Tap Safari Share button > 'Add to Home Screen' to enable push."}
                </p>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-amber-50 active:scale-95 text-orange-700 font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bell size={18} className="text-orange-600 animate-pulse" />
              <span>
                {loading
                  ? (lang === "hi" ? "चालू हो रहा है..." : "Activating...")
                  : (lang === "hi" ? "नोटिफिकेशन चालू करें (ALLOW)" : "ALLOW NOTIFICATION NOW")}
              </span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-3 p-2.5 bg-black/25 rounded-xl text-xs font-medium text-white flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-300 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // State B: Permission Granted (Active)
  if (minimized) {
    return (
      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-emerald-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">
            {lang === "hi" ? "🔔 फोन नोटिफिकेशन सक्रिय है (Active)" : "🔔 Phone Notifications Active"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestAlert}
            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <Volume2 size={12} />
            <span>{lang === "hi" ? "टेस्ट रिंगटोन" : "Test"}</span>
          </button>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="p-1 text-emerald-600 hover:text-emerald-900 rounded cursor-pointer"
            title="Expand"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 sm:p-4 shadow-sm relative animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                {lang === "hi" ? "सक्रिय (ACTIVE)" : "ACTIVE"}
              </span>
              <span className="text-xs font-bold text-emerald-900">
                {lang === "hi" ? "फोन रिंगटोन व पुश अलर्ट चालू हैं" : "Phone Ringtone & Push Alerts Active"}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              {lang === "hi"
                ? "ऐप बंद रहने पर भी आपके फोन पर रिंगटोन और अलर्ट आएंगे।"
                : "Background push alerts with ringtone are ready for closed app."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleTestAlert}
            disabled={loading}
            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Volume2 size={15} />
            <span>
              {loading
                ? (lang === "hi" ? "भेज रहे हैं..." : "Sending...")
                : (lang === "hi" ? "📲 टेस्ट रिंगटोन व अलर्ट बजाएं" : "📲 Test Ringtone & Push Alert")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            title="Minimize"
          >
            <ChevronUp size={16} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mt-2.5 p-2.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <Sparkles size={14} className="text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
