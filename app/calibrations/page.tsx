"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Printer, Edit, Calendar, User, CheckCircle, XCircle } from "lucide-react"
import { calibrationDB, type Calibration, type Equipment, type Customer } from "@/lib/db"

export default function CalibrationsPage() {
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await calibrationDB.init()

      const [calibrationsData, equipmentData, customersData] = await Promise.all([
        calibrationDB.getAllCalibrations(),
        calibrationDB.getAllEquipment(),
        calibrationDB.getCustomers(),
      ])

      console.log("📊 Loaded calibrations:", calibrationsData.length)
      console.log("🔧 Loaded equipment:", equipmentData.length)
      console.log("👥 Loaded customers:", customersData.length)

      setCalibrations(calibrationsData)
      setEquipment(equipmentData)
      setCustomers(customersData)
    } catch (error) {
      console.error("❌ Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrintReport = (calibrationId: string) => {
    console.log("🖨️ Opening print report for calibration:", calibrationId)
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
      // Try to get sync manager
      const { syncManager } = await import("@/lib/sync")
      await syncManager.forceSync()
      // Reload data after sync
      await loadData()
      alert("Sync completed successfully!")
    } catch (error) {
      console.error("Sync failed:", error)
      alert("Sync failed. Please try again.")
    } finally {
      setSyncing(false)
    }
  }

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId)
    return eq?.name || "Unknown Equipment"
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    return customer?.name || "Unknown Customer"
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
            <h1 className="text-2xl font-bold text-gray-900">Calibrations</h1>
            <div className="flex items-center gap-2">
              <Button onClick={handleForceSync} disabled={syncing} variant="outline">
                {syncing ? "Syncing..." : "Force Sync"}
              </Button>
              <Link href="/calibrations/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Calibration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {calibrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calibrations found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first calibration.</p>
              <Link href="/calibrations/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Calibration
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calibrations
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((calibration) => (
                <Card key={calibration.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {calibration.type === "load_cell" ? "Load Cell" : "Speed & Displacement"}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{getEquipmentName(calibration.equipmentId)}</p>
                      </div>
                      <Badge
                        variant={calibration.result === "pass" ? "default" : "destructive"}
                        className={calibration.result === "pass" ? "bg-green-600" : ""}
                      >
                        {calibration.result === "pass" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {calibration.result.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {calibration.technician}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(calibration.date).toLocaleDateString()}
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Customer:</strong> {getCustomerName(calibration.customerId)}
                    </div>

                    <div className="text-xs text-gray-500">
                      <strong>ID:</strong> {calibration.id.substring(0, 8)}...
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={`/calibrations/${calibration.id}/report`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Report
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintReport(calibration.id)}
                        className="px-3"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Link href={`/calibrations/${calibration.id}/edit`}>
                        <Button variant="outline" size="sm" className="px-3">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}
