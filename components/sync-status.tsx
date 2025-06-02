"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react"

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<{
    status: "online" | "offline" | "syncing" | "synced" | "error"
    pendingItems: number
    lastSyncTime?: number
    error?: string
  }>({
    status: "offline",
    pendingItems: 0,
  })
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setStatus((prev) => ({ ...prev, status: "online" }))
    }

    const handleOffline = () => {
      setIsOnline(false)
      setStatus((prev) => ({ ...prev, status: "offline" }))
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Try to subscribe to sync manager if available
    let unsubscribe: (() => void) | null = null

    try {
      // Dynamically import sync manager to avoid circular dependencies
      import("../lib/sync")
        .then(({ syncManager }) => {
          if (syncManager && syncManager.subscribe) {
            unsubscribe = syncManager.subscribe(setStatus)
          }
        })
        .catch(() => {
          console.log("Sync manager not available, running in offline-only mode")
        })
    } catch (error) {
      console.log("Sync manager not available, running in offline-only mode")
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const handleForceSync = async () => {
    if (!isOnline) {
      alert("Cannot sync while offline. Please check your internet connection.")
      return
    }

    setIsSyncing(true)
    try {
      const { syncManager } = await import("../lib/sync")
      if (syncManager && syncManager.forceSync) {
        await syncManager.forceSync()
        setStatus((prev) => ({ ...prev, status: "synced" }))
      } else {
        throw new Error("Sync manager not available")
      }
    } catch (error) {
      console.error("Force sync failed:", error)
      setStatus((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Sync failed",
      }))
      alert("Sync failed. Please try again later.")
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />
    if (isSyncing) return <RefreshCw className="h-3 w-3 animate-spin" />

    switch (status.status) {
      case "online":
        return <Wifi className="h-3 w-3" />
      case "offline":
        return <WifiOff className="h-3 w-3" />
      case "syncing":
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case "synced":
        return <CheckCircle className="h-3 w-3" />
      case "error":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = () => {
    if (!isOnline) return "bg-gray-600"

    switch (status.status) {
      case "online":
      case "synced":
        return "bg-green-600"
      case "offline":
        return "bg-gray-600"
      case "syncing":
        return "bg-blue-600"
      case "error":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusText = () => {
    if (!isOnline) return "Offline"
    if (isSyncing) return "Syncing"

    switch (status.status) {
      case "online":
        return "Online"
      case "offline":
        return "Offline"
      case "syncing":
        return "Syncing"
      case "synced":
        return "Synced"
      case "error":
        return "Error"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className={`${getStatusColor()} text-white text-xs px-2 py-1`}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
        {status.pendingItems > 0 && (
          <span className="ml-1 bg-white text-gray-900 px-1 rounded text-xs">{status.pendingItems}</span>
        )}
      </Badge>

      {isOnline && status.pendingItems > 0 && (
        <Button size="sm" variant="outline" onClick={handleForceSync} disabled={isSyncing} className="text-xs h-6 px-2">
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync Now
            </>
          )}
        </Button>
      )}
    </div>
  )
}
