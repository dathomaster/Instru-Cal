"use client"

import { useState, useEffect } from "react"

/**
 * Hook to track online/offline status
 * @returns Object with isOnline status and lastChanged timestamp
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [lastChanged, setLastChanged] = useState<Date | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastChanged(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
      setLastChanged(new Date())
    }

    // Set initial timestamp
    setLastChanged(new Date())

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isOnline, lastChanged }
}
