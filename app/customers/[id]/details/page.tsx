"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Save, X, MapPin, Phone, Mail, Wrench, FileText } from "lucide-react"
import { calibrationDB, type Customer, type Equipment, type Calibration } from "@/lib/db"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: "",
    location: "",
    contact: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomerData()
  }, [customerId])

  const loadCustomerData = async () => {
    try {
      // Ensure database is initialized
      await calibrationDB.init()

      const customers = await calibrationDB.getCustomers()
      const foundCustomer = customers.find((c) => c.id === customerId)

      if (foundCustomer) {
        setCustomer(foundCustomer)
        setEditData({
          name: foundCustomer.name,
          location: foundCustomer.location,
          contact: foundCustomer.contact,
          email: foundCustomer.email,
          phone: foundCustomer.phone,
          notes: foundCustomer.notes,
        })
      } else {
        console.log("Customer not found with ID:", customerId)
        console.log("Available customers:", customers)
      }

      // Load equipment for this customer
      const customerEquipment = await calibrationDB.getEquipmentByCustomer(customerId)
      setEquipment(customerEquipment)

      // Load calibrations for this customer
      const allCalibrations = await calibrationDB.getAllCalibrations()
      const customerCalibrations = allCalibrations.filter((cal) => cal.customerId === customerId)
      setCalibrations(customerCalibrations)
    } catch (error) {
      console.error("Error loading customer:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!customer) return

    try {
      const updatedCustomer = {
        ...customer,
        ...editData,
        updatedAt: new Date().toISOString(),
      }

      await calibrationDB.updateCustomer(updatedCustomer)
      setCustomer(updatedCustomer)
      setIsEditing(false)
      alert("Customer updated successfully!")
    } catch (error) {
      console.error("Error updating customer:", error)
      alert("Error updating customer. Please try again.")
    }
  }

  const handleCancel = () => {
    if (customer) {
      setEditData({
        name: customer.name,
        location: customer.location,
        contact: customer.contact,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">The customer with ID "{customerId}" could not be found.</p>
          <Link href="/customers">
            <Button>Back to Customers</Button>
          </Link>
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
              <Link href="/customers">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleCancel} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Company Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editData.name}
                      onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-lg font-medium">{customer.name}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={editData.location}
                      onChange={(e) => setEditData((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter full address manually"
                    />
                  ) : (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{customer.location}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="contact">Primary Contact</Label>
                  {isEditing ? (
                    <Input
                      id="contact"
                      value={editData.contact}
                      onChange={(e) => setEditData((prev) => ({ ...prev, contact: e.target.value }))}
                    />
                  ) : (
                    <p className="text-gray-700">{customer.contact}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => setEditData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700">{customer.phone}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      value={editData.email}
                      onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-700">{customer.email}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  {isEditing ? (
                    <Textarea
                      id="notes"
                      value={editData.notes}
                      onChange={(e) => setEditData((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{customer.notes || "No notes available"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/calibrations/new?customer=${customer.id}`}>
                <Button className="w-full">New Calibration</Button>
              </Link>
              <Link href={`/equipment/new?customer=${customer.id}`}>
                <Button variant="outline" className="w-full">
                  Add Equipment
                </Button>
              </Link>
              <Link href={`/customers/${customer.id}/reports`}>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </Link>
              <Link href="/equipment">
                <Button variant="outline" className="w-full">
                  View All Equipment
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Equipment List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipment ({equipment.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.map((eq) => (
                  <div key={eq.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-medium">{eq.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{eq.type.replace("_", " & ")}</p>
                    <p className="text-xs text-gray-500 mt-1">Serial: {eq.serialNumber}</p>
                    <div className="flex gap-2 mt-3">
                      <Link href={`/equipment/${eq.id}/details`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                      <Link href={`/calibrations/new?customer=${customer.id}&equipment=${eq.id}`}>
                        <Button size="sm">Calibrate</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No equipment found for this customer</p>
                <Link href={`/equipment/new?customer=${customer.id}`}>
                  <Button>Add Equipment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

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
                  .map((calibration) => {
                    const eq = equipment.find((e) => e.id === calibration.equipmentId)
                    return (
                      <div key={calibration.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{calibration.type.replace("_", " & ")} Calibration</h3>
                            <p className="text-sm text-gray-600">
                              Equipment: {eq?.name || "Unknown"} | Date:{" "}
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
                          <Link href={`/calibrations/new?customer=${customer.id}&equipment=${calibration.equipmentId}`}>
                            <Button size="sm">Recalibrate</Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No calibrations found for this customer</p>
                <Link href={`/calibrations/new?customer=${customer.id}`}>
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
