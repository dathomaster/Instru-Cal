"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, Search, FileText, AlertCircle, Plus, Filter, ArrowLeft, Eye } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calibrationDB, type Calibration, type Customer, type Equipment } from "@/lib/db"

export default function CalibrationsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [filteredCalibrations, setFilteredCalibrations] = useState<Calibration[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formattedDate = date ? format(date, "yyyy-MM-dd") : ""

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterCalibrations()
  }, [calibrations, searchTerm, statusFilter, typeFilter, formattedDate])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      await calibrationDB.init()

      const [allCalibrations, allCustomers, allEquipment] = await Promise.all([
        calibrationDB.getAllCalibrations(),
        calibrationDB.getCustomers(),
        calibrationDB.getAllEquipment(),
      ])

      setCalibrations(allCalibrations)
      setCustomers(allCustomers)
      setEquipment(allEquipment)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load calibrations. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterCalibrations = () => {
    let filtered = [...calibrations]

    // Filter by date if selected
    if (formattedDate) {
      filtered = filtered.filter((cal) => cal.date.startsWith(formattedDate))
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((cal) => {
        const customer = customers.find((c) => c.id === cal.customerId)
        const eq = equipment.find((e) => e.id === cal.equipmentId)

        return (
          customer?.name.toLowerCase().includes(searchLower) ||
          eq?.name.toLowerCase().includes(searchLower) ||
          cal.type.toLowerCase().includes(searchLower) ||
          cal.id.toLowerCase().includes(searchLower)
        )
      })
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((cal) => cal.result === statusFilter)
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((cal) => cal.type === typeFilter)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredCalibrations(filtered)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    setDate(undefined)
  }

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || "Unknown Customer"
  }

  const getEquipmentName = (equipmentId: string) => {
    return equipment.find((e) => e.id === equipmentId)?.name || "Unknown Equipment"
  }

  if (isLoading) {
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
              <h1 className="text-2xl font-bold text-gray-900">Calibrations</h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading calibrations...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
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
              <h1 className="text-2xl font-bold text-gray-900">Calibrations</h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="mt-4 text-gray-600">{error}</p>
            <Button onClick={loadData} className="mt-4">
              Try Again
            </Button>
          </div>
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
              <Badge variant="secondary" className="ml-2">
                {filteredCalibrations.length} found
              </Badge>
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
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer, equipment, type, or calibration ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pass">Passed</SelectItem>
                    <SelectItem value="fail">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="load_cell">Load Cell</SelectItem>
                    <SelectItem value="speed_displacement">Speed & Displacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredCalibrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No calibrations found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" || date
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by creating your first calibration."}
              </p>
              <div className="flex gap-2 justify-center">
                {(searchTerm || statusFilter !== "all" || typeFilter !== "all" || date) && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Link href="/calibrations/new">
                  <Button>Create Calibration</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCalibrations.map((calibration) => (
              <Card key={calibration.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{calibration.type.replace("_", " & ")} Calibration</h3>
                        <Badge
                          variant={calibration.result === "pass" ? "default" : "destructive"}
                          className={calibration.result === "pass" ? "bg-green-600" : ""}
                        >
                          {calibration.result.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Customer:</span> {getCustomerName(calibration.customerId)}
                        </div>
                        <div>
                          <span className="font-medium">Equipment:</span> {getEquipmentName(calibration.equipmentId)}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(calibration.date).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">ID: {calibration.id}</div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link href={`/calibrations/${calibration.id}/report`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Report
                        </Button>
                      </Link>
                      <Link href={`/calibrations/${calibration.id}/edit`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
