"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = () => {
    setIsRetrying(true)
    // Try to reload the page
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-yellow-100 p-3 rounded-full">
            <WifiOff className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p>You appear to be offline. Some features may be limited until your connection is restored.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleRetry} disabled={isRetrying}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {isRetrying ? "Checking connection..." : "Check Connection"}
            </Button>

            <Link href="/" passHref>
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
