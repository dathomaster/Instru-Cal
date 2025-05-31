"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, X } from "lucide-react"
import { calibrationDB, type CalibrationTool } from "@/lib/db"

export default function EditToolPage() {
  const params = useParams()
  const router = useRouter()
  const toolId = params.id as string

  const [tool, setTool] = useState<CalibrationTool | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "" as "load_tool" | "displacement_tool" | "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    accuracy: "",
    range: "",
    lastCalibrationDate: "",
    nextCalibrationDate: "",
    certificateNumber: "",
    status: "" as "active" | "due_soon" | "overdue" | "out_of_service" | "",
    notes: "",
  })

  useEffect(() => {
    loadTool()
  }, [toolId])

  const loadTool = async () => {
    try {
      await calibrationDB.init()
      const foundTool = await calibrationDB.getToolById(toolId)

      if (foundTool) {
        setTool(foundTool)
        setFormData({
          name: foundTool.name,
          type: foundTool.type,
          serialNumber: foundTool.serialNumber,
          manufacturer: foundTool.manufacturer,
          model: foundTool.model,
          accuracy: foundTool.accuracy,
          range: foundTool.range,
          lastCalibrationDate: foundTool.lastCalibrationDate,
          nextCalibrationDate: foundTool.nextCalibrationDate,
          certificateNumber: foundTool.certificateNumber,
          status: foundTool.status,
          notes: foundTool.notes,
        })
      }
    } catch (error) {
      console.error("Error loading tool:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type || !formData.serialNumber || !formData.manufacturer) {
      alert("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      const updatedTool: CalibrationTool = {
        ...tool!,
        name: formData.name,
        type: formData.type as "load_tool" | "displacement_tool",
        serialNumber: formData.serialNumber,
        manufacturer: formData.manufacturer,
        model: formData.model,
        accuracy: formData.accuracy,
        range: formData.range,
        lastCalibrationDate: formData.lastCalibrationDate,
        nextCalibrationDate: formData.nextCalibrationDate,
        certificateNumber: formData.certificateNumber,
        status: formData.status as "active" | "due_soon" | "overdue" | "out_of_service",
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
      }

      await calibrationDB.updateTool(updatedTool)
      alert("Tool updated successfully!")
      router.push(`/tools/${toolId}/details`)
    } catch (error) {
      console.error("Error updating tool:", error)
      alert("Error updating tool. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCancel = () => {
    router.push(`/tools/${toolId}/details`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tool...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href={`/tools/${toolId}/details`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Tool</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Tool Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Tool Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Precision Load Cell Tester"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tool Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tool type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="load_tool">Load Tool</SelectItem>
                      <SelectItem value="displacement_tool">Displacement Tool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="serialNumber">Serial Number *</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => handleChange("serialNumber", e.target.value)}
                    placeholder="e.g., PLT-2023-001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange("manufacturer", e.target.value)}
                    placeholder="e.g., Calibration Systems Inc"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    placeholder="e.g., CSI-5000"
                  />
                </div>

                <div>
                  <Label htmlFor="accuracy">Accuracy</Label>
                  <Input
                    id="accuracy"
                    value={formData.accuracy}
                    onChange={(e) => handleChange("accuracy", e.target.value)}
                    placeholder="e.g., ±0.05%"
                  />
                </div>

                <div>
                  <Label htmlFor="range">Range</Label>
                  <Input
                    id="range"
                    value={formData.range}
                    onChange={(e) => handleChange("range", e.target.value)}
                    placeholder="e.g., 0-5000 lbs"
                  />
                </div>

                <div>
                  <Label htmlFor="lastCalibrationDate">Last Calibration Date</Label>
                  <Input
                    id="lastCalibrationDate"
                    type="date"
                    value={formData.lastCalibrationDate}
                    onChange={(e) => handleChange("lastCalibrationDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="nextCalibrationDate">Next Calibration Date</Label>
                  <Input
                    id="nextCalibrationDate"
                    type="date"
                    value={formData.nextCalibrationDate}
                    onChange={(e) => handleChange("nextCalibrationDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="certificateNumber">Certificate Number</Label>
                  <Input
                    id="certificateNumber"
                    value={formData.certificateNumber}
                    onChange={(e) => handleChange("certificateNumber", e.target.value)}
                    placeholder="e.g., CSI-CERT-2024-001"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="due_soon">Due Soon</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="out_of_service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Additional notes about the tool"
                    rows={3}
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
