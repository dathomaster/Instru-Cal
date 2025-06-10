"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileText } from "lucide-react"
import { calibrationDB, type Customer, type Equipment } from "@/lib/db"

export default function NewCalibrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomer = searchParams.get("customer")
  const preselectedEquipment = searchParams.get("equipment")

  const [customers, setCustomers] = useState<Customer[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState(preselectedCustomer || "")
  const [selectedEquipment, setSelectedEquipment] = useState(preselectedEquipment || "")
  const [calibrationType, setCalibrationType] = useState<"load_cell" | "speed_displacement" | "">("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEquipment) {
      const eq = equipment.find((e) => e.id === selectedEquipment)
      if (eq) {
        setCalibrationType(eq.type)
      }
    }
  }, [selectedEquipment, equipment])

  const loadData = async () => {
    try {
      const [customersData, equipmentData] = await Promise.all([
        calibrationDB.getCustomers(),
        calibrationDB.getAllEquipment(),
      ])

      setCustomers(customersData)
      setEquipment(equipmentData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEquipment = equipment.filter((eq) => eq.customerId === selectedCustomer)

  const handleStartCalibration = () => {
    if (selectedCustomer && selectedEquipment && calibrationType) {
      router.push(`/calibrations/form/${calibrationType}?customer=${selectedCustomer}&equipment=${selectedEquipment}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">New Calibration</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Calibration Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="customer">Select Customer</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomer && (
              <div>
                <Label htmlFor="equipment">Select Equipment</Label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEquipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} ({eq.type.replace("_", " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {calibrationType && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Calibration Type</h3>
                <p className="text-blue-700 capitalize">{calibrationType.replace("_", " & ")} Calibration</p>
                <p className="text-sm text-blue-600 mt-1">
                  {calibrationType === "load_cell"
                    ? "This calibration will test load cell accuracy and linearity."
                    : "This calibration will test speed and displacement measurements."}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Link href="/" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleStartCalibration}
                disabled={!selectedCustomer || !selectedEquipment}
                className="flex-1"
              >
                Start Calibration
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedCustomer && filteredEquipment.length === 0 && (
          <Card className="mt-6">
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">No equipment found for this customer</p>
              <Link href={`/equipment/new?customer=${selectedCustomer}`}>
                <Button variant="outline">Add Equipment</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
