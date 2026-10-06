// Mobile & System Notifications with Crystal Clear Audio Tune
// Supports Service Worker Push Notifications, HTML5 Notification API & Web Audio Synthesizer

let sharedAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

/**
 * Unlocks AudioContext on user gesture (required by iOS Safari and Android Chrome)
 */
export const unlockAudio = () => {
  if (typeof window === "undefined" || isAudioUnlocked) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContextClass();
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
    isAudioUnlocked = true;
    console.log("[Audio] AudioContext unlocked successfully");
  } catch (e) {
    console.warn("[Audio] Unlock error:", e);
  }
};

// Auto-bind user gesture listeners to unlock sound seamlessly
if (typeof window !== "undefined") {
  const unlockEvents = ["touchstart", "touchend", "mousedown", "click", "keydown"];
  const handleInteraction = () => {
    unlockAudio();
    unlockEvents.forEach((ev) => window.removeEventListener(ev, handleInteraction));
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, handleInteraction, { once: true, passive: true }));
}

/**
 * Plays a loud, crisp 3-tone notification tune (E5 -> G5 -> C6 chime)
 */
export const playNotificationTune = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioCtx) sharedAudioCtx = new AudioContextClass();
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }

    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    // Tone 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Tone 2: G5 (783.99 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.1);
    gain2.gain.setValueAtTime(0.3, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.22);

    // Tone 3: High C6 (1046.50 Hz) - Bright ringing sustain
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1046.5, now + 0.2);
    gain3.gain.setValueAtTime(0.35, now + 0.2);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.2);
    osc3.stop(now + 0.55);
  } catch (err) {
    console.debug("[PhoneNotification] Audio play failed:", err);
  }
};

// VAPID Public Key generated for Workforce CRM Web Push
export const VAPID_PUBLIC_KEY =
  "BIYt7ALGeT9f89rRzL6tAldELMO9kt7P-D3ZDAE8Af23y1fq5MX_pl-owRktAeaAhTe4IX0uqcaSw0mIfZJDRQQ";

/**
 * Converts URL-safe base64 string to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribes the device to background OS push notifications via W3C Push Service
 */
export const subscribeToWebPush = async (userCode?: string): Promise<boolean> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  try {
    // 1. Ensure service worker is registered
    await navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[WebPush] sw.js registration note:", err);
    });

    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) return false;

    // 2. Check existing subscription or subscribe
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    if (subscription) {
      const subJSON = subscription.toJSON();
      const code = userCode || localStorage.getItem("wcrm_last_user") || "ALL";

      // 3. Send subscription to backend
      const { API_BASE_URL } = await import("@/lib/api");
      const res = await fetch(`${API_BASE_URL}/sync/push-subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subJSON,
          employeeCode: code,
          userAgent: navigator.userAgent,
        }),
      }).catch((e) => console.log("[WebPush] Backend subscribe note:", e));

      return res ? res.ok : true;
    }
    return false;
  } catch (err) {
    console.debug("[WebPush] Subscription setup note:", err);
    return false;
  }
};

/**
 * Triggers an immediate backend Web Push to test sound and vibration on phone
 */
export const triggerTestPhonePush = async (): Promise<{ success: boolean; registered: number; message: string }> => {
  try {
    const { API_BASE_URL } = await import("@/lib/api");
    const res = await fetch(`${API_BASE_URL}/sync/test-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        registered: data.registered_subscribers || 0,
        message: `Alert dispatched to ${data.registered_subscribers || 0} phone(s)!`,
      };
    }
    return { success: false, registered: 0, message: "Backend error triggering push." };
  } catch (e: any) {
    console.error("[WebPush] Test push error:", e);
    return { success: false, registered: 0, message: e.message || "Network error" };
  }
};

/**
 * Ensures device is subscribed to Web Push if permission is granted
 */
export const ensureWebPushSubscribed = async (userCode?: string) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      await subscribeToWebPush(userCode);
    } catch {}
  }
};

/**
 * Requests notification permission from phone operating system
 */
export const requestPhoneNotificationPermission = async (userCode?: string): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  try {
    unlockAudio();
    const perm = await Notification.requestPermission();
    localStorage.setItem("wcrm_notification_permission", perm);
    if (perm === "granted") {
      // Play confirmation tune
      playNotificationTune();
      sendSystemPhoneNotification(
        "🔔 Notifications Active!",
        "You will now receive sound alerts for new tasks & orders even when app is closed.",
        "/app"
      );

      // Register background Web Push subscription
      await subscribeToWebPush(userCode);
      return true;
    }
    return false;
  } catch (err) {
    console.warn("[PhoneNotification] Permission request failed:", err);
    return false;
  }
};

/**
 * Checks if notification permission is currently granted
 */
export const isNotificationPermissionGranted = (): boolean => {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return Notification.permission === "granted";
};

/**
 * Sends OS-level system notification to phone screen / notification bar with tune & vibration
 */
export const sendSystemPhoneNotification = async (
  title: string,
  body: string,
  url: string = "/app"
) => {
  // 1. Always play the sound tune
  playNotificationTune();

  // 2. Hardware vibration (if phone hardware supports vibration)
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch {}
  }

  // 3. Operating System Notification via Service Worker (shows in notification shade even when app in background)
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            data: { url },
            vibrate: [200, 100, 200, 100, 300],
            tag: "crm-alert-" + Date.now(),
            renotify: true,
          } as any);
          return;
        }
      }

      // Fallback to desktop / browser Notification constructor
      new Notification(title, {
        body,
        icon: "/icon-192.png",
        tag: "crm-alert-" + Date.now(),
      });
    } catch (e) {
      console.warn("[PhoneNotification] System notification dispatch note:", e);
    }
  }
};

