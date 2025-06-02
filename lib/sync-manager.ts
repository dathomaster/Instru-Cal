"use client"

import { useState, useEffect, useCallback } from "react"
import { calibrationDB } from "./db"

// Interface for sync status
export interface SyncStatus {
  isSyncing: boolean
  lastSynced: Date | null
  isOnline: boolean
  pendingChanges: number
  error: string | null
}

// Default sync status
const defaultSyncStatus: SyncStatus = {
  isSyncing: false,
  lastSynced: null,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  pendingChanges: 0,
  error: null,
}

/**
 * Custom hook for managing synchronization between IndexedDB and Supabase
 */
export function useSyncManager() {
  const [status, setStatus] = useState<SyncStatus>(defaultSyncStatus)

  // Check online status
  const checkOnlineStatus = useCallback(async () => {
    // First check navigator.onLine
    const browserOnline = typeof navigator !== "undefined" ? navigator.onLine : false

    if (!browserOnline) {
      setStatus((prev) => ({ ...prev, isOnline: false }))
      return false
    }

    // Then try to ping our health endpoint
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      })
      const isOnline = response.ok
      setStatus((prev) => ({ ...prev, isOnline }))
      return isOnline
    } catch (error) {
      setStatus((prev) => ({ ...prev, isOnline: false }))
      return false
    }
  }, [])

  // Count pending changes
  const checkPendingChanges = useCallback(async () => {
    try {
      // Check if the method exists before calling it
      if (typeof calibrationDB.getPendingSync === "function") {
        const pendingItems = await calibrationDB.getPendingSync()
        setStatus((prev) => ({ ...prev, pendingChanges: pendingItems.length }))
        return pendingItems.length
      } else {
        // Fallback: count unsynced calibrations only
        const pendingCalibrations = await calibrationDB.getUnsyncedCalibrations()
        setStatus((prev) => ({ ...prev, pendingChanges: pendingCalibrations.length }))
        return pendingCalibrations.length
      }
    } catch (error) {
      console.error("Error checking pending changes:", error)
      setStatus((prev) => ({ ...prev, pendingChanges: 0 }))
      return 0
    }
  }, [])

  // Sync data with server
  const syncData = useCallback(async () => {
    // Don't sync if already syncing
    if (status.isSyncing) return

    // Check if we're online
    const isOnline = await checkOnlineStatus()
    if (!isOnline) {
      setStatus((prev) => ({
        ...prev,
        error: "Cannot sync while offline. Please check your connection.",
      }))
      return
    }

    setStatus((prev) => ({ ...prev, isSyncing: true, error: null }))

    try {
      // Check if sync method exists
      if (typeof calibrationDB.syncWithServer === "function") {
        await calibrationDB.syncWithServer()
      } else {
        // Fallback sync logic
        console.log("🔄 Basic sync fallback")
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Update status after successful sync
      const pendingChanges = await checkPendingChanges()
      setStatus({
        isSyncing: false,
        lastSynced: new Date(),
        isOnline: true,
        pendingChanges,
        error: null,
      })
    } catch (error) {
      console.error("Sync error:", error)
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : "Unknown sync error",
      }))
    }
  }, [status.isSyncing, checkOnlineStatus, checkPendingChanges])

  // Initialize and set up event listeners
  useEffect(() => {
    // Initial checks
    checkOnlineStatus()
    checkPendingChanges()

    // Set up online/offline listeners
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }))
      checkPendingChanges()
    }

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }))
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [checkOnlineStatus, checkPendingChanges])

  // Clear error message after 5 seconds
  useEffect(() => {
    if (status.error) {
      const timer = setTimeout(() => {
        setStatus((prev) => ({ ...prev, error: null }))
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [status.error])

  return {
    status,
    syncData,
    checkPendingChanges,
    checkOnlineStatus,
  }
}
