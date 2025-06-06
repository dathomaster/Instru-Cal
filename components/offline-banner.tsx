"use client"

import { useOffline } from "@/hooks/use-offline"
import { AlertCircle, WifiOff } from "lucide-react"
import { useState, useEffect } from "react"

export function OfflineBanner() {
  const isOffline = useOffline()
  const [showBanner, setShowBanner] = useState(false)
  const [pendingItems, setPendingItems] = useState(0)

  useEffect(() => {
    // Only show banner when offline
    setShowBanner(isOffline)

    // Try to get pending items count
    try {
      const queue = localStorage.getItem("syncQueue")
      if (queue) {
        setPendingItems(JSON.parse(queue).length)
      }
    } catch (error) {
      console.error("Error getting sync queue:", error)
    }

    // Hide banner after 5 seconds if online
    let timeout: NodeJS.Timeout
    if (!isOffline) {
      timeout = setTimeout(() => {
        setShowBanner(false)
      }, 5000)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [isOffline])

  if (!showBanner) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 ${isOffline ? "bg-amber-100" : "bg-green-100"}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {isOffline ? (
            <>
              <WifiOff className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                You're offline. {pendingItems > 0 && `${pendingItems} items will sync when you're back online.`}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                You're back online! {pendingItems > 0 && `Syncing ${pendingItems} items...`}
              </span>
            </>
          )}
        </div>
        <button onClick={() => setShowBanner(false)} className="text-sm text-gray-500 hover:text-gray-700">
          Dismiss
        </button>
      </div>
    </div>
  )
}
