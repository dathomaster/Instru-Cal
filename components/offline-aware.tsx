"use client"

import { useOffline } from "@/hooks/use-offline"
import { AlertCircle, Wifi, WifiOff } from "lucide-react"
import type { ReactNode } from "react"

interface OfflineAwareProps {
  children: ReactNode
  fallback?: ReactNode
  showIndicator?: boolean
}

export function OfflineAware({ children, fallback, showIndicator = true }: OfflineAwareProps) {
  const isOffline = useOffline()

  if (!isOffline) {
    return (
      <>
        {showIndicator && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium shadow-md">
            <Wifi className="h-3 w-3" />
            <span>Online</span>
          </div>
        )}
        {children}
      </>
    )
  }

  if (fallback) {
    return (
      <>
        {showIndicator && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium shadow-md">
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </div>
        )}
        {fallback}
      </>
    )
  }

  return (
    <>
      {showIndicator && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium shadow-md">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </div>
      )}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800">You're currently offline</h3>
          <p className="text-amber-700 text-sm mt-1">
            This app works offline! Your data will be saved locally and synced when you're back online.
          </p>
        </div>
      </div>
      {children}
    </>
  )
}
