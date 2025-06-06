"use client"

import { useState, useEffect } from "react"

export function useOffline() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check connection status more reliably
    const checkConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        await fetch("/api/health", {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store",
        })

        clearTimeout(timeoutId)
        setIsOffline(false)
      } catch (error) {
        setIsOffline(true)
      }
    }

    // Check on mount and periodically
    checkConnection()
    const interval = setInterval(checkConnection, 30000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  return isOffline
}
