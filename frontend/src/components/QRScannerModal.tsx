"use client";

import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, X, RefreshCw, Upload, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: "environment" | "user") => {
    stopCamera();
    setErrorMessage(null);
    setScannedResult(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setHasCameraPermission(false);
      setErrorMessage("Camera access is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setHasCameraPermission(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn("Camera start error:", err);
      // Try fallback without exact facingMode constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          setHasCameraPermission(true);
          requestAnimationFrame(tick);
        }
      } catch (fallbackErr: any) {
        setHasCameraPermission(false);
        setErrorMessage(
          fallbackErr.name === "NotAllowedError" || fallbackErr.name === "PermissionDeniedError"
            ? "Camera permission denied. Please allow camera access in your browser settings."
            : "Unable to start camera. You can also upload a photo of the QR code below."
        );
      }
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          // Found QR Code!
          const raw = code.data.trim();
          let parsedToken = raw;
          try {
            if (raw.startsWith("{") && raw.endsWith("}")) {
              const obj = JSON.parse(raw);
              parsedToken = obj.nonce || obj.token || raw;
            }
          } catch {}

          setScannedResult(parsedToken);
          stopCamera();

          // Play success vibration if supported
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([80, 50, 80]);
          }

          setTimeout(() => {
            onScanSuccess(parsedToken);
            onClose();
          }, 600);
          return;
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          const raw = code.data.trim();
          let parsedToken = raw;
          try {
            if (raw.startsWith("{") && raw.endsWith("}")) {
              const obj = JSON.parse(raw);
              parsedToken = obj.nonce || obj.token || raw;
            }
          } catch {}
          setScannedResult(parsedToken);
          setTimeout(() => {
            onScanSuccess(parsedToken);
            onClose();
          }, 500);
        } else {
          alert("QR Code not recognized in the uploaded image. Please try again.");
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 text-white space-y-4 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <Camera size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Scan Shop QR Code</h3>
              <p className="text-[10px] text-slate-400">Point camera at the counter display</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Camera Viewfinder */}
        <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden border border-slate-700/80 flex items-center justify-center">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Reticle / Target Scanner Box */}
          <div className="relative w-56 h-56 border-2 border-blue-400/80 rounded-2xl flex items-center justify-center shadow-lg">
            {/* Animated Scanning Beam */}
            <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse rounded-full shadow-md" />
            
            {/* Corner Indicators */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

            {scannedResult && (
              <div className="p-3 bg-emerald-600/95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl animate-in zoom-in-95">
                <CheckCircle2 size={18} />
                <span>QR Verified!</span>
              </div>
            )}
          </div>

          {/* Camera Permission Error Overlay */}
          {errorMessage && (
            <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center space-y-3">
              <AlertTriangle className="text-amber-400" size={32} />
              <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              const next = facingMode === "environment" ? "user" : "environment";
              setFacingMode(next);
            }}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <RefreshCw size={13} />
            <span>Switch Camera</span>
          </button>

          <label className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700 text-center">
            <Upload size={13} />
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Note */}
        <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span>Scans the dynamic 5-minute kiosk QR code instantly.</span>
        </div>
      </div>
    </div>
  );
}
