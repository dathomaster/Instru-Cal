// Service Worker for CalibrationPro PWA
const CACHE_NAME = "calibration-pro-v1"
const OFFLINE_URL = "/offline"

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon.png",
]

// Install event - precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(PRECACHE_ASSETS)
    }),
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  // Take control of clients immediately
  self.clients.claim()
})

// Fetch event - network first with cache fallback strategy
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and browser extensions
  if (
    event.request.method !== "GET" ||
    event.request.url.startsWith("chrome-extension") ||
    event.request.url.includes("extension") ||
    // Skip Supabase API requests - we don't want to cache these
    event.request.url.includes("supabase.co")
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone it and store in cache
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // If not in cache, serve offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL)
          }
          // Return 404 for other requests
          return new Response(null, { status: 404 })
        })
      }),
  )
})

// Background sync for offline data
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncData())
  }
})

// Function to sync data with server
async function syncData() {
  try {
    // Send message to client to initiate sync
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_STARTED",
      })
    })

    // The actual sync will be handled by the client
    // This just triggers the process
    return true
  } catch (error) {
    console.error("Background sync failed:", error)
    return false
  }
}

// Listen for push notifications
self.addEventListener("push", (event) => {
  const data = event.data.json()

  const options = {
    body: data.body || "New notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-icon.png",
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(data.title || "Notification", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url))
})
