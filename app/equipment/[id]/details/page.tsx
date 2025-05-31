"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Wrench, FileText, User } from "lucide-react"
import { calibrationDB, type Equipment, type Customer, type Calibration } from "@/lib/db"

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-gray-700">{children}</label>
}

export default function EquipmentDetailPage() {
  const params = useParams()
  const equipmentId = params.id as string

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEquipmentData()
  }, [equipmentId])

  const loadEquipmentData = async () => {
    try {
      // Ensure database is initialized
      await calibrationDB.init()

      const allEquipment = await calibrationDB.getAllEquipment()
      const foundEquipment = allEquipment.find((eq) => eq.id === equipmentId)

      if (foundEquipment) {
        setEquipment(foundEquipment)

        // Load customer data
        const customers = await calibrationDB.getCustomers()
        const foundCustomer = customers.find((c) => c.id === foundEquipment.customerId)
        setCustomer(foundCustomer || null)

        // Load calibration history
        const equipmentCalibrations = await calibrationDB.getCalibrationsByEquipment(equipmentId)
        setCalibrations(equipmentCalibrations)
      } else {
        console.log("Equipment not found with ID:", equipmentId)
        console.log("Available equipment:", allEquipment)
      }
    } catch (error) {
      console.error("Error loading equipment:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment details...</p>
        </div>
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Equipment Not Found</h2>
          <p className="text-gray-600 mb-4">The equipment with ID "{equipmentId}" could not be found.</p>
          <Link href="/equipment">
            <Button>Back to Equipment</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getNextCalibrationDate = () => {
    if (calibrations.length === 0) return "Not scheduled"

    const lastCalibration = calibrations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    const lastDate = new Date(lastCalibration.date)
    const nextDate = new Date(lastDate)
    nextDate.setFullYear(nextDate.getFullYear() + 1)

    return nextDate.toLocaleDateString()
  }

  const getCalibrationStatus = () => {
    if (calibrations.length === 0) return "needs_calibration"

    const lastCalibration = calibrations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    const lastDate = new Date(lastCalibration.date)
    const nextDate = new Date(lastDate)
    nextDate.setFullYear(nextDate.getFullYear() + 1)

    const now = new Date()
    const daysUntilDue = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) return "overdue"
    if (daysUntilDue < 30) return "due_soon"
    return "active"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600"
      case "due_soon":
        return "bg-yellow-600"
      case "overdue":
        return "bg-red-600"
      case "needs_calibration":
        return "bg-orange-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "due_soon":
        return "Due Soon"
      case "overdue":
        return "Overdue"
      case "needs_calibration":
        return "Needs Calibration"
      default:
        return "Unknown"
    }
  }

  const status = getCalibrationStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/equipment">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
            </div>
            <Badge className={getStatusColor(status)}>{getStatusText(status)}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Equipment Name</Label>
                  <p className="text-lg font-medium">{equipment.name}</p>
                </div>

                <div>
                  <Label>Type</Label>
                  <p className="text-gray-700 capitalize">{equipment.type.replace("_", " & ")}</p>
                </div>

                <div>
                  <Label>Serial Number</Label>
                  <p className="text-gray-700">{equipment.serialNumber || "Not specified"}</p>
                </div>

                <div>
                  <Label>Customer</Label>
                  {customer ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <Link href={`/customers/${customer.id}/details`} className="text-blue-600 hover:underline">
                        {customer.name}
                      </Link>
                    </div>
                  ) : (
                    <p className="text-gray-500">Customer not found</p>
                  )}
                </div>

                {equipment.specifications?.capacity && (
                  <div>
                    <Label>Capacity</Label>
                    <p className="text-gray-700">{equipment.specifications.capacity}</p>
                  </div>
                )}

                {equipment.specifications?.accuracy && (
                  <div>
                    <Label>Accuracy</Label>
                    <p className="text-gray-700">{equipment.specifications.accuracy}</p>
                  </div>
                )}

                <div>
                  <Label>Next Calibration</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{getNextCalibrationDate()}</p>
                  </div>
                </div>

                <div>
                  <Label>Total Calibrations</Label>
                  <p className="text-gray-700">{calibrations.length}</p>
                </div>
              </div>

              {equipment.specifications?.notes && (
                <div className="pt-4 border-t">
                  <Label>Notes</Label>
                  <p className="text-gray-700 whitespace-pre-wrap">{equipment.specifications.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/calibrations/new?customer=${equipment.customerId}&equipment=${equipment.id}`}>
                <Button className="w-full">New Calibration</Button>
              </Link>
              {customer && (
                <Link href={`/customers/${customer.id}/details`}>
                  <Button variant="outline" className="w-full">
                    View Customer
                  </Button>
                </Link>
              )}
              <Link href="/equipment">
                <Button variant="outline" className="w-full">
                  Back to Equipment
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Calibration History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Calibration History ({calibrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calibrations.length > 0 ? (
              <div className="space-y-4">
                {calibrations
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((calibration) => (
                    <div key={calibration.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{calibration.type.replace("_", " & ")} Calibration</h3>
                          <p className="text-sm text-gray-600">
                            Technician: {calibration.technician} | Date:{" "}
                            {new Date(calibration.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={calibration.result === "pass" ? "default" : "destructive"}
                          className={calibration.result === "pass" ? "bg-green-600" : ""}
                        >
                          {calibration.result.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Link href={`/calibrations/${calibration.id}/report`}>
                          <Button size="sm" variant="outline">
                            View Report
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No calibrations found for this equipment</p>
                <Link href={`/calibrations/new?customer=${equipment.customerId}&equipment=${equipment.id}`}>
                  <Button>Perform First Calibration</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
