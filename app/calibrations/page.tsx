"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Printer, Edit, RefreshCw, Search, SortAsc, SortDesc, ArrowLeft } from "lucide-react"
import { calibrationDB, type Calibration, type Equipment, type Customer } from "@/lib/db"
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
                  onClick={() => toggleSort("equipment")}
                  className={sortField === "equipment" ? "bg-blue-50 border-blue-200" : ""}
                >
                  Equipment{" "}
                  {sortField === "equipment" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-3 w-3 ml-1" />
                    ) : (
                      <SortDesc className="h-3 w-3 ml-1" />
                    ))}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort("technician")}
                  className={sortField === "technician" ? "bg-blue-50 border-blue-200" : ""}
                >
                  Technician{" "}
                  {sortField === "technician" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-3 w-3 ml-1" />
                    ) : (
                      <SortDesc className="h-3 w-3 ml-1" />
                    ))}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort("result")}
                  className={sortField === "result" ? "bg-blue-50 border-blue-200" : ""}
                >
                  Result{" "}
                  {sortField === "result" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-3 w-3 ml-1" />
                    ) : (
                      <SortDesc className="h-3 w-3 ml-1" />
                    ))}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort("type")}
                  className={sortField === "type" ? "bg-blue-50 border-blue-200" : ""}
                >
                  Type{" "}
                  {sortField === "type" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-3 w-3 ml-1" />
                    ) : (
                      <SortDesc className="h-3 w-3 ml-1" />
                    ))}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calibration List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedCalibrations.map((calibration) => (
            <Card key={calibration.id}>
              <CardHeader>
                <CardTitle>
                  {getEquipmentName(calibration.equipmentId)} - {getCustomerName(calibration.customerId)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Technician: {calibration.technician}</p>
                    <p className="text-sm font-medium text-gray-500">
                      Date: {new Date(calibration.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-gray-500">Type: {calibration.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={calibration.result === "pass" ? "success" : "destructive"} className="text-xs">
                      {calibration.result.toUpperCase()}
                    </Badge>
                    <Button onClick={() => handlePrintReport(calibration.id)} variant="outline" size="icon">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Link href={`/calibrations/${calibration.id}/edit`}>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly Calibration Chart */}
        {calibrations.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Monthly Calibration Activity</CardTitle>
              <p className="text-sm text-gray-600">Calibrations completed over the last 6 months</p>
            </CardHeader>
            <CardContent>
              <ModernCalibrationChart calibrations={calibrations} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

// Modern CSS-based Chart Component
function ModernCalibrationChart({ calibrations }: { calibrations: Calibration[] }) {
  const monthlyData = useMemo(() => {
    const now = new Date()
    const months = []

    // Get last 6 months including current month
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "short" })

      const monthCalibrations = calibrations.filter((cal) => {
        const calDate = new Date(cal.date)
        const calMonthYear = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}`
        return calMonthYear === monthYear
      })

      const passed = monthCalibrations.filter((cal) => cal.result === "pass").length
      const failed = monthCalibrations.filter((cal) => cal.result === "fail").length
      const total = monthCalibrations.length

      months.push({
        monthName,
        total,
        passed,
        failed,
        isCurrentMonth: i === 0,
      })
    }

    const maxTotal = Math.max(...months.map((m) => m.total), 1)

    return months.map((month) => ({
      ...month,
      passedHeight: maxTotal > 0 ? (month.passed / maxTotal) * 100 : 0,
      failedHeight: maxTotal > 0 ? (month.failed / maxTotal) * 100 : 0,
      totalHeight: maxTotal > 0 ? (month.total / maxTotal) * 100 : 0,
    }))
  }, [calibrations])

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between h-64 px-4 py-4 bg-gradient-to-t from-gray-50 to-white rounded-lg border">
          {monthlyData.map((month, index) => (
            <div key={index} className="flex flex-col items-center flex-1 max-w-20">
              {/* Bar */}
              <div className="relative w-12 mb-2 flex flex-col justify-end" style={{ height: "200px" }}>
                {month.total > 0 ? (
                  <>
                    {/* Failed portion */}
                    {month.failed > 0 && (
                      <div
                        className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-sm transition-all duration-500 ease-out"
                        style={{ height: `${month.failedHeight}%` }}
                        title={`${month.failed} failed`}
                      />
                    )}
                    {/* Passed portion */}
                    {month.passed > 0 && (
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-sm transition-all duration-500 ease-out"
                        style={{ height: `${month.passedHeight}%` }}
                        title={`${month.passed} passed`}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-1 bg-gray-200 rounded" />
                )}

                {/* Value label */}
                {month.total > 0 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                    {month.total}
                  </div>
                )}
              </div>

              {/* Month label */}
              <div
                className={`text-xs font-medium text-center ${month.isCurrentMonth ? "text-blue-600 font-bold" : "text-gray-600"}`}
              >
                {month.monthName}
                {month.isCurrentMonth && <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1" />}
              </div>
            </div>
          ))}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col justify-between py-4 -ml-8">
          {[...Array(5)].map((_, i) => {
            const maxValue = Math.max(...monthlyData.map((m) => m.total), 1)
            const value = Math.round((maxValue * (4 - i)) / 4)
            return (
              <div key={i} className="text-xs text-gray-500 text-right">
                {value}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-green-500 to-green-400 rounded" />
          <span className="text-sm text-gray-600">Passed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded" />
          <span className="text-sm text-gray-600">Failed</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{monthlyData[monthlyData.length - 1]?.total || 0}</div>
          <div className="text-sm text-gray-600">This Month</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{monthlyData[monthlyData.length - 1]?.passed || 0}</div>
          <div className="text-sm text-gray-600">Passed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{monthlyData[monthlyData.length - 1]?.failed || 0}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {Math.round(
              ((monthlyData[monthlyData.length - 1]?.passed || 0) /
                Math.max(monthlyData[monthlyData.length - 1]?.total || 1, 1)) *
                100,
            )}
            %
          </div>
          <div className="text-sm text-gray-600">Pass Rate</div>
        </div>
      </div>
    </div>
  )
}
