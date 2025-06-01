"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { syncManager, type SyncStatus } from "@/lib/sync"

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    status: "offline",
    pendingItems: 0,
  })

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setStatus)
    return unsubscribe
  }, [])

  const getStatusIcon = () => {
    switch (status.status) {
      case "online":
        return <Wifi className="h-4 w-4" />
      case "offline":
        return <WifiOff className="h-4 w-4" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "synced":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
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
    switch (status.status) {
      case "online":
        return "Online"
      case "offline":
        return "Offline Mode"
      case "syncing":
        return "Syncing..."
      case "synced":
        return "Synced"
      case "error":
        return "Sync Error"
      default:
        return "Unknown"
    }
  }

  const formatLastSync = () => {
    if (!status.lastSyncTime) return "Never"
    const date = new Date(status.lastSyncTime)
    return date.toLocaleTimeString()
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Badge variant="secondary" className={`${getStatusColor()} text-white`}>
        {getStatusIcon()}
        <span className="ml-2">{getStatusText()}</span>
        {status.pendingItems > 0 && (
          <span className="ml-2 bg-white text-gray-900 px-2 py-0.5 rounded-full text-xs">{status.pendingItems}</span>
        )}
      </Badge>

      {status.status === "online" && status.pendingItems > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => syncManager.forceSync()}
          disabled={status.status === "syncing"}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${status.status === "syncing" ? "animate-spin" : ""}`} />
          Sync Now
        </Button>
      )}

      {status.lastSyncTime && (
        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Last sync: {formatLastSync()}</div>
      )}
    </div>
  )
}
