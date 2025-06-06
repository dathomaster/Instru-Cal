"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, AlertCircle, PenToolIcon as Tool } from "lucide-react"
import { calibrationDB } from "@/lib/db"

export default function SelectEquipmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const calibrationType = searchParams.get("type") || "load_cell"
  const customerId = searchParams.get("customer") || ""

  const [equipment, setEquipment] = useState<any[]>([])
  const [filteredEquipment, setFilteredEquipment] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [customerName, setCustomerName] = useState("")

  useEffect(() => {
    // Check if offline
    setIsOffline(!navigator.onLine)

    const loadEquipment = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initialize the database
        await calibrationDB.init()

        // Get customer info
        const customer = await calibrationDB.getCustomerById(customerId)
        if (customer) {
          setCustomerName(customer.name)
        }

        // Get equipment for this customer
        const customerEquipment = await calibrationDB.getEquipmentByCustomerId(customerId)
        setEquipment(customerEquipment)
        setFilteredEquipment(customerEquipment)
      } catch (err) {
        console.error("Error loading equipment:", err)
        setError("Failed to load equipment. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (customerId) {
      loadEquipment()
    } else {
      setError("No customer selected. Please go back and select a customer.")
      setIsLoading(false)
    }
  }, [customerId])

  // Filter equipment based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEquipment(equipment)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = equipment.filter(
      (item) => item.name.toLowerCase().includes(query) || item.serialNumber?.toLowerCase().includes(query),
    )
    setFilteredEquipment(filtered)
  }, [searchQuery, equipment])

  const handleSelectEquipment = (equipmentId: string) => {
    // Store the selection in localStorage for offline access
    localStorage.setItem("selectedEquipmentId", equipmentId)

    // Navigate to the calibration form
    router.push(`/calibrations/form/${calibrationType}?customer=${customerId}&equipment=${equipmentId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href={`/calibrations/select-customer?type=${calibrationType}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Select Equipment</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isOffline && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Offline Mode</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    You are currently offline. You can still select equipment from your local data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {customerName && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700">Customer: {customerName}</h2>
          </div>
        )}

        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search equipment..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading equipment...</p>
          </div>
        ) : filteredEquipment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item) => (
              <Card
                key={item.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectEquipment(item.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Tool className="h-5 w-5 mr-2 text-blue-600" />
                    {item.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">S/N: {item.serialNumber || "N/A"}</p>
                  <Button className="w-full mt-4">Select</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchQuery ? "No equipment matches your search" : "No equipment found for this customer"}
            </p>
            {searchQuery && (
              <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
