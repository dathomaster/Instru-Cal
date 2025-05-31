"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Plus, MapPin, Phone, Mail } from "lucide-react"
import { calibrationDB } from "@/lib/db"

interface Customer {
  id: string
  name: string
  location: string
  contact: string
  email: string
  phone: string
  notes: string
  equipmentCount: number
  lastCalibration: string
  createdAt: string
  updatedAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Load customers from IndexedDB
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      await calibrationDB.init()
      const customersFromDB = await calibrationDB.getCustomers()

      // Get equipment count for each customer
      const customersWithCounts = await Promise.all(
        customersFromDB.map(async (customer) => {
          const equipment = await calibrationDB.getEquipmentByCustomer(customer.id)
          const calibrations = await calibrationDB.getAllCalibrations()
          const customerCalibrations = calibrations.filter((cal) => cal.customerId === customer.id)

          const lastCalibration =
            customerCalibrations.length > 0
              ? customerCalibrations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
              : "Never"

          return {
            ...customer,
            equipmentCount: equipment.length,
            lastCalibration,
          }
        }),
      )

      setCustomers(customersWithCounts)
    } catch (error) {
      console.error("Error loading customers:", error)
    }
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            </div>
            <Link href="/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
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
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <Badge variant="outline">{customer.equipmentCount} equipment</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{customer.location}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{customer.email}</p>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-medium">Contact: {customer.contact}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last calibration:{" "}
                    {customer.lastCalibration === "Never"
                      ? "Never"
                      : new Date(customer.lastCalibration).toLocaleDateString()}
                  </p>
                </div>

                {customer.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600">{customer.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Link href={`/customers/${customer.id}/details`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/calibrations/new?customer=${customer.id}`}>
                    <Button className="flex-1">New Calibration</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No customers found</p>
            <Link href="/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Customer
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
