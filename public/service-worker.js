// Simple and robust service worker for offline functionality
const CACHE_NAME = "calibration-app-v1"
const OFFLINE_URL = "/offline"

// Only cache essential resources that we know exist
const PRECACHE_ASSETS = ["/", "/offline", "/manifest.json"]

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching essential resources")
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err)
          }),
        ),
      )
    }),
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  event.waitUntil(
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
      })
      .then(() => {
        // Take control of all clients
        return self.clients.claim()
      }),
  )
})

// Fetch event - simple cache/network strategy
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return

  // Skip browser extensions
  if (event.request.url.includes("chrome-extension")) return

  // Handle the fetch with a cache-first, falling back to network strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse
      }

      // Otherwise try the network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response
          }

          // Cache successful responses
          const responseToCache = response.clone()
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
            .catch((err) => console.warn("Failed to cache response:", err))

          return response
        })
        .catch((error) => {
          console.log("Fetch failed; returning offline page instead.", error)

          // For navigation requests, return the offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL)
          }

          // For other requests, return an empty response
          return new Response("", {
            status: 503,
            statusText: "Service Unavailable",
          })
        })
    }),
  )
})

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
