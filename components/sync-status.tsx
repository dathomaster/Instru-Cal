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

  const formatLastSync = () => {
    if (!status.lastSyncTime) return "Never"
    const date = new Date(status.lastSyncTime)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="fixed top-2 right-2 z-40 flex items-center gap-1">
      <Badge variant="secondary" className={`${getStatusColor()} text-white text-xs px-2 py-1`}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
        {status.pendingItems > 0 && (
          <span className="ml-1 bg-white text-gray-900 px-1 rounded text-xs">{status.pendingItems}</span>
        )}
      </Badge>

      {status.status === "online" && status.pendingItems > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => syncManager.forceSync()}
          disabled={status.status === "syncing"}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${status.status === "syncing" ? "animate-spin" : ""}`} />
        </Button>
      )}

      {status.lastSyncTime && (
        <div className="text-xs text-gray-500 bg-white px-1 py-0.5 rounded border text-center min-w-[60px]">
          {formatLastSync()}
        </div>
      )}
    </div>
  )
}
