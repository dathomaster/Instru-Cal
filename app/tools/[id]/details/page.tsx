"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Wrench, AlertTriangle } from "lucide-react"
import { calibrationDB, type CalibrationTool } from "@/lib/db"

export default function ToolDetailPage() {
  const params = useParams()
  const toolId = params.id as string

  const [tool, setTool] = useState<CalibrationTool | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadToolData()
  }, [toolId])

  const loadToolData = async () => {
    try {
      await calibrationDB.init()
      const foundTool = await calibrationDB.getToolById(toolId)
      setTool(foundTool)
    } catch (error) {
      console.error("Error loading tool:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tool details...</p>
        </div>
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tool Not Found</h2>
          <p className="text-gray-600 mb-4">The tool with ID "{toolId}" could not be found.</p>
          <Link href="/tools">
            <Button>Back to Tools</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600"
      case "due_soon":
        return "bg-yellow-600"
      case "overdue":
        return "bg-red-600"
      case "out_of_service":
        return "bg-gray-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "due_soon":
        return "Due Soon"
      case "overdue":
        return "Overdue"
      case "out_of_service":
        return "Out of Service"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/tools">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{tool.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(tool.status)}>{getStatusText(tool.status)}</Badge>
              <Link href={`/tools/${toolId}/edit`}>
                <Button>Edit Tool</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tool Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tool Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Tool Name</p>
                  <p className="text-lg font-medium">{tool.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-gray-700 capitalize">{tool.type.replace("_", " ")}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Serial Number</p>
                  <p className="text-gray-700">{tool.serialNumber}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Manufacturer</p>
                  <p className="text-gray-700">{tool.manufacturer}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Model</p>
                  <p className="text-gray-700">{tool.model}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Accuracy</p>
                  <p className="text-gray-700">{tool.accuracy}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Range</p>
                  <p className="text-gray-700">{tool.range}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Certificate Number</p>
                  <p className="text-gray-700">{tool.certificateNumber || "Not specified"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Last Calibration</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{new Date(tool.lastCalibrationDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Next Calibration</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-700">{new Date(tool.nextCalibrationDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {tool.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{tool.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/tools/${toolId}/edit`}>
                <Button className="w-full">Update Calibration</Button>
              </Link>
              <Link href="/tools">
                <Button variant="outline" className="w-full">
                  Back to Tools
                </Button>
              </Link>
              <Link href="/tools/new">
                <Button variant="outline" className="w-full">
                  Add New Tool
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Status Alerts */}
        {(tool.status === "overdue" || tool.status === "due_soon") && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`h-6 w-6 ${tool.status === "overdue" ? "text-red-600" : "text-yellow-600"}`}
                />
                <div>
                  <h3 className={`font-medium ${tool.status === "overdue" ? "text-red-900" : "text-yellow-900"}`}>
                    {tool.status === "overdue" ? "Calibration Overdue" : "Calibration Due Soon"}
                  </h3>
                  <p className={`text-sm ${tool.status === "overdue" ? "text-red-700" : "text-yellow-700"}`}>
                    {tool.status === "overdue"
                      ? "This tool's calibration is overdue and cannot be used for calibrations until updated."
                      : "This tool's calibration is due soon. Please schedule a calibration update."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
