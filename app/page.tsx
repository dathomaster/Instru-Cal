"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Wrench,
  FileText,
  Calendar,
  AlertTriangle,
  LogOut,
  User,
  PlusCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react"
import { calibrationDB } from "@/lib/db"
import { syncManager, type SyncStatus } from "@/lib/sync"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/sidebar"

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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: "offline",
    pendingItems: 0,
  })
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
  const { user, signOut } = useAuth()

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Subscribe to sync status
    const unsubscribe = syncManager.subscribe(setSyncStatus)

    // Load stats from IndexedDB
    loadData()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
      unsubscribe()
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
        .slice(0, 3)

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

  const getSyncStatusIcon = () => {
    switch (syncStatus.status) {
      case "online":
        return <Wifi className="h-4 w-4" />
      case "offline":
        return <WifiOff className="h-4 w-4" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "synced":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getSyncStatusColor = () => {
    switch (syncStatus.status) {
      case "online":
      case "synced":
        return "bg-green-100 text-green-700 border-green-200"
      case "offline":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "syncing":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "error":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getSyncStatusText = () => {
    switch (syncStatus.status) {
      case "online":
        return "Online"
      case "offline":
        return "Offline"
      case "syncing":
        return "Syncing"
      case "synced":
        return "Synced"
      case "error":
        return "Error"
      default:
        return "Unknown"
    }
  }

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return "Never"
    const date = new Date(syncStatus.lastSyncTime)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="flex items-center gap-4">
                {stats.upcomingCalibrations > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {stats.upcomingCalibrations} due soon
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{user?.username || user?.email}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Sync status card */}
          <div className={`mb-6 p-3 rounded-lg border flex items-center justify-between ${getSyncStatusColor()}`}>
            <div className="flex items-center gap-2">
              {getSyncStatusIcon()}
              <span className="font-medium">{getSyncStatusText()}</span>
              {syncStatus.pendingItems > 0 && (
                <Badge variant="secondary" className="bg-white">
                  {syncStatus.pendingItems} pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {syncStatus.lastSyncTime && <span className="text-sm">Last sync: {formatLastSync()}</span>}
              {syncStatus.status === "online" && syncStatus.pendingItems > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncManager.forceSync()}
                  disabled={syncStatus.status === "syncing"}
                  className="bg-white"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${syncStatus.status === "syncing" ? "animate-spin" : ""}`} />
                  Sync Now
                </Button>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Start New Calibration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new calibration record for a customer's equipment
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/calibrations/new" className="w-full">
                  <Button className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Calibration
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Add New Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Register a new customer and their equipment details
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/customers/new" className="w-full">
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    New Customer
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calibrations</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.calibrations}</div>
                <Link href="/calibrations" className="text-xs text-blue-600 hover:underline">
                  View all
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customers}</div>
                <Link href="/customers" className="text-xs text-blue-600 hover:underline">
                  View all
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipment</CardTitle>
                <Wrench className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.equipment}</div>
                <Link href="/equipment" className="text-xs text-blue-600 hover:underline">
                  View all
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingCalibrations}</div>
                <Link href="/upcoming" className="text-xs text-blue-600 hover:underline">
                  View schedule
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Calibrations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading recent activity...</p>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
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
    </div>
  )
}
