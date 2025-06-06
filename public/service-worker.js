// Service Worker for CalibrationPro PWA - Enhanced for full offline functionality
const CACHE_NAME = "calibration-pro-v3"
const OFFLINE_URL = "/offline"

// Comprehensive list of assets to cache for full offline functionality
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/calibrations",
  "/calibrations/new",
  "/calibrations/form/load_cell",
  "/calibrations/form/speed_displacement",
  "/customers",
  "/customers/new",
  "/equipment",
  "/equipment/new",
  "/tools",
  "/tools/new",
  "/upcoming",
  "/api/health",
  // Add common static assets
  "/_next/static/css/app/layout.css",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/pages/_app.js",
]

// Install event - precache all critical assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache, adding precache assets")
      // Add assets one by one to avoid failures
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err)
            return null
          }),
        ),
      )
    }),
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches and take control
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                console.log("Deleting old cache:", cacheName)
                return caches.delete(cacheName)
              }
            }),
          )
        }),
      // Take control of all clients immediately
      self.clients.claim(),
    ]),
  )
})

// Fetch event - Cache First strategy for app pages, Network First for API calls
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip browser extensions and chrome-extension URLs
  if (url.protocol === "chrome-extension:" || url.href.includes("extension")) {
    return
  }

  // Skip Supabase API requests - these should fail gracefully when offline
  if (url.href.includes("supabase.co")) {
    return
  }

  // Handle navigation requests (page loads)
  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event.request))
    return
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(event.request))
    return
  }

  // Handle static assets and other resources
  event.respondWith(handleResourceRequest(event.request))
})

// Handle navigation requests with cache-first strategy
async function handleNavigationRequest(request) {
  try {
    // Try cache first for navigation
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log("Serving navigation from cache:", request.url)
      return cachedResponse
    }

    // Try network if not in cache
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      // Cache successful network responses
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error("Network response not ok")
  } catch (error) {
    console.log("Navigation request failed, serving offline page:", error)
    // Serve offline page for failed navigation
    const offlineResponse = await caches.match(OFFLINE_URL)
    return offlineResponse || new Response("Offline", { status: 503 })
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      // Cache successful API responses
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error("Network response not ok")
  } catch (error) {
    console.log("API request failed, trying cache:", error)
    // Try cache if network fails
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return empty JSON if no cache
    return new Response(JSON.stringify({ error: "Offline", message: "You are currently offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Handle resource requests (JS, CSS, images, etc.)
async function handleResourceRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Try network
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error("Network response not ok")
  } catch (error) {
    console.log("Resource request failed:", request.url, error)
    // Return a basic response for failed resources
    return new Response("", { status: 404 })
  }
}

// Background sync for offline data
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)
  if (event.tag === "sync-data") {
    event.waitUntil(syncData())
  }
})

// Function to sync data with server
async function syncData() {
  try {
    console.log("Starting background sync...")
    // Send message to client to initiate sync
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_STARTED",
      })
    })

    return true
  } catch (error) {
    console.error("Background sync failed:", error)
    return false
  }
}

// Listen for push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {}

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

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
