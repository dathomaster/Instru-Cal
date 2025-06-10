"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Printer,
  Edit,
  RefreshCw,
  Search,
  ArrowLeft,
  Eye,
  Calendar,
  User,
  Wrench,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react"
import { calibrationDB, type Calibration, type Equipment, type Customer } from "@/lib/db"
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"

type SortField = "date" | "customer" | "equipment" | "technician" | "result" | "type"
type SortDirection = "asc" | "desc"
type FilterStatus = "all" | "pass" | "fail"
type FilterType = "all" | "load_cell" | "speed_displacement"
type FilterPeriod = "all" | "today" | "week" | "month" | "quarter"

export default function CalibrationsPage() {
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [activeTab, setActiveTab] = useState("all")

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

  const clearFilters = () => {
    setSearchTerm("")
    setFilterStatus("all")
    setFilterType("all")
    setFilterPeriod("all")
    setSortField("date")
    setSortDirection("desc")
  }

  const formatCalibrationDate = (dateString: string) => {
    const date = new Date(dateString)

    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, "h:mm a")}`
    } else if (isThisWeek(date)) {
      return format(date, "EEEE, h:mm a")
    } else {
      return format(date, "MMM d, yyyy")
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = calibrations.length
    const passed = calibrations.filter((c) => c.result === "pass").length
    const failed = calibrations.filter((c) => c.result === "fail").length
    const today = calibrations.filter((c) => isToday(new Date(c.date))).length
    const thisWeek = calibrations.filter((c) => isThisWeek(new Date(c.date))).length
    const thisMonth = calibrations.filter((c) => isThisMonth(new Date(c.date))).length

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      today,
      thisWeek,
      thisMonth,
    }
  }, [calibrations])

  // Filtered and sorted calibrations
  const filteredCalibrations = useMemo(() => {
    let filtered = [...calibrations]

    // Apply tab filter
    if (activeTab === "passed") {
      filtered = filtered.filter((c) => c.result === "pass")
    } else if (activeTab === "failed") {
      filtered = filtered.filter((c) => c.result === "fail")
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((calibration) => {
        const customerName = getCustomerName(calibration.customerId).toLowerCase()
        const equipmentName = getEquipmentName(calibration.equipmentId).toLowerCase()
        const technician = calibration.technician.toLowerCase()
        const reportNumber = calibration.data?.reportNumber?.toLowerCase() || ""

        return (
          customerName.includes(searchLower) ||
          equipmentName.includes(searchLower) ||
          technician.includes(searchLower) ||
          reportNumber.includes(searchLower) ||
          calibration.id.toLowerCase().includes(searchLower)
        )
      })
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((cal) => cal.result === filterStatus)
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((cal) => cal.type === filterType)
    }

    // Period filter
    if (filterPeriod !== "all") {
      const now = new Date()
      filtered = filtered.filter((cal) => {
        const calDate = new Date(cal.date)
        switch (filterPeriod) {
          case "today":
            return isToday(calDate)
          case "week":
            return isThisWeek(calDate)
          case "month":
            return isThisMonth(calDate)
          case "quarter":
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
            return calDate >= quarterStart
          default:
            return true
        }
      })
    }

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
  }, [
    calibrations,
    equipment,
    customers,
    searchTerm,
    filterStatus,
    filterType,
    filterPeriod,
    sortField,
    sortDirection,
    activeTab,
  ])

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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calibrations</h1>
                <p className="text-sm text-gray-500">{stats.total} total calibrations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleForceSync} disabled={syncing} variant="outline" size="sm">
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync
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
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
              <div className="text-xs text-blue-600">Total</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-700">{stats.passed}</div>
              <div className="text-xs text-green-600">Passed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
              <div className="text-xs text-red-600">Failed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-700">{stats.passRate}%</div>
              <div className="text-xs text-purple-600">Pass Rate</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-700">{stats.today}</div>
              <div className="text-xs text-amber-600">Today</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-indigo-700">{stats.thisWeek}</div>
              <div className="text-xs text-indigo-600">This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
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

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as FilterPeriod)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="load_cell">Load Cell</SelectItem>
                    <SelectItem value="speed_displacement">Speed & Displacement</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                >
                  {sortDirection === "asc" ? "↑" : "↓"}
                </Button>

                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              All ({calibrations.length})
            </TabsTrigger>
            <TabsTrigger value="passed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Passed ({stats.passed})
            </TabsTrigger>
            <TabsTrigger value="failed" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed ({stats.failed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Results */}
            {filteredCalibrations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No calibrations found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== "all" || filterType !== "all" || filterPeriod !== "all"
                      ? "Try adjusting your search criteria or filters."
                      : "Get started by creating your first calibration."}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {(searchTerm || filterStatus !== "all" || filterType !== "all" || filterPeriod !== "all") && (
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
                  <Card
                    key={calibration.id}
                    className="hover:shadow-md transition-all duration-200 border-l-4"
                    style={{ borderLeftColor: calibration.result === "pass" ? "#10b981" : "#ef4444" }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-5 w-5 text-gray-500" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {calibration.type.replace("_", " & ").replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                                Calibration
                              </h3>
                            </div>
                            <Badge
                              variant={calibration.result === "pass" ? "default" : "destructive"}
                              className={`${calibration.result === "pass" ? "bg-green-600 hover:bg-green-700" : ""} text-xs font-medium`}
                            >
                              {calibration.result === "pass" ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  PASSED
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  FAILED
                                </>
                              )}
                            </Badge>
                          </div>

                          {/* Main Info Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {getCustomerName(calibration.customerId)}
                                </div>
                                <div className="text-xs text-gray-500">Customer</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-green-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {getEquipmentName(calibration.equipmentId)}
                                </div>
                                <div className="text-xs text-gray-500">Equipment</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-purple-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{calibration.technician}</div>
                                <div className="text-xs text-gray-500">Technician</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-amber-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCalibrationDate(calibration.date)}
                                </div>
                                <div className="text-xs text-gray-500">Date</div>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                            <span>ID: {calibration.id.slice(0, 8)}...</span>
                            {calibration.data?.reportNumber && <span>Report: {calibration.data.reportNumber}</span>}
                            {calibration.notes && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Has notes
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-6">
                          <Link href={`/calibrations/${calibration.id}/report`}>
                            <Button size="sm" variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintReport(calibration.id)}
                            className="w-full"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Print</span>
                          </Button>
                          <Link href={`/calibrations/${calibration.id}/edit`}>
                            <Button size="sm" className="w-full">
                              <Edit className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
