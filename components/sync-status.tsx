"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { syncManager, type SyncStatus } from "@/lib/sync"

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    status: "offline",
    pendingItems: 0,
  })
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : false)

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const unsubscribe = syncManager.subscribe(setStatus)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      unsubscribe()
    }
  }, [])

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />

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
    <Badge variant="secondary" className={`${getStatusColor()} text-white text-xs px-2 py-1`}>
      {getStatusIcon()}
      <span className="ml-1">{getStatusText()}</span>
      {status.pendingItems > 0 && (
        <span className="ml-1 bg-white text-gray-900 px-1 rounded text-xs">{status.pendingItems}</span>
      )}
    </Badge>
  )
}
