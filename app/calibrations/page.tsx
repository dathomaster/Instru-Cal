"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSyncManager } from "@/lib/sync-manager"
import { useCalibrations } from "@/lib/hooks/use-calibrations"
import type { Calibration } from "@/lib/types"
import Link from "next/link"

export default function CalibrationsPage() {
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()
  const syncManager = useSyncManager()
  const { calibrations, loadCalibrations } = useCalibrations()

  useEffect(() => {
    loadCalibrations()
  }, [])

  const handlePrintReport = (calibrationId: string) => {
    // Navigate to report page with print parameter - this should work offline
    window.open(`/calibrations/${calibrationId}/report?print=true`, "_blank")
  }

  const handleForceSync = async () => {
    if (!navigator.onLine) {
      alert("Cannot sync while offline. Data will sync automatically when connection is restored.")
      return
    }

    try {
      setSyncing(true)
      await syncManager.forceSync()
      // Reload data after sync
      await loadCalibrations()
    } catch (error) {
      console.error("Sync failed:", error)
      alert("Sync failed. Please try again.")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <h1>Calibrations</h1>
      <button onClick={handleForceSync} disabled={syncing}>
        {syncing ? "Syncing..." : "Force Sync"}
      </button>
      <ul>
        {calibrations ? (
          calibrations.map((calibration: Calibration) => (
            <li key={calibration.id}>
              <Link href={`/calibrations/${calibration.id}`}>Calibration {calibration.id}</Link>
              <button onClick={() => handlePrintReport(calibration.id)}>Print Report</button>
            </li>
          ))
        ) : (
          <li>Loading calibrations...</li>
        )}
      </ul>
      <Link href="/calibrations/new">New Calibration</Link>
    </div>
  )
}
