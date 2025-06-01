"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Wrench, FileText, Calendar, AlertTriangle, Settings, LogOut, User } from "lucide-react"
import { calibrationDB } from "@/lib/db"
import { SyncStatusIndicator } from "@/components/sync-status"
import { useAuth } from "@/components/auth-provider"

interface RecentActivity {
  id: string
  type: "calibration" | "customer" | "equipment"
  title: string
  subtitle: string
  date: string
  status?: "pass" | "fail" | "new" | "needs_attention"
}

export default function Dashboard() {
  const [isOnline, setIsOnline] = useState(true)
  const [stats, setStats] = useState({
    customers: 0,
    equipment: 0,
    calibrations: 0,
    tools: 0,
    pendingSync: 0,
    upcomingCalibrations: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Load stats from IndexedDB
    loadData()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  const loadData = async () => {
    try {
      // Wait for database to be initialized
      await calibrationDB.init()

      const customers = await calibrationDB.getCustomers()
      const equipment = await calibrationDB.getAllEquipment()
      const calibrations = await calibrationDB.getAllCalibrations()
      const tools = await calibrationDB.getTools()
      const pendingSync = await calibrationDB.getUnsyncedCalibrations()
      const upcoming = await calibrationDB.getUpcomingCalibrations()

      setStats({
        customers: customers.length,
        equipment: equipment.length,
        calibrations: calibrations.length,
        tools: tools.length,
        pendingSync: pendingSync.length,
        upcomingCalibrations: upcoming.equipment.length + upcoming.tools.length,
      })

      // Generate recent activity
      const activity: RecentActivity[] = []

      // Add recent calibrations
      const recentCalibrations = calibrations
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      for (const cal of recentCalibrations) {
        const eq = equipment.find((e) => e.id === cal.equipmentId)
        const cust = customers.find((c) => c.id === cal.customerId)

        activity.push({
          id: cal.id,
          type: "calibration",
          title: `${cal.type.replace("_", " & ")} Calibration - ${cust?.name || "Unknown Customer"}`,
          subtitle: `Equipment: ${eq?.name || "Unknown"} | Status: ${cal.result === "pass" ? "Passed" : "Failed"}`,
          date: cal.createdAt,
          status: cal.result,
        })
      }

      // Add recent customers
      const recentCustomers = customers
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2)

      for (const cust of recentCustomers) {
        activity.push({
          id: cust.id,
          type: "customer",
          title: "New Customer Added",
          subtitle: cust.name,
          date: cust.createdAt,
          status: "new",
        })
      }

      // Add equipment that needs calibration
      const equipmentNeedingCalibration = equipment.filter((eq) => {
        const eqCalibrations = calibrations.filter((cal) => cal.equipmentId === eq.id)
        if (eqCalibrations.length === 0) return true

        const lastCalibration = eqCalibrations.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0]

        const lastDate = new Date(lastCalibration.date)
        const nextDate = new Date(lastDate)
        nextDate.setFullYear(nextDate.getFullYear() + 1)

        const now = new Date()
        const daysUntilDue = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return daysUntilDue < 30
      })

      for (const eq of equipmentNeedingCalibration.slice(0, 2)) {
        const cust = customers.find((c) => c.id === eq.customerId)
        activity.push({
          id: eq.id,
          type: "equipment",
          title: `${eq.type.replace("_", " & ")} - ${cust?.name || "Unknown"}`,
          subtitle: `Equipment: ${eq.name} | Status: Needs Calibration`,
          date: eq.updatedAt,
          status: "needs_attention",
        })
      }

      // Sort by date
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setRecentActivity(activity)
      setLoading(false)
    } catch (error) {
      console.error("Error loading stats:", error)
      // Fallback to default stats
      setStats({
        customers: 0,
        equipment: 0,
        calibrations: 0,
        tools: 0,
        pendingSync: 0,
        upcomingCalibrations: 0,
      })
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Completed
          </Badge>
        )
      case "fail":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Needs Attention
          </Badge>
        )
      case "new":
        return <Badge variant="outline">New</Badge>
      case "needs_attention":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Due Soon
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getActivityLink = (activity: RecentActivity) => {
    switch (activity.type) {
      case "calibration":
        return `/calibrations/${activity.id}/report`
      case "customer":
        return `/customers/${activity.id}/details`
      case "equipment":
        return `/equipment/${activity.id}/details`
      default:
        return "/"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">CalibrationPro</h1>
            <div className="flex items-center gap-4">
              <SyncStatusIndicator />
              {stats.upcomingCalibrations > 0 && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {stats.upcomingCalibrations} due soon
                </Badge>
              )}
              {/* Add admin link */}
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customers}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment Items</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.equipment}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calibrations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.calibrations}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Due Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingCalibrations}</div>
              <p className="text-xs text-muted-foreground">Equipment & tools</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Calibration Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tools}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage customer information, locations, and contact details
              </p>
              <div className="space-y-2">
                <Link href="/customers">
                  <Button className="w-full">View Customers</Button>
                </Link>
                <Link href="/customers/new">
                  <Button variant="outline" className="w-full">
                    Add New Customer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Track and assign equipment to customers</p>
              <div className="space-y-2">
                <Link href="/equipment">
                  <Button className="w-full">View Equipment</Button>
                </Link>
                <Link href="/equipment/new">
                  <Button variant="outline" className="w-full">
                    Add Equipment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Calibrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Perform calibrations and generate reports</p>
              <div className="space-y-2">
                <Link href="/calibrations">
                  <Button className="w-full">View Calibrations</Button>
                </Link>
                <Link href="/calibrations/new">
                  <Button variant="outline" className="w-full">
                    New Calibration
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Calibration Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Manage your calibration tools and equipment</p>
              <div className="space-y-2">
                <Link href="/tools">
                  <Button className="w-full">View Tools</Button>
                </Link>
                <Link href="/tools/new">
                  <Button variant="outline" className="w-full">
                    Add Tool
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {stats.upcomingCalibrations > 0 && (
          <Card className="mt-8 border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Calibrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    You have {stats.upcomingCalibrations} calibrations due within the next 90 days
                  </p>
                </div>
                <Link href="/upcoming">
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading recent activity...</p>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <Link href={getActivityLink(activity)} key={`${activity.type}-${activity.id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString()} at{" "}
                          {new Date(activity.date).toLocaleTimeString()}
                        </p>
                      </div>
                      {activity.status && getStatusBadge(activity.status)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity found</p>
                <Link href="/calibrations/new" className="mt-4 inline-block">
                  <Button>Start Your First Calibration</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function UserMenu() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <User className="h-4 w-4" />
        <span>{user?.email}</span>
      </div>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-1" />
        Sign Out
      </Button>
    </div>
  )
}
