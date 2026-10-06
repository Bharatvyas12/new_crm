// Workforce CRM Service Worker for PWA Offline, Quick Launch & System Push Notifications
const CACHE_NAME = "wcrm-pwa-v3";
const STATIC_ASSETS = [
  "/",
  "/app",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log("[SW] Pre-cache item failed, continuing:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy for dynamic data, cache fallback for assets
self.addEventListener("fetch", (event) => {
  // Only handle GET requests and skip api sync requests from caching
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("/");
        });
      })
  );
});

// Handle background Web Push Notifications from OS / Push Service when app is closed
self.addEventListener("push", (event) => {
  let data = {
    title: "Workforce CRM Alert",
    body: "New update on task, attendance or orders.",
    url: "/app",
    tag: "wcrm-push-" + Date.now(),
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [300, 150, 300, 150, 400],
    tag: data.tag || "wcrm-" + Date.now(),
    renotify: true,
    data: {
      url: data.url || "/app",
      timestamp: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Workforce CRM Alert", options).catch((err) => {
      console.warn("[SW] showNotification fallback error:", err);
    })
  );
});

// Handle phone notification clicks: Open or focus CRM app window
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/app";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

