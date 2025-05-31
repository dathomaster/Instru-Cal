"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Printer, Calendar, User, Thermometer, Droplets, FileText, Edit } from "lucide-react"
import { calibrationDB, type Calibration, type Equipment, type Customer } from "@/lib/db"

export default function CalibrationDetailPage() {
  const params = useParams()
  const calibrationId = params.id as string

  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalibrationData()
  }, [calibrationId])

  const loadCalibrationData = async () => {
    try {
      // Ensure database is initialized
      await calibrationDB.init()

      const allCalibrations = await calibrationDB.getAllCalibrations()
      const foundCalibration = allCalibrations.find((cal) => cal.id === calibrationId)

      if (foundCalibration) {
        setCalibration(foundCalibration)

        // Load equipment data
        const allEquipment = await calibrationDB.getAllEquipment()
        const foundEquipment = allEquipment.find((eq) => eq.id === foundCalibration.equipmentId)
        setEquipment(foundEquipment || null)

        // Load customer data
        const customers = await calibrationDB.getCustomers()
        const foundCustomer = customers.find((c) => c.id === foundCalibration.customerId)
        setCustomer(foundCustomer || null)
      } else {
        console.log("Calibration not found with ID:", calibrationId)
        console.log("Available calibrations:", allCalibrations)
      }
    } catch (error) {
      console.error("Error loading calibration:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calibration report...</p>
        </div>
      </div>
    )
  }

  if (!calibration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Calibration Report Not Found</h2>
          <p className="text-gray-600 mb-4">The calibration report with ID "{calibrationId}" could not be found.</p>
          <Link href="/calibrations">
            <Button>Back to Calibrations</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/calibrations">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {calibration.type.replace("_", " & ")} Calibration Report
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={calibration.result === "pass" ? "default" : "destructive"}
                className={calibration.result === "pass" ? "bg-green-600" : ""}
              >
                {calibration.result.toUpperCase()}
              </Badge>
              <Link href={`/calibrations/${calibrationId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Print Header (only visible when printing) */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center">{calibration.type.replace("_", " & ")} Calibration Report</h1>
          <div className="flex justify-between mt-4">
            <div>
              <p className="font-medium">Report ID: {calibration.id}</p>
              <p>Date: {new Date(calibration.date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <Badge
                variant={calibration.result === "pass" ? "default" : "destructive"}
                className={calibration.result === "pass" ? "bg-green-600" : ""}
              >
                {calibration.result.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calibration Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calibration Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Technician</p>
                <p className="text-gray-700">{calibration.technician}</p>
              </div>

              <div>
                <p className="text-sm font-medium">Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-700">{new Date(calibration.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Environmental Conditions</p>
                <div className="flex items-center gap-2 mt-1">
                  <Thermometer className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-700">{calibration.temperature}°F</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Droplets className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-700">{calibration.humidity}% Humidity</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium">Equipment</p>
                {equipment ? (
                  <>
                    <p className="text-gray-700">{equipment.name}</p>
                    <p className="text-xs text-gray-500">
                      Type: {equipment.type.replace("_", " & ")}
                      {equipment.serialNumber && ` | S/N: ${equipment.serialNumber}`}
                    </p>
                    <Link href={`/equipment/${equipment.id}/details`} className="text-blue-600 hover:underline text-sm">
                      View Equipment Details
                    </Link>
                  </>
                ) : (
                  <p className="text-gray-500">Equipment not found</p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium">Customer</p>
                {customer ? (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700">{customer.name}</p>
                    </div>
                    <Link href={`/customers/${customer.id}/details`} className="text-blue-600 hover:underline text-sm">
                      View Customer Details
                    </Link>
                  </>
                ) : (
                  <p className="text-gray-500">Customer not found</p>
                )}
              </div>

              {!calibration.synced && (
                <div className="border-t pt-4">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Pending Sync
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    This calibration has been modified and needs to be synced.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calibration Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Calibration Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calibration.type === "load_cell" ? (
                <LoadCellResults data={calibration.data} />
              ) : (
                <SpeedDisplacementResults data={calibration.data} />
              )}

              <div
                className="mt-6 p-4 rounded-lg border-2"
                style={{
                  backgroundColor: calibration.result === "pass" ? "#f0f9ff" : "#fef2f2",
                  borderColor: calibration.result === "pass" ? "#3b82f6" : "#ef4444",
                }}
              >
                <h3 className="text-lg font-bold">Calibration {calibration.result === "pass" ? "PASSED" : "FAILED"}</h3>
                <p className="text-sm mt-1">
                  {calibration.result === "pass"
                    ? "All readings are within the specified tolerance."
                    : "One or more readings exceed the specified tolerance. Equipment requires adjustment."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex gap-4 print:hidden">
          <Link href="/calibrations" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Calibrations
            </Button>
          </Link>
          <Link href={`/calibrations/${calibrationId}/edit`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              Edit Calibration
            </Button>
          </Link>
          <Link href={`/calibrations/new?customer=${calibration.customerId}&equipment=${calibration.equipmentId}`}>
            <Button className="flex-1">Recalibrate</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

function LoadCellResults({ data }: { data: any }) {
  if (!data || !data.points) {
    return <p className="text-gray-500">No calibration data available</p>
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-medium">Tolerance: ±{data.tolerance}%</p>
        <p className="text-sm font-medium">Capacity: {data.capacity} lbs</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">Applied Load (lbs)</th>
              <th className="text-left p-3 font-medium">Reading (lbs)</th>
              <th className="text-left p-3 font-medium">Error (%)</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((point: any, index: number) => (
              <tr key={index} className="border-b">
                <td className="p-3 font-medium">{point.applied}</td>
                <td className="p-3">{point.reading}</td>
                <td className="p-3">
                  <span
                    className={`font-medium ${
                      Math.abs(point.error) > data.tolerance ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {point.error.toFixed(3)}%
                  </span>
                </td>
                <td className="p-3">
                  <Badge
                    variant={point.withinTolerance ? "default" : "destructive"}
                    className={point.withinTolerance ? "bg-green-600" : ""}
                  >
                    {point.withinTolerance ? "PASS" : "FAIL"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SpeedDisplacementResults({ data }: { data: any }) {
  if (!data || (!data.speedPoints && !data.displacementPoints)) {
    return <p className="text-gray-500">No calibration data available</p>
  }

  return (
    <div className="space-y-6">
      {data.speedPoints && (
        <div>
          <h3 className="text-lg font-medium mb-2">Speed Calibration</h3>
          <p className="text-sm mb-2">Tolerance: ±{data.speedTolerance}%</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Set Speed (in/min)</th>
                  <th className="text-left p-3 font-medium">Actual Speed (in/min)</th>
                  <th className="text-left p-3 font-medium">Error (%)</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.speedPoints.map((point: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{point.setSpeed}</td>
                    <td className="p-3">{point.actualSpeed}</td>
                    <td className="p-3">
                      <span
                        className={`font-medium ${
                          Math.abs(point.error) > data.speedTolerance ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {point.error.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={point.withinTolerance ? "default" : "destructive"}
                        className={point.withinTolerance ? "bg-green-600" : ""}
                      >
                        {point.withinTolerance ? "PASS" : "FAIL"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.displacementPoints && (
        <div>
          <h3 className="text-lg font-medium mb-2">Displacement Calibration</h3>
          <p className="text-sm mb-2">Tolerance: ±{data.displacementTolerance}%</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Set Displacement (in)</th>
                  <th className="text-left p-3 font-medium">Actual Displacement (in)</th>
                  <th className="text-left p-3 font-medium">Error (%)</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.displacementPoints.map((point: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{point.setDisplacement}</td>
                    <td className="p-3">{point.actualDisplacement}</td>
                    <td className="p-3">
                      <span
                        className={`font-medium ${
                          Math.abs(point.error) > data.displacementTolerance ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {point.error.toFixed(3)}%
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={point.withinTolerance ? "default" : "destructive"}
                        className={point.withinTolerance ? "bg-green-600" : ""}
                      >
                        {point.withinTolerance ? "PASS" : "FAIL"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
