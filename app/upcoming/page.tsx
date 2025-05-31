"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, AlertTriangle, Wrench, FileText, Mail, CalendarPlus } from "lucide-react"
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
    if (days < 0) return "bg-red-600"
    if (days <= 7) return "bg-red-500"
    if (days <= 30) return "bg-yellow-500"
    return "bg-blue-500"
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Upcoming Calibrations</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Equipment Calibrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment Calibrations ({upcomingEquipment.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEquipment.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEquipment.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{item.equipment.name}</h3>
                          <p className="text-sm text-gray-600">{item.customer.name}</p>
                          <p className="text-xs text-gray-500">S/N: {item.equipment.serialNumber}</p>
                        </div>
                        <Badge className={getDaysUntilDueColor(item.daysUntilDue)}>
                          {getDaysUntilDueText(item.daysUntilDue)}
                        </Badge>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/calibrations/new?customer=${item.customer.id}&equipment=${item.equipment.id}`}>
                          <Button size="sm">Schedule Calibration</Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => generateCalendarEvent(item)}>
                          <CalendarPlus className="h-4 w-4 mr-1" />
                          Add to Calendar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => sendEmailReminder(item)}>
                          <Mail className="h-4 w-4 mr-1" />
                          Email Customer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming equipment calibrations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tool Calibrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tool Calibrations ({upcomingTools.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTools.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTools.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{item.tool.name}</h3>
                          <p className="text-sm text-gray-600">{item.tool.manufacturer}</p>
                          <p className="text-xs text-gray-500">S/N: {item.tool.serialNumber}</p>
                        </div>
                        <Badge className={getDaysUntilDueColor(item.daysUntilDue)}>
                          {getDaysUntilDueText(item.daysUntilDue)}
                        </Badge>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/tools/${item.tool.id}/edit`}>
                          <Button size="sm">Update Calibration</Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => generateCalendarEvent(item)}>
                          <CalendarPlus className="h-4 w-4 mr-1" />
                          Add to Calendar
                        </Button>
                      </div>

                      {item.daysUntilDue < 0 && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <p className="text-xs text-red-600">
                            Tool calibration is overdue - cannot be used for calibrations
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming tool calibrations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
