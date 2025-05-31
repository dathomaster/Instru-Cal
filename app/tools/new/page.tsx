"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import { calibrationDB, type CalibrationTool } from "@/lib/db"

export default function NewToolPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    type: "" as "load_tool" | "displacement_tool" | "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    accuracy: "",
    range: "",
    lastCalibrationDate: "",
    certificateNumber: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type || !formData.serialNumber || !formData.manufacturer) {
      alert("Please fill in all required fields")
      return
    }

    try {
      // Calculate next calibration date (1 year from last calibration)
      const lastDate = new Date(formData.lastCalibrationDate || new Date())
      const nextDate = new Date(lastDate)
      nextDate.setFullYear(nextDate.getFullYear() + 1)

      const newTool: CalibrationTool = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type as "load_tool" | "displacement_tool",
        serialNumber: formData.serialNumber,
        manufacturer: formData.manufacturer,
        model: formData.model,
        accuracy: formData.accuracy,
        range: formData.range,
        lastCalibrationDate: formData.lastCalibrationDate || new Date().toISOString().split("T")[0],
        nextCalibrationDate: nextDate.toISOString().split("T")[0],
        certificateNumber: formData.certificateNumber,
        status: "active",
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await calibrationDB.addTool(newTool)
      alert("Calibration tool saved successfully!")
      router.push("/tools")
    } catch (error) {
      console.error("Error saving tool:", error)
      alert("Error saving tool. Please try again.")
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link href="/tools">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add New Calibration Tool</h1>
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
                  <Label htmlFor="certificateNumber">Certificate Number</Label>
                  <Input
                    id="certificateNumber"
                    value={formData.certificateNumber}
                    onChange={(e) => handleChange("certificateNumber", e.target.value)}
                    placeholder="e.g., CSI-CERT-2024-001"
                  />
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

              <div className="flex gap-4 pt-6">
                <Link href="/tools" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Tool
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
