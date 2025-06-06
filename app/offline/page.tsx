"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, Home, RefreshCw, Database } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function OfflinePage() {
  const [pendingItems, setPendingItems] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  useEffect(() => {
    // Try to get sync info from localStorage
    try {
      const queue = localStorage.getItem("syncQueue")
      if (queue) {
        setPendingItems(JSON.parse(queue).length)
      }

      const lastSync = localStorage.getItem("lastSyncTime")
      if (lastSync) {
        const date = new Date(Number.parseInt(lastSync))
        setLastSyncTime(date.toLocaleString())
      }
    } catch (error) {
      console.error("Error getting sync info:", error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-amber-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <WifiOff className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>
            Don't worry! The app works offline and your data is safely stored on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-800 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Offline Data Status
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>Pending items to sync: {pendingItems}</p>
              {lastSyncTime && <p>Last synced: {lastSyncTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>

            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Connection
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>You can continue using the app while offline.</p>
            <p>Your changes will sync automatically when you're back online.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
