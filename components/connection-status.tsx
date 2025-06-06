"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { syncManager, type SyncStatus } from "@/lib/sync"
import { cn } from "@/lib/utils"

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: "offline",
    pendingItems: 0,
  })
  const [showAlert, setShowAlert] = useState(false)
  const [lastOnlineState, setLastOnlineState] = useState(true)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)

      // If state changed, show alert
      if (online !== lastOnlineState) {
        setShowAlert(true)
        setLastOnlineState(online)

        // Auto-hide after 5 seconds
        setTimeout(() => setShowAlert(false), 5000)
      }
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Subscribe to sync status
    const unsubscribe = syncManager.subscribe(setSyncStatus)

    // Initial check
    updateOnlineStatus()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
      unsubscribe()
    }
  }, [lastOnlineState])

  // Don't render anything if we're online and there's nothing to show
  if (isOnline && !showAlert && syncStatus.pendingItems === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md transition-all duration-300 ease-in-out">
      {showAlert && (
        <Alert
          className={cn(
            "mb-2 shadow-lg border-l-4",
            isOnline ? "border-l-green-500 bg-green-50" : "border-l-amber-500 bg-amber-50",
          )}
        >
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-600 mr-2" />
            )}
            <div>
              <AlertTitle>{isOnline ? "Connection Restored" : "You're Offline"}</AlertTitle>
              <AlertDescription>
                {isOnline
                  ? "Your internet connection has been restored. Any pending changes will sync automatically."
                  : "Don't worry! The app will continue to work offline. Changes will sync when you're back online."}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {!isOnline && !showAlert && (
        <Alert className="shadow-lg border-l-4 border-l-amber-500 bg-amber-50">
          <div className="flex items-center">
            <WifiOff className="h-5 w-5 text-amber-600 mr-2" />
            <div>
              <AlertTitle>Offline Mode</AlertTitle>
              <AlertDescription>
                You're working offline. All changes are saved locally and will sync when you reconnect.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {isOnline && !showAlert && syncStatus.pendingItems > 0 && (
        <Alert className="shadow-lg border-l-4 border-l-blue-500 bg-blue-50">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <AlertTitle>Syncing Data</AlertTitle>
              <AlertDescription>
                {syncStatus.pendingItems} {syncStatus.pendingItems === 1 ? "item" : "items"} waiting to sync.
                {syncStatus.status === "syncing" ? " Syncing in progress..." : ""}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </div>
  )
}
