"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Plus, FileText, Calendar, User } from "lucide-react"
import { calibrationDB, type Calibration } from "@/lib/db"

interface CalibrationWithDetails extends Calibration {
  customerName: string
  equipmentName: string
}

export default function CalibrationsPage() {
  const [calibrations, setCalibrations] = useState<CalibrationWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalibrations()
  }, [])

  const loadCalibrations = async () => {
    try {
      const [allCalibrations, customers, equipment] = await Promise.all([
        calibrationDB.getAllCalibrations(),
        calibrationDB.getCustomers(),
        calibrationDB.getAllEquipment(),
      ])

      const calibrationsWithDetails = allCalibrations.map((calibration) => {
        const customer = customers.find((c) => c.id === calibration.customerId)
        const eq = equipment.find((e) => e.id === calibration.equipmentId)

        return {
          ...calibration,
          customerName: customer?.name || "Unknown Customer",
          equipmentName: eq?.name || "Unknown Equipment",
        }
      })

      setCalibrations(calibrationsWithDetails)
    } catch (error) {
      console.error("Error loading calibrations:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCalibrations = calibrations.filter(
    (calibration) =>
      calibration.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calibration.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calibration.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calibration.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Calibrations</h1>
            </div>
            <Link href="/calibrations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Calibration
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search calibrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredCalibrations
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((calibration) => (
              <Card key={calibration.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-medium">{calibration.type.replace("_", " & ")} Calibration</h3>
                        <Badge
                          variant={calibration.result === "pass" ? "default" : "destructive"}
                          className={calibration.result === "pass" ? "bg-green-600" : ""}
                        >
                          {calibration.result.toUpperCase()}
                        </Badge>
                        {!calibration.synced && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Pending Sync
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{calibration.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{calibration.equipmentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(calibration.date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <span>Technician: {calibration.technician}</span>
                        {calibration.temperature && <span className="ml-4">Temp: {calibration.temperature}°F</span>}
                        {calibration.humidity && <span className="ml-4">Humidity: {calibration.humidity}%</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link href={`/calibrations/${calibration.id}/report`}>
                        <Button variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      </Link>
                      <Link
                        href={`/calibrations/form/${calibration.type}?customer=${calibration.customerId}&equipment=${calibration.equipmentId}`}
                      >
                        <Button>Recalibrate</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {filteredCalibrations.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {calibrations.length === 0 ? "No calibrations found" : "No calibrations match your search"}
            </p>
            <Link href="/calibrations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {calibrations.length === 0 ? "Perform Your First Calibration" : "New Calibration"}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
