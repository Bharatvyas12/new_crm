"use client";

// Unified High-Speed Cross-Device Real-Time Cloud Synchronization Engine
import { CRMStoreData, STORAGE_KEY } from "./store";

const VERSION_KEY = "wcrm_store_version_v3";
const UPDATED_AT_KEY = "wcrm_store_updated_at_v3";
let isSyncing = false;
let syncInitialized = false;
let pollingTimer: NodeJS.Timeout | null = null;
let lastKnownUpdatedAt = "";

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  // Connect both localhost and production clients to the Render Cloud Backend
  return "https://new-crm-c339.onrender.com/api/v1";
};

export const getLocalStoreVersion = (): number => {
  if (typeof window === "undefined") return 0;
  try {
    const v = localStorage.getItem(VERSION_KEY);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

export const setLocalStoreVersion = (v: number) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VERSION_KEY, v.toString());
  } catch {}
};

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Play a crystal-clear Web Audio notification sound when new tasks/orders arrive
 */
export const playLiveSoundNotification = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Crisp two-tone chime (587Hz -> 880Hz)
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};

/**
 * Pushes local CRM store updates to the cloud backend
 */
export const pushStoreToCloud = async (storeData: CRMStoreData): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  try {
    const baseUrl = getApiBaseUrl();
    const currentVersion = getLocalStoreVersion();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${baseUrl}/sync/store?_t=${Date.now()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...NO_CACHE_HEADERS,
      },
      body: JSON.stringify({
        data: storeData,
        client_version: currentVersion,
        client_id: typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 50) : "client",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const result = await response.json();
      if (result.version) {
        setLocalStoreVersion(result.version);
      }
      if (result.updated_at) {
        lastKnownUpdatedAt = result.updated_at;
        localStorage.setItem(UPDATED_AT_KEY, result.updated_at);
      }
      return true;
    }
  } catch (err) {
    console.debug("[SyncEngine] Push to cloud error:", err);
  }
  return false;
};

/**
 * Pulls the latest CRM store state from the cloud backend
 */
export const pullStoreFromCloud = async (force: boolean = false): Promise<CRMStoreData | null> => {
  if (typeof window === "undefined" || isSyncing) return null;
  isSyncing = true;
  try {
    const baseUrl = getApiBaseUrl();
    const localVersion = getLocalStoreVersion();
    const localUpdatedAt = localStorage.getItem(UPDATED_AT_KEY) || "";

    if (!force) {
      // Fast version check
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const verRes = await fetch(`${baseUrl}/sync/version?_t=${Date.now()}`, {
          cache: "no-store",
          headers: NO_CACHE_HEADERS,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (verRes.ok) {
          const verData = await verRes.json();
          // If server version AND updated_at matches local, skip downloading full store
          if (verData.version === localVersion && verData.updated_at === localUpdatedAt) {
            isSyncing = false;
            return null;
          }
        }
      } catch {
        // Fall through to full fetch
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(`${baseUrl}/sync/store?_t=${Date.now()}`, {
      cache: "no-store",
      headers: NO_CACHE_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const payload = await response.json();
      if (payload.data && typeof payload.data === "object") {
        const prevRaw = localStorage.getItem(STORAGE_KEY);
        const prevStore = prevRaw ? JSON.parse(prevRaw) : null;

        setLocalStoreVersion(payload.version || 1);
        if (payload.updated_at) {
          lastKnownUpdatedAt = payload.updated_at;
          localStorage.setItem(UPDATED_AT_KEY, payload.updated_at);
        }

        // Save to local storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.data));

        // Detect if new orders or tasks arrived and play chime
        if (prevStore) {
          const newOrders = (payload.data.orders || []).length > (prevStore.orders || []).length;
          const newTasks = (payload.data.tasks || []).length > (prevStore.tasks || []).length;
          if (newOrders || newTasks) {
            playLiveSoundNotification();
          }
        }

        // Notify all local components & active tabs
        window.dispatchEvent(new Event("wcrm_store_updated"));
        if (typeof BroadcastChannel !== "undefined") {
          try {
            const bc = new BroadcastChannel("wcrm_sync_channel");
            bc.postMessage({ type: "CLOUD_SYNC", timestamp: Date.now() });
            bc.close();
          } catch {}
        }

        isSyncing = false;
        return payload.data;
      }
    }
  } catch (err) {
    console.debug("[SyncEngine] Pull failed:", err);
  } finally {
    isSyncing = false;
  }
  return null;
};

/**
 * Force manual immediate synchronization
 */
export const forceSyncNow = async (): Promise<boolean> => {
  const data = await pullStoreFromCloud(true);
  return data !== null;
};

/**
 * Initializes the background real-time cloud sync engine
 */
export const initCloudSync = () => {
  if (typeof window === "undefined" || syncInitialized) return;
  syncInitialized = true;

  // Unconditional initial force-pull immediately on page load
  pullStoreFromCloud(true);

  // Periodic polling every 1.5 seconds for instant cross-device sync
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = setInterval(() => {
    pullStoreFromCloud(false);
  }, 1500);

  // Sync immediately when user switches back to tab or screen turns on
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === "visible") {
      pullStoreFromCloud(true);
    }
  };

  window.addEventListener("focus", handleVisibilityOrFocus);
  document.addEventListener("visibilitychange", handleVisibilityOrFocus);
  window.addEventListener("online", () => pullStoreFromCloud(true));

  // Expose helper on window for debugging/testing
  (window as any).wcrm_sync_now = () => forceSyncNow();
  (window as any).wcrm_play_sound = () => playLiveSoundNotification();
};
