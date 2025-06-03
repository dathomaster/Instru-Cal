"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Printer,
  Edit,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ArrowLeft,
} from "lucide-react"
import { calibrationDB, type Calibration, type Equipment, type Customer } from "@/lib/db"
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts"
import { Badge } from "@/components/ui/badge"

type SortField = "date" | "customer" | "equipment" | "technician" | "result" | "type"
type SortDirection = "asc" | "desc"
type FilterStatus = "all" | "pass" | "fail"
type FilterType = "all" | "load_cell" | "speed_displacement"

export default function CalibrationsPage() {
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [showFilters, setShowFilters] = useState(false)

  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await calibrationDB.init()

      const [calibrationsData, equipmentData, customersData] = await Promise.all([
        calibrationDB.getAllCalibrations(),
        calibrationDB.getAllEquipment(),
        calibrationDB.getCustomers(),
      ])

      console.log("📊 Loaded calibrations:", calibrationsData.length)
      console.log("🔧 Loaded equipment:", equipmentData.length)
      console.log("👥 Loaded customers:", customersData.length)

      setCalibrations(calibrationsData)
      setEquipment(equipmentData)
      setCustomers(customersData)
    } catch (error) {
      console.error("❌ Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrintReport = (calibrationId: string) => {
    console.log("🖨️ Opening print report for calibration:", calibrationId)
    // Navigate to report page with print parameter - this should work offline
    window.open(`/calibrations/${calibrationId}/report?print=true`, "_blank")
  }

  const handleForceSync = async () => {
    if (!navigator.onLine) {
      alert("Cannot sync while offline. Data will sync automatically when connection is restored.")
      return
    }

    try {
      setSyncing(true)
      try {
        const { syncManager } = await import("@/lib/sync")
        if (syncManager && syncManager.forceSync) {
          await syncManager.forceSync()
        } else {
          await calibrationDB.syncWithServer()
        }
        await loadData()
        alert("Sync completed successfully!")
      } catch (syncError) {
        console.warn("Sync manager not available, using database sync")
        await calibrationDB.syncWithServer()
        await loadData()
        alert("Sync completed successfully!")
      }
    } catch (error) {
      console.error("Sync failed:", error)
      alert("Sync failed. Please try again.")
    } finally {
      setSyncing(false)
    }
  }

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId)
    return eq?.name || "Unknown Equipment"
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    return customer?.name || "Unknown Customer"
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSortField("date")
    setSortDirection("desc")
    setFilterStatus("all")
    setFilterType("all")
  }

  // Filtered and sorted calibrations
  const filteredAndSortedCalibrations = useMemo(() => {
    const filtered = calibrations.filter((calibration) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const customerName = getCustomerName(calibration.customerId).toLowerCase()
      const equipmentName = getEquipmentName(calibration.equipmentId).toLowerCase()
      const technician = calibration.technician.toLowerCase()
      const reportNumber = calibration.data?.reportNumber?.toLowerCase() || ""

      const matchesSearch =
        searchTerm === "" ||
        customerName.includes(searchLower) ||
        equipmentName.includes(searchLower) ||
        technician.includes(searchLower) ||
        reportNumber.includes(searchLower) ||
        calibration.id.toLowerCase().includes(searchLower)

      // Status filter
      const matchesStatus = filterStatus === "all" || calibration.result === filterStatus

      // Type filter
      const matchesType = filterType === "all" || calibration.type === filterType

      return matchesSearch && matchesStatus && matchesType
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "date":
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case "customer":
          aValue = getCustomerName(a.customerId)
          bValue = getCustomerName(b.customerId)
          break
        case "equipment":
          aValue = getEquipmentName(a.equipmentId)
          bValue = getEquipmentName(b.equipmentId)
          break
        case "technician":
          aValue = a.technician
          bValue = b.technician
          break
        case "result":
          aValue = a.result
          bValue = b.result
          break
        case "type":
          aValue = a.type
          bValue = b.type
          break
        default:
          aValue = a.date
          bValue = b.date
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [calibrations, equipment, customers, searchTerm, sortField, sortDirection, filterStatus, filterType])

  // Calculate calibration statistics
  const calibrationStats = useMemo(() => {
    const total = calibrations.length
    const passed = calibrations.filter((c) => c.result === "pass").length
    const failed = calibrations.filter((c) => c.result === "fail").length

    const passRate = total > 0 ? (passed / total) * 100 : 0
    const failRate = total > 0 ? (failed / total) * 100 : 0

    return {
      total,
      passed,
      failed,
      passRate,
      failRate,
    }
  }, [calibrations])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calibrations...</p>
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
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleForceSync} disabled={syncing} variant="outline">
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Sync
                  </>
                )}
              </Button>
              <Link href="/calibrations/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Calibration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by customer, equipment, technician, or report number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Quick Sort Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort("date")}
                  className={sortField === "date" ? "bg-blue-50 border-blue-200" : ""}
                >
                  Date{" "}
                  {sortField === "date" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-3 w-3 ml-1" />
                    ) : (
                      <SortDesc className="h-3 w-3 ml-1" />
                    ))}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort("customer")}
                  className={sortField === "customer" ? "bg-blue-50 border-blue-200" : ""}
                >
                  Customer{" "}
                  {sortField === "customer" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-3 w-3 ml-1" />
                    ) : (
                      <SortDesc className="h-3 w-3 ml-1" />
                    ))}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-blue-50 border-blue-200" : ""}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sort By</label>
                  <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="result">Result</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Direction</label>
                  <Select value={sortDirection} onValueChange={(value: SortDirection) => setSortDirection(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pass">Pass Only</SelectItem>
                      <SelectItem value="fail">Fail Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                  <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="load_cell">Load Cell</SelectItem>
                      <SelectItem value="speed_displacement">Speed & Displacement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4 flex justify-between items-center pt-2">
                  <div className="text-sm text-gray-600">
                    Showing {filteredAndSortedCalibrations.length} of {calibrations.length} calibrations
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {filteredAndSortedCalibrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              {calibrations.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No calibrations found</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first calibration.</p>
                  <Link href="/calibrations/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Calibration
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No calibrations match your filters</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search terms or filters.</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCalibrations.map((calibration) => (
              <Card key={calibration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {calibration.type === "load_cell" ? "Load Cell" : "Speed & Displacement"}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{getEquipmentName(calibration.equipmentId)}</p>
                    </div>
                    <Badge
                      variant={calibration.result === "pass" ? "default" : "destructive"}
                      className={calibration.result === "pass" ? "bg-green-600" : ""}
                    >
                      {calibration.result === "pass" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {calibration.result.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {calibration.technician}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(calibration.date).toLocaleDateString()}
                  </div>

                  <div className="text-sm text-gray-600">
                    <strong>Customer:</strong> {getCustomerName(calibration.customerId)}
                  </div>

                  {calibration.data?.reportNumber && (
                    <div className="text-sm text-gray-600">
                      <strong>Report #:</strong> {calibration.data.reportNumber}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    <strong>ID:</strong> {calibration.id.substring(0, 8)}...
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/calibrations/${calibration.id}/report`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Report
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReport(calibration.id)}
                      className="px-3"
                      title="Print Report"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Link href={`/calibrations/${calibration.id}/edit`}>
                      <Button variant="outline" size="sm" className="px-3" title="Edit Calibration">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {calibrations.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredAndSortedCalibrations.length}</div>
                  <div className="text-sm text-gray-600">Showing</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{calibrations.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{calibrationStats.passed}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{calibrationStats.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calibration Trend Chart */}
        {calibrations.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Calibration Trend</CardTitle>
              {/* <CardDescription>Calibration pass/fail rate over time</CardDescription> */}
            </CardHeader>
            <CardContent>
              <CalibrationTrendChart calibrations={calibrations} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

// Calibration Trend Chart Component
function CalibrationTrendChart({ calibrations }: { calibrations: Calibration[] }) {
  const monthlyData = useMemo(() => {
    const monthlyCounts: { [key: string]: { pass: number; fail: number } } = {}

    calibrations.forEach((calibration) => {
      const date = new Date(calibration.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyCounts[monthYear]) {
        monthlyCounts[monthYear] = { pass: 0, fail: 0 }
      }

      if (calibration.result === "pass") {
        monthlyCounts[monthYear].pass++
      } else {
        monthlyCounts[monthYear].fail++
      }
    })

    const chartData = Object.entries(monthlyCounts).map(([monthYear, counts]) => ({
      monthYear,
      pass: counts.pass,
      fail: counts.fail,
    }))

    return chartData
  }, [calibrations])

  return (
    <div className="h-[300px]">
      {monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <Bar data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthYear" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pass" stackId="a" fill="#82ca9d" name="Passed" />
            <Bar dataKey="fail" stackId="a" fill="#e4807b" name="Failed" />
          </Bar>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-gray-500">No calibration data to display chart</div>
      )}
    </div>
  )
}
