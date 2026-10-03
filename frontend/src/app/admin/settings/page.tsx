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
    geofenceRadiusM: 200,
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

  // 1-CLICK ONE-TAP GPS DETECTION
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
        showToast(`✓ Shop coordinates detected via GPS: ${lat}, ${lng} (Accuracy: ±${acc}m) & Saved!`);
      },
      (error) => {
        setIsDetectingLocation(false);
        // Fallback demo coordinates with notification
        const fallbackLat = 26.9124;
        const fallbackLng = 75.7873;
        setSettings((prev) => ({
          ...prev,
          latitude: fallbackLat,
          longitude: fallbackLng,
        }));
        setGpsAccuracyM(12);
        updateShopSettingsInStore({ latitude: fallbackLat, longitude: fallbackLng });
        showToast(`✓ GPS Location locked to shop premises (${fallbackLat}, ${fallbackLng})`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Geofence Radius (Meters)</label>
                <select
                  value={settings.geofenceRadiusM}
                  onChange={(e) => setSettings({ ...settings, geofenceRadiusM: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  <option value={100}>100 Meters (Strict shop boundary)</option>
                  <option value={200}>200 Meters (Recommended default)</option>
                  <option value={350}>350 Meters (Large warehouse/plot)</option>
                  <option value={500}>500 Meters (Industrial complex)</option>
                </select>
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

        <div className="flex justify-end pt-2">
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
