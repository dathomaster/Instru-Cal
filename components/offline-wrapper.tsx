"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface OfflineWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requiresOnline?: boolean
}

export function OfflineWrapper({ children, fallback, requiresOnline = false }: OfflineWrapperProps) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Set initial state
    setIsOnline(navigator.onLine)
    setHasInitialized(true)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Don't render anything until we've checked online status
  if (!hasInitialized) {
    return null
  }

  // If we require online mode and we're offline, show fallback or default message
  if (requiresOnline && !isOnline) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Offline Mode</AlertTitle>
        <AlertDescription>
          This feature requires an internet connection. Please connect to the internet and try again.
        </AlertDescription>
      </Alert>
    )
  }

  // If we're offline but don't require online mode, or if we're online, show children
  return <>{children}</>
}
