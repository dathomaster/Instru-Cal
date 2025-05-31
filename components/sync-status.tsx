"use client"

import { useEffect, useState } from "react"
import { syncManager, type SyncStatus } from "@/lib/sync"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    status: "online",
    pendingItems: 0,
  })

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = syncManager.subscribe(setStatus)
    return unsubscribe
  }, [])

  const getStatusIcon = () => {
    switch (status.status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "offline":
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "synced":
        return <Check className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (status.status) {
      case "online":
        return "Online"
      case "offline":
        return "Offline"
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

  const handleForceSync = () => {
    syncManager.forceSync()
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {status.pendingItems > 0 && (
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            {status.pendingItems} pending
          </span>
        )}
      </div>
      {status.lastSyncTime && status.status !== "syncing" && (
        <div className="text-xs text-gray-500">
          Last sync: {formatDistanceToNow(status.lastSyncTime, { addSuffix: true })}
        </div>
      )}
      {status.status !== "syncing" && status.pendingItems > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleForceSync}
          disabled={status.status === "offline"}
          title="Force sync"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
