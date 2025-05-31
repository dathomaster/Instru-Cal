"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Plus, Wrench, Calendar, AlertTriangle } from "lucide-react"
import { calibrationDB, type CalibrationTool } from "@/lib/db"

export default function ToolsPage() {
  const [tools, setTools] = useState<CalibrationTool[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTools()
  }, [])

  const loadTools = async () => {
    try {
      await calibrationDB.init()
      const allTools = await calibrationDB.getTools()

      // Update tool status based on calibration dates
      const updatedTools = allTools.map((tool) => {
        const nextDate = new Date(tool.nextCalibrationDate)
        const now = new Date()
        const daysUntilDue = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        let status: "active" | "due_soon" | "overdue" | "out_of_service" = "active"
        if (daysUntilDue < 0) {
          status = "overdue"
        } else if (daysUntilDue <= 30) {
          status = "due_soon"
        }

        return { ...tool, status }
      })

      setTools(updatedTools)
    } catch (error) {
      console.error("Error loading tools:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const getTypeColor = (type: string) => {
    return type === "load_tool" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
  }

  const getTypeText = (type: string) => {
    return type === "load_tool" ? "Load Tool" : "Displacement Tool"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calibration tools...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Calibration Tools</h1>
            </div>
            <Link href="/tools/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(tool.status)}>{getStatusText(tool.status)}</Badge>
                    <Badge variant="outline" className={getTypeColor(tool.type)}>
                      {getTypeText(tool.type)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Manufacturer</p>
                  <p className="text-sm text-gray-600">{tool.manufacturer}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Model</p>
                  <p className="text-sm text-gray-600">{tool.model}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Serial Number</p>
                  <p className="text-sm text-gray-600">{tool.serialNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">Accuracy</p>
                    <p className="text-sm text-gray-600">{tool.accuracy}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Range</p>
                    <p className="text-sm text-gray-600">{tool.range}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Next calibration</p>
                    <p className="text-sm text-gray-600">{new Date(tool.nextCalibrationDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {tool.status === "overdue" && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-xs text-red-600">Tool calibration is overdue</p>
                  </div>
                )}

                {tool.status === "due_soon" && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-xs text-yellow-600">Tool calibration due soon</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Link href={`/tools/${tool.id}/details`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/tools/${tool.id}/edit`}>
                    <Button className="flex-1">Edit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {tools.length === 0 ? "No calibration tools found" : "No tools match your search"}
            </p>
            <Link href="/tools/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {tools.length === 0 ? "Add Your First Tool" : "Add Tool"}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
