"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw, Home, Database } from "lucide-react"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    // Try to reload the page
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {isOnline ? <Wifi className="h-16 w-16 text-green-500" /> : <WifiOff className="h-16 w-16 text-red-500" />}
          </div>
          <CardTitle className="text-2xl">{isOnline ? "Connection Restored!" : "You're Offline"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge variant={isOnline ? "default" : "secondary"} className={isOnline ? "bg-green-600" : ""}>
              {isOnline ? "Online" : "Offline Mode"}
            </Badge>
          </div>

          <div className="text-sm text-gray-600 text-center space-y-2">
            {isOnline ? (
              <div>
                <p>Your internet connection has been restored.</p>
                <p>You can now sync your offline data.</p>
              </div>
            ) : (
              <div>
                <p>Don't worry! CalibrationPro works offline.</p>
                <p>Your data is saved locally and will sync when you're back online.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Available Offline Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Create and edit calibrations
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                View existing data
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Generate reports
              </li>
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Manage customers & equipment
              </li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Button onClick={handleRetry} variant="default" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry {retryCount > 0 && `(${retryCount})`}
            </Button>
          </div>

          {isOnline && (
            <div className="text-center">
              <p className="text-sm text-green-600">✅ Ready to sync your offline changes!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
