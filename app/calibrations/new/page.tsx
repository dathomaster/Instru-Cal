"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { calibrationDB } from "@/lib/db"

export default function NewCalibrationPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Check if offline
    setIsOffline(!navigator.onLine)

    const loadCustomers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initialize the database
        await calibrationDB.init()

        // Get all customers
        const allCustomers = await calibrationDB.getCustomers()
        setCustomers(allCustomers)
      } catch (err) {
        console.error("Error loading customers:", err)
        setError("Failed to load customers. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  const handleSelectCalibration = (type: string) => {
    // Store the selection in localStorage for offline access
    localStorage.setItem("selectedCalibrationType", type)

    // Navigate to the customer selection page
    router.push(`/calibrations/select-customer?type=${type}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/calibrations">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">New Calibration</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isOffline && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Offline Mode</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    You are currently offline. You can still create calibrations, but they will be saved locally until
                    you reconnect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Load Cell Calibration</CardTitle>
              <CardDescription>Calibrate load cells for tension and compression</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleSelectCalibration("load_cell")} className="w-full" disabled={isLoading}>
                Select
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Speed & Displacement Calibration</CardTitle>
              <CardDescription>Calibrate speed and displacement sensors</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleSelectCalibration("speed_displacement")}
                className="w-full"
                disabled={isLoading}
              >
                Select
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
