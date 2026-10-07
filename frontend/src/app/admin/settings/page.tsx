"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  LocateFixed,
  Sparkles,
  Phone,
  Mail,
  Store,
  RefreshCw,
  Sliders,
  Check,
} from "lucide-react";
import { getCRMStore, updateShopSettingsInStore, resetCRMStoreToClean, ShopSettings } from "@/lib/store";

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: "Vyas Enterprises & Wholesale Hub",
    ownerName: "Bharat Vyas",
    phone: "9829012345",
    email: "contact@vyasenterprises.com",
    address: "Plot 42, Wholesale Trade Center, Ring Road",
    latitude: 26.9124,
    longitude: 75.7873,
    geofenceRadiusM: 40,
    shiftStart: "09:00",
    shiftEnd: "19:00",
    requiredDailyHours: 10,
    gracePeriodMinutes: 15,
    qrRotationSeconds: 45,
    lastUpdated: "Today",
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [gpsAccuracyM, setGpsAccuracyM] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"SHOP_PROFILE" | "GEOFENCE" | "TIMINGS">("SHOP_PROFILE");
  const [pasteInput, setPasteInput] = useState("");

  const handleApplyPastedCoords = () => {
    if (!pasteInput.trim()) return;
    const match = pasteInput.match(/(-?\d+\.\d{3,})[,\s/]+(-?\d+\.\d{3,})/);
    if (match) {
      const lat = parseFloat(parseFloat(match[1]).toFixed(6));
      const lng = parseFloat(parseFloat(match[2]).toFixed(6));
      setSettings((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
      setGpsAccuracyM(2);
      updateShopSettingsInStore({ latitude: lat, longitude: lng });
      setPasteInput("");
      showToast(`✓ Pinpoint coordinates locked: ${lat}, ${lng} & Saved!`);
    } else {
      alert("Please paste valid coordinates (e.g. 26.892485, 74.768920) or Google Maps link.");
    }
  };

  useEffect(() => {
    const store = getCRMStore();
    if (store && store.settings) {
      setSettings(store.settings);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1-CLICK REAL HIGH-ACCURACY GPS DETECTION
  const handleAutoDetectLocation = () => {
    setIsDetectingLocation(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);

        setSettings((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setGpsAccuracyM(acc);
        setIsDetectingLocation(false);

        // Auto-save to store
        updateShopSettingsInStore({ latitude: lat, longitude: lng });
        showToast(`✓ Shop GPS Locked: ${lat}, ${lng} (Accuracy: ±${acc}m) & Saved!`);
      },
      (error) => {
        setIsDetectingLocation(false);
        let msg = "Could not detect GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow Location/GPS access in your browser or phone settings.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out. Please turn on device Location with High Accuracy and retry.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS position unavailable. Please ensure GPS is enabled on this device.";
        }
        alert(`⚠️ GPS Detection Error:\n${msg}\n\nYou can also enter the exact Latitude and Longitude coordinates manually below.`);
        showToast(`⚠️ GPS detection failed: ${msg}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopSettingsInStore(settings);
    showToast("Shop profile & geofence settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business & Shop Settings</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Configure shop profile, 1-click GPS geofence boundary, and operational shift rules.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset CRM database to fresh testing sandbox defaults? All test records will be cleaned.")) {
                resetCRMStoreToClean();
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Wipe test data and reset to fresh baseline"
          >
            <RefreshCw size={14} />
            <span>Reset Test Data</span>
          </button>

          <button
            onClick={handleSaveSettings}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save size={18} />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "SHOP_PROFILE", label: "Shop Profile & Details", icon: Store },
          { id: "GEOFENCE", label: "1-Tap GPS Geofence", icon: MapPin },
          { id: "TIMINGS", label: "Shift Timings & Policies", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#1a73e8] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* TAB 1: SHOP & BUSINESS PROFILE */}
        {activeTab === "SHOP_PROFILE" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Shop / Business Profile</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  General shop branding and contact details displayed on payslips and reports.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                Last updated: {settings.lastUpdated}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Shop / Business Name *</label>
                <input
                  type="text"
                  required
                  value={settings.shopName}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Owner / Manager Name *</label>
                <input
                  type="text"
                  required
                  value={settings.ownerName}
                  onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" /> Official Contact Phone
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" /> Official Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Physical Shop Address & Location</label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 1-CLICK GPS GEOFENCE DETECTOR */}
        {activeTab === "GEOFENCE" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-[#1a73e8]" /> Shop GPS Coordinates & Geofence Boundary
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Owner doesn't need to manually type coordinates. Click the button while sitting in the shop to auto-detect!
                </p>
              </div>

              {/* 1-TAP GPS DETECT BUTTON */}
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetectingLocation}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                <LocateFixed className={`w-4 h-4 ${isDetectingLocation ? "animate-spin" : ""}`} />
                <span>
                  {isDetectingLocation ? "Detecting GPS Position..." : "📍 Auto-Detect Current Shop Location"}
                </span>
              </button>
            </div>

            {/* Live GPS Lock Display Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active Shop GPS Geofence Lock
                </span>
                {gpsAccuracyM && (
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                    Accuracy: ±{gpsAccuracyM}m
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs pt-1">
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Latitude</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">{settings.latitude}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Longitude</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">{settings.longitude}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Allowed Radius</span>
                  <span className="text-sm font-bold text-emerald-700 block mt-0.5">
                    {settings.geofenceRadiusM} meters
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-100/80">
                <span className="text-emerald-900/80 font-medium">Verify shop GPS pin location:</span>
                <a
                  href={`https://www.google.com/maps?q=${settings.latitude},${settings.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                >
                  📍 Open Pin in Google Maps ↗
                </a>
              </div>
            </div>

            {/* Quick Paste 100% Pinpoint Tool */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  100% पिनपॉइंट (Pinpoint) लोकेशन — Google Maps से सीधे पेस्ट करें
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
                  Zero Error
                </span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                यदि इनडोर छत के कारण ऑटो-डिटेक्ट थोड़ा आगे-पीछे दिखे, तो Google Maps में अपनी दुकान (Tata Tiscon / महेश स्टील्स) की छत पर <strong>Long Press (दबाकर रखें)</strong> या <strong>Right-Click</strong> करें और 2 नंबर कॉपी करके यहाँ पेस्ट करें:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="उदा. 26.892485, 74.768920 या Google Maps लिंक पेस्ट करें..."
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  className="flex-1 bg-white border border-blue-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={handleApplyPastedCoords}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MapPin size={13} />
                  <span>Apply & Lock Pin</span>
                </button>
              </div>
            </div>

            {/* Geofence Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.latitude}
                  onChange={(e) => setSettings({ ...settings, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.longitude}
                  onChange={(e) => setSettings({ ...settings, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Custom Geofence Radius (Meters)</label>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {settings.geofenceRadiusM}m Lock
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    step="1"
                    value={settings.geofenceRadiusM}
                    onChange={(e) => setSettings({ ...settings, geofenceRadiusM: Math.max(1, parseInt(e.target.value) || 0) })}
                    placeholder="Enter precise radius (e.g. 10, 15, 25, 40)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pointer-events-none">
                    meters
                  </span>
                </div>
                {/* Quick Presets for 1-click convenience */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                  {[10, 15, 25, 40, 60, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSettings({ ...settings, geofenceRadiusM: preset })}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono transition-all cursor-pointer ${
                        settings.geofenceRadiusM === preset
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 pt-0.5 leading-tight">
                  Type any exact custom meters for high-precision GPS boundary. Staff must be within this distance to check in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SHIFT TIMINGS & POLICIES */}
        {activeTab === "TIMINGS" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Shift Timings & Work Hour Rules</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Configure daily shift thresholds, grace periods, and dynamic QR rotation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Shift Start Time</label>
                <input
                  type="time"
                  value={settings.shiftStart}
                  onChange={(e) => setSettings({ ...settings, shiftStart: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Shift End Time</label>
                <input
                  type="time"
                  value={settings.shiftEnd}
                  onChange={(e) => setSettings({ ...settings, shiftEnd: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Daily Required Work Hours</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={settings.requiredDailyHours}
                  onChange={(e) => setSettings({ ...settings, requiredDailyHours: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Late Check-in Grace Period (Minutes)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={settings.gracePeriodMinutes}
                  onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Shop Dynamic QR Rotation (Seconds)</label>
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={settings.qrRotationSeconds}
                  onChange={(e) => setSettings({ ...settings, qrRotationSeconds: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={async () => {
              if (confirm("Are you sure you want to reset all CRM test data (tasks, orders, advances, shifts) to clean empty state across cloud and local devices?")) {
                try {
                  const res = await fetch("https://new-crm-c339.onrender.com/api/v1/sync/reset", { method: "POST" });
                  if (res.ok) {
                    resetCRMStoreToClean();
                    showToast("✓ Cloud and local database reset to clean state successfully!");
                    setTimeout(() => window.location.reload(), 800);
                  }
                } catch {
                  resetCRMStoreToClean();
                  showToast("✓ Local database reset to clean state!");
                }
              }
            }}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            🗑️ Reset All Data to Clean Blank State
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Save size={16} /> Save All Business Settings
          </button>
        </div>
      </form>
    </div>
  );
}
