"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, AlertCircle, Building } from "lucide-react"
import { calibrationDB } from "@/lib/db"

export default function SelectCustomerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const calibrationType = searchParams.get("type") || "load_cell"

  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Check if offline
    setIsOffline(!navigator.onLine)

    const loadCustomers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initialize the database
        await calibrationDB.init()

        // Get all customers
        const allCustomers = await calibrationDB.getCustomers()
        setCustomers(allCustomers)
        setFilteredCustomers(allCustomers)
      } catch (err) {
        console.error("Error loading customers:", err)
        setError("Failed to load customers. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  // Filter customers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) || customer.location?.city?.toLowerCase().includes(query),
    )
    setFilteredCustomers(filtered)
  }, [searchQuery, customers])

  const handleSelectCustomer = (customerId: string) => {
    // Store the selection in localStorage for offline access
    localStorage.setItem("selectedCustomerId", customerId)

    // Navigate to the equipment selection page
    router.push(`/calibrations/select-equipment?type=${calibrationType}&customer=${customerId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href="/calibrations/new">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Select Customer</h1>
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
                    You are currently offline. You can still select a customer from your local data.
                  </p>
                </div>
              </div>
            </div>
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
              placeholder="Search customers..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectCustomer(customer.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-blue-600" />
                    {customer.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {customer.location?.city}, {customer.location?.state}
                  </p>
                  <Button className="w-full mt-4">Select</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">{searchQuery ? "No customers match your search" : "No customers found"}</p>
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
