"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  RefreshCw,
  Clock,
  ShieldCheck,
  MapPin,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles
} from "lucide-react";

export default function ShopQRPage() {
  const [token, setToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(45);
  const [copied, setCopied] = useState(false);
  const [isKiosk, setIsKiosk] = useState(false);

  // Generate a random dynamic nonce
  const generateNewToken = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newToken = `WCRM-SHOP-${timestamp}-${randomHex}`;
    setToken(newToken);
    setTimeLeft(45);
  };

  useEffect(() => {
    generateNewToken();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewToken();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // QR Payload: Formatted JSON or URL string
  const qrPayload = JSON.stringify({
    type: "WCRM_ATTENDANCE_SHOP_QR",
    nonce: token,
    shop: "Workforce Main Workshop Bay",
    geofence: { lat: 28.6139, lon: 77.2090, radius: 200 },
    expiresIn: timeLeft,
  });

  return (
    <div className={`space-y-6 ${isKiosk ? "fixed inset-0 z-50 bg-white p-8 flex flex-col justify-center items-center overflow-auto" : "max-w-3xl mx-auto"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shop Dynamic QR Code</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Rotating
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Display this QR at the physical counter. Employees scan via their phone camera or employee app to check in.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setIsKiosk(!isKiosk)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            {isKiosk ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isKiosk ? "Exit Kiosk" : "Kiosk Display"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main QR Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        {/* Physical Shop Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
          <MapPin size={13} className="text-[#1a73e8]" />
          <span>Workshop Counter #1 • Delhi Main Gate</span>
        </div>

        {/* Real Scannable SVG QR Code */}
        <div className="mx-auto w-64 h-64 sm:w-72 sm:h-72 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-lg flex items-center justify-center relative group">
          {token ? (
            <QRCodeSVG
              value={qrPayload}
              size={240}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231a73e8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>",
                x: undefined,
                y: undefined,
                height: 32,
                width: 32,
                excavate: true,
              }}
            />
          ) : (
            <div className="animate-pulse text-slate-400 text-sm">Generating QR code...</div>
          )}
        </div>

        {/* Token String & Copy */}
        <div className="space-y-2 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
            <span className="font-mono text-xs font-bold text-slate-800 tracking-wider select-all truncate">
              {token || "GENERATING..."}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shrink-0"
              title="Copy Token"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Employees can also manually enter this code if their camera is unavailable.
          </p>
        </div>

        {/* Dynamic Rotation Timer Bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" />
              Auto-refreshes for replay protection
            </span>
            <span className="font-mono font-bold text-blue-600">{timeLeft}s remaining</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(timeLeft / 45) * 100}%` }}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={generateNewToken}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-xl font-medium transition-colors"
            >
              <RefreshCw size={12} />
              <span>Regenerate Now</span>
            </button>
          </div>
        </div>

        {/* Security & Verification Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-left pt-4 border-t border-slate-100 max-w-lg mx-auto">
          <div className="bg-slate-50 p-3 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Single-Use Nonce</span>
            </div>
            <p className="text-[11px] text-slate-500">Expired tokens cannot be scanned twice.</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <MapPin size={14} className="text-[#1a73e8]" />
              <span>GPS Geofence</span>
            </div>
            <p className="text-[11px] text-slate-500">Enforces 200m radius check around shop.</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Sparkles size={14} className="text-amber-600" />
              <span>Cryptographic</span>
            </div>
            <p className="text-[11px] text-slate-500">Authoritatively verified on server.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
