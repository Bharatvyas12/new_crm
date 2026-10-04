"use client";

// Unified High-Speed Cross-Device Real-Time Cloud Synchronization Engine
import { CRMStoreData } from "./store";

const VERSION_KEY = "wcrm_store_version";
let isSyncing = false;
let syncInitialized = false;
let pollingTimer: NodeJS.Timeout | null = null;

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "https://new-crm-c339.onrender.com/api/v1";
    }
  }
  return "http://localhost:8000/api/v1";
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

/**
 * Pushes local CRM store updates to the cloud backend
 */
export const pushStoreToCloud = async (storeData: CRMStoreData): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  try {
    const baseUrl = getApiBaseUrl();
    const currentVersion = getLocalStoreVersion();

    const response = await fetch(`${baseUrl}/sync/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: storeData,
        client_version: currentVersion,
        client_id: typeof navigator !== "undefined" ? navigator.userAgent : "client",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.version) {
        setLocalStoreVersion(result.version);
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

    if (!force && localVersion > 0) {
      // Quick version check before fetching full payload
      try {
        const verRes = await fetch(`${baseUrl}/sync/version`, { cache: "no-store" });
        if (verRes.ok) {
          const verData = await verRes.json();
          if (verData.version <= localVersion) {
            isSyncing = false;
            return null; // Local is already up to date
          }
        }
      } catch {
        // Fall through to full fetch
      }
    }

    const response = await fetch(`${baseUrl}/sync/store`, { cache: "no-store" });
    if (response.ok) {
      const payload = await response.json();
      if (payload.data && typeof payload.data === "object") {
        setLocalStoreVersion(payload.version || 1);
        
        // Save to local storage without re-triggering cloud push
        localStorage.setItem("wcrm_unified_store_v2", JSON.stringify(payload.data));
        
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
 * Initializes the background real-time cloud sync engine
 */
export const initCloudSync = () => {
  if (typeof window === "undefined" || syncInitialized) return;
  syncInitialized = true;

  // Unconditional initial force-pull immediately on page load
  pullStoreFromCloud(true);

  // Periodic polling every 1.8 seconds for instant cross-device sync
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = setInterval(() => {
    pullStoreFromCloud(false);
  }, 1800);

  // Sync immediately when user switches back to tab or screen turns on
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === "visible") {
      pullStoreFromCloud(false);
    }
  };

  window.addEventListener("focus", handleVisibilityOrFocus);
  document.addEventListener("visibilitychange", handleVisibilityOrFocus);
  window.addEventListener("online", () => pullStoreFromCloud(true));
};
