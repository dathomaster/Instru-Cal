"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, AlertCircle, Info } from "lucide-react"
import { calibrationDB, type Customer, type Equipment } from "@/lib/db"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewEquipmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomer = searchParams.get("customer")

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: "",
    type: "" as "load_cell" | "speed_displacement" | "",
    serialNumber: "",
    customerId: preselectedCustomer || "",
    capacity: "",
    accuracy: "",
    notes: "",
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      // Ensure database is initialized
      await calibrationDB.init()
      const customersFromDB = await calibrationDB.getCustomers()
      setCustomers(customersFromDB)
    } catch (error) {
      console.error("Error loading customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Equipment name is required"
    if (!formData.type) newErrors.type = "Equipment type is required"
    if (!formData.customerId) newErrors.customerId = "Customer is required"
    if (!formData.serialNumber.trim()) newErrors.serialNumber = "Serial number is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0]
      document.getElementById(firstErrorField)?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      const newEquipment: Equipment = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type as "load_cell" | "speed_displacement",
        serialNumber: formData.serialNumber,
        customerId: formData.customerId,
        specifications: {
          capacity: formData.capacity,
          accuracy: formData.accuracy,
          notes: formData.notes,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await calibrationDB.addEquipment(newEquipment)
      alert("Equipment saved successfully!")
      router.push("/equipment")
    } catch (error) {
      console.error("Error saving equipment:", error)
      alert("Error saving equipment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
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
            <Link href="/equipment">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add New Equipment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Equipment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="customer" className="flex items-center">
                    Customer <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.customerId} onValueChange={(value) => handleChange("customerId", value)}>
                    <SelectTrigger id="customerId" className={errors.customerId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customerId && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.customerId}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="name" className="flex items-center">
                    Equipment Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., LC-500 Load Cell"
                    required
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type" className="flex items-center">
                    Equipment Type <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                    <SelectTrigger id="type" className={errors.type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="load_cell">Load Cell</SelectItem>
                      <SelectItem value="speed_displacement">Speed & Displacement</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.type}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="serialNumber" className="flex items-center">
                    Serial Number <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => handleChange("serialNumber", e.target.value)}
                    placeholder="e.g., LC500-2024-001"
                    required
                    className={errors.serialNumber ? "border-red-500" : ""}
                  />
                  {errors.serialNumber && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.serialNumber}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                    placeholder="e.g., 1000 lbs"
                  />
                </div>

                <div>
                  <Label htmlFor="accuracy">Accuracy</Label>
                  <Input
                    id="accuracy"
                    value={formData.accuracy}
                    onChange={(e) => handleChange("accuracy", e.target.value)}
                    placeholder="e.g., ±0.1%"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Additional specifications or notes"
                    rows={3}
                  />
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-800" />
                <AlertDescription className="text-blue-800">
                  All fields marked with <span className="text-red-500">*</span> are required.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 pt-6">
                <Link href="/equipment" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : "Save Equipment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {customers.length === 0 && (
          <Card className="mt-6">
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">No customers found. You need to add a customer first.</p>
              <Link href="/customers/new">
                <Button>Add Customer</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
