"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { calibrationDB, type Calibration } from "@/lib/db"

export default function CalibrationDebugPage() {
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalibrations()
  }, [])

  const loadCalibrations = async () => {
    try {
      await calibrationDB.init()
      const allCalibrations = await calibrationDB.getAllCalibrations()
      setCalibrations(allCalibrations)
      console.log("All calibrations:", allCalibrations)
    } catch (error) {
      console.error("Error loading calibrations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calibrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/calibrations">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calibration Debug</h1>
                <p className="text-sm text-gray-600">All calibrations in the database</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {calibrations.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">No Calibrations Found</h2>
            <p className="text-gray-600 mb-6">There are no calibrations in the database.</p>
            <Link href="/calibrations/new">
              <Button>Create First Calibration</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">
              Found {calibrations.length} calibration{calibrations.length !== 1 ? "s" : ""}
            </h2>

            <div className="grid gap-4">
              {calibrations.map((calibration) => (
                <div key={calibration.id} className="bg-white p-6 rounded-lg shadow border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Calibration ID</h3>
                      <p className="text-sm text-gray-600 font-mono">{calibration.id}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Report Number</h3>
                      <p className="text-sm text-gray-600">{calibration.data?.reportNumber || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Type</h3>
                      <p className="text-sm text-gray-600">{calibration.type}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Technician</h3>
                      <p className="text-sm text-gray-600">{calibration.technician}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Date</h3>
                      <p className="text-sm text-gray-600">{new Date(calibration.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Result</h3>
                      <p
                        className={`text-sm font-medium ${calibration.result === "pass" ? "text-green-600" : "text-red-600"}`}
                      >
                        {calibration.result}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/calibrations/${calibration.id}/report`}>
                      <Button size="sm">View Report</Button>
                    </Link>
                    <Link href={`/calibrations/${calibration.id}/edit`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
