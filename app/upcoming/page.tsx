"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Wrench,
  FileText,
  Mail,
  CalendarPlus,
  Search,
  Clock,
  X,
  Filter,
} from "lucide-react"
import { calibrationDB, type Equipment, type Customer, type CalibrationTool } from "@/lib/db"

interface UpcomingEquipment {
  equipment: Equipment
  customer: Customer
  daysUntilDue: number
}

interface UpcomingTool {
  tool: CalibrationTool
  daysUntilDue: number
}

export default function UpcomingCalibrationsPage() {
  const [upcomingEquipment, setUpcomingEquipment] = useState<UpcomingEquipment[]>([])
  const [upcomingTools, setUpcomingTools] = useState<UpcomingTool[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")

  // Derived states for filtered data
  const filteredEquipment = upcomingEquipment
    .filter((item) => {
      const matchesSearch =
        item.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipment.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())

      if (filterPriority === "all") return matchesSearch
      if (filterPriority === "overdue") return matchesSearch && item.daysUntilDue < 0
      if (filterPriority === "week") return matchesSearch && item.daysUntilDue >= 0 && item.daysUntilDue <= 7
      if (filterPriority === "month") return matchesSearch && item.daysUntilDue > 7 && item.daysUntilDue <= 30
      return matchesSearch && item.daysUntilDue > 30
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)

  const filteredTools = upcomingTools
    .filter((item) => {
      const matchesSearch =
        item.tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tool.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tool.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())

      if (filterPriority === "all") return matchesSearch
      if (filterPriority === "overdue") return matchesSearch && item.daysUntilDue < 0
      if (filterPriority === "week") return matchesSearch && item.daysUntilDue >= 0 && item.daysUntilDue <= 7
      if (filterPriority === "month") return matchesSearch && item.daysUntilDue > 7 && item.daysUntilDue <= 30
      return matchesSearch && item.daysUntilDue > 30
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)

  // Stats for quick overview
  const stats = {
    overdue: {
      equipment: upcomingEquipment.filter((item) => item.daysUntilDue < 0).length,
      tools: upcomingTools.filter((item) => item.daysUntilDue < 0).length,
    },
    thisWeek: {
      equipment: upcomingEquipment.filter((item) => item.daysUntilDue >= 0 && item.daysUntilDue <= 7).length,
      tools: upcomingTools.filter((item) => item.daysUntilDue >= 0 && item.daysUntilDue <= 7).length,
    },
    thisMonth: {
      equipment: upcomingEquipment.filter((item) => item.daysUntilDue > 7 && item.daysUntilDue <= 30).length,
      tools: upcomingTools.filter((item) => item.daysUntilDue > 7 && item.daysUntilDue <= 30).length,
    },
  }

  useEffect(() => {
    loadUpcomingCalibrations()
  }, [])

  const loadUpcomingCalibrations = async () => {
    try {
      await calibrationDB.init()
      const upcoming = await calibrationDB.getUpcomingCalibrations()
      setUpcomingEquipment(upcoming.equipment)
      setUpcomingTools(upcoming.tools)
    } catch (error) {
      console.error("Error loading upcoming calibrations:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilDueColor = (days: number) => {
    if (days < 0) return "bg-red-600 hover:bg-red-700"
    if (days <= 7) return "bg-amber-500 hover:bg-amber-600"
    if (days <= 30) return "bg-yellow-500 hover:bg-yellow-600"
    return "bg-blue-500 hover:bg-blue-600"
  }

  const getDaysUntilDueText = (days: number) => {
    if (days < -999) return "Never calibrated"
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return "Due today"
    if (days === 1) return "Due tomorrow"
    return `Due in ${days} days`
  }

  const generateCalendarEvent = (item: UpcomingEquipment | UpcomingTool) => {
    const isEquipment = "equipment" in item
    const title = isEquipment
      ? `Calibration: ${item.equipment.name} - ${item.customer.name}`
      : `Tool Calibration: ${item.tool.name}`

    const description = isEquipment
      ? `Equipment calibration for ${item.equipment.name} (S/N: ${item.equipment.serialNumber}) at ${item.customer.name}`
      : `Calibration tool maintenance for ${item.tool.name} (S/N: ${item.tool.serialNumber})`

    const dueDate = new Date()
    if (isEquipment) {
      // Calculate due date for equipment
      dueDate.setDate(dueDate.getDate() + item.daysUntilDue)
    } else {
      dueDate.setDate(dueDate.getDate() + item.daysUntilDue)
    }

    const startDate = dueDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const endDate =
      new Date(dueDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title,
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}`

    window.open(calendarUrl, "_blank")
  }

  const sendEmailReminder = (item: UpcomingEquipment) => {
    const subject = `Calibration Due: ${item.equipment.name}`
    const body = `Dear ${item.customer.contact},

This is a reminder that your equipment calibration is due:

Equipment: ${item.equipment.name}
Serial Number: ${item.equipment.serialNumber}
Location: ${item.customer.location}
Status: ${getDaysUntilDueText(item.daysUntilDue)}

Please contact us to schedule your calibration appointment.

Best regards,
CalibrationPro Team`

    const mailtoUrl = `mailto:${item.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body,
    )}`

    window.location.href = mailtoUrl
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading upcoming calibrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Upcoming Calibrations</h1>
            </div>
            <Link href="/calibrations/new">
              <Button>New Calibration</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Overdue</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-red-900">{stats.overdue.equipment + stats.overdue.tools}</p>
                  <p className="text-sm text-red-700">calibrations</p>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Due This Week</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-amber-900">{stats.thisWeek.equipment + stats.thisWeek.tools}</p>
                  <p className="text-sm text-amber-700">calibrations</p>
                </div>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Due This Month</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.thisMonth.equipment + stats.thisMonth.tools}
                  </p>
                  <p className="text-sm text-blue-700">calibrations</p>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, customer, or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All priorities</option>
              <option value="overdue">Overdue</option>
              <option value="week">Due this week</option>
              <option value="month">Due this month</option>
              <option value="later">Later</option>
            </select>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="equipment" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Equipment ({filteredEquipment.length})
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tools ({filteredTools.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipment">
            {filteredEquipment.length > 0 ? (
              <div className="space-y-4">
                {filteredEquipment.map((item, index) => (
                  <Card
                    key={index}
                    className={`overflow-hidden border-l-4 ${item.daysUntilDue < 0 ? "border-l-red-500" : item.daysUntilDue <= 7 ? "border-l-amber-500" : item.daysUntilDue <= 30 ? "border-l-yellow-500" : "border-l-blue-500"}`}
                  >
                    <CardContent className="p-0">
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg">{item.equipment.name}</h3>
                              <Badge className={getDaysUntilDueColor(item.daysUntilDue)}>
                                {getDaysUntilDueText(item.daysUntilDue)}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{item.customer.name}</p>
                            <p className="text-sm text-gray-500">S/N: {item.equipment.serialNumber}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <Link
                              href={`/calibrations/new?customer=${item.customer.id}&equipment=${item.equipment.id}`}
                            >
                              <Button size="sm" className="w-full sm:w-auto">
                                Schedule Calibration
                              </Button>
                            </Link>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => generateCalendarEvent(item)}>
                                <CalendarPlus className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Add to Calendar</span>
                                <span className="inline sm:hidden">Calendar</span>
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => sendEmailReminder(item)}>
                                <Mail className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Email Customer</span>
                                <span className="inline sm:hidden">Email</span>
                              </Button>
                            </div>
                          </div>
                        </div>

                        {item.daysUntilDue < 0 && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-200 text-red-800">
                            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <p className="text-sm">
                              This calibration is <strong>{Math.abs(item.daysUntilDue)} days overdue</strong>. Immediate
                              attention required.
                            </p>
                          </div>
                        )}

                        {item.daysUntilDue >= 0 && item.daysUntilDue <= 7 && (
                          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded border border-amber-200 text-amber-800">
                            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <p className="text-sm">This calibration is due soon. Schedule within the next week.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || filterPriority !== "all"
                      ? "No equipment calibrations match your search or filter"
                      : "No upcoming equipment calibrations"}
                  </p>
                  {(searchTerm || filterPriority !== "all") && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm("")
                        setFilterPriority("all")
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tools">
            {filteredTools.length > 0 ? (
              <div className="space-y-4">
                {filteredTools.map((item, index) => (
                  <Card
                    key={index}
                    className={`overflow-hidden border-l-4 ${item.daysUntilDue < 0 ? "border-l-red-500" : item.daysUntilDue <= 7 ? "border-l-amber-500" : item.daysUntilDue <= 30 ? "border-l-yellow-500" : "border-l-blue-500"}`}
                  >
                    <CardContent className="p-0">
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg">{item.tool.name}</h3>
                              <Badge className={getDaysUntilDueColor(item.daysUntilDue)}>
                                {getDaysUntilDueText(item.daysUntilDue)}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{item.tool.manufacturer}</p>
                            <p className="text-sm text-gray-500">S/N: {item.tool.serialNumber}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <Link href={`/tools/${item.tool.id}/edit`}>
                              <Button size="sm" className="w-full sm:w-auto">
                                Update Calibration
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline" onClick={() => generateCalendarEvent(item)}>
                              <CalendarPlus className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Add to Calendar</span>
                              <span className="inline sm:hidden">Calendar</span>
                            </Button>
                          </div>
                        </div>

                        {item.daysUntilDue < 0 && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-200 text-red-800">
                            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <p className="text-sm">
                              <strong>Warning:</strong> This tool is overdue for calibration and cannot be used for
                              calibrations until updated.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || filterPriority !== "all"
                      ? "No tool calibrations match your search or filter"
                      : "No upcoming tool calibrations"}
                  </p>
                  {(searchTerm || filterPriority !== "all") && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchTerm("")
                        setFilterPriority("all")
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {upcomingEquipment.length === 0 && upcomingTools.length === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Calibrations Up to Date</h3>
              <p className="text-gray-500 mb-6">
                Great! All your equipment and tools are current with their calibrations.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/calibrations/new">
                  <Button>New Calibration</Button>
                </Link>
                <Link href="/tools">
                  <Button variant="outline">Manage Tools</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
