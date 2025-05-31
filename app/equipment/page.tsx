"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Plus, Wrench, Calendar } from "lucide-react"
import { calibrationDB, type Equipment } from "@/lib/db"

interface EquipmentWithCustomer extends Equipment {
  customerName: string
  lastCalibration?: string
  nextCalibration?: string
  status: "active" | "needs_calibration" | "out_of_service"
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentWithCustomer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    try {
      const [allEquipment, customers, calibrations] = await Promise.all([
        calibrationDB.getAllEquipment(),
        calibrationDB.getCustomers(),
        calibrationDB.getAllCalibrations(),
      ])

      const equipmentWithDetails = allEquipment.map((eq) => {
        const customer = customers.find((c) => c.id === eq.customerId)
        const equipmentCalibrations = calibrations.filter((cal) => cal.equipmentId === eq.id)

        // Find the most recent calibration
        const lastCalibration = equipmentCalibrations.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0]

        let status: "active" | "needs_calibration" | "out_of_service" = "needs_calibration"
        let nextCalibration = "Not scheduled"

        if (lastCalibration) {
          const lastDate = new Date(lastCalibration.date)
          const nextDate = new Date(lastDate)
          nextDate.setFullYear(nextDate.getFullYear() + 1)
          nextCalibration = nextDate.toLocaleDateString()

          const now = new Date()
          const daysUntilDue = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilDue > 30) {
            status = "active"
          } else if (daysUntilDue >= 0) {
            status = "needs_calibration"
          } else {
            status = "out_of_service"
          }
        }

        return {
          ...eq,
          customerName: customer?.name || "Unknown Customer",
          lastCalibration: lastCalibration?.date || "Never",
          nextCalibration,
          status,
        }
      })

      setEquipment(equipmentWithDetails)
    } catch (error) {
      console.error("Error loading equipment:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEquipment = equipment.filter(
    (eq) =>
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600"
      case "needs_calibration":
        return "bg-yellow-600"
      case "out_of_service":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "needs_calibration":
        return "Needs Calibration"
      case "out_of_service":
        return "Out of Service"
      default:
        return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
            </div>
            <Link href="/equipment/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
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
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((eq) => (
            <Card key={eq.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{eq.name}</CardTitle>
                  <Badge className={getStatusColor(eq.status)}>{getStatusText(eq.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600 capitalize">{eq.type.replace("_", " & ")}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Serial Number</p>
                  <p className="text-sm text-gray-600">{eq.serialNumber || "Not specified"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-gray-600">{eq.customerName}</p>
                </div>

                {eq.specifications?.capacity && (
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="text-sm text-gray-600">{eq.specifications.capacity}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Last calibration</p>
                    <p className="text-sm text-gray-600">
                      {eq.lastCalibration === "Never" ? "Never" : new Date(eq.lastCalibration!).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Next calibration</p>
                    <p className="text-sm text-gray-600">{eq.nextCalibration}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Link href={`/equipment/${eq.id}/details`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/calibrations/new?customer=${eq.customerId}&equipment=${eq.id}`}>
                    <Button className="flex-1">Calibrate</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEquipment.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {equipment.length === 0 ? "No equipment found" : "No equipment matches your search"}
            </p>
            <Link href="/equipment/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {equipment.length === 0 ? "Add Your First Equipment" : "Add Equipment"}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
