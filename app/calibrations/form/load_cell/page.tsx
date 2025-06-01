"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Printer, CheckCircle, XCircle, ArrowUp, ArrowDown } from "lucide-react"
import { calibrationDB, type CalibrationTool } from "@/lib/db"

interface LoadCellPoint {
  appliedLoad: number
  appliedOverride: number
  unitUnderTest: number
  unitError: number
  runError: number
}

interface RunOverview {
  run1MaxError: number
  run2MaxError: number
  maxRepeatError: number
}

export default function LoadCellCalibrationPage() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customer")
  const equipmentId = searchParams.get("equipment")

  const [calibrationData, setCalibrationData] = useState({
    technician: "",
    date: new Date().toISOString().split("T")[0],
    temperature: "",
    humidity: "",
    tempBefore: "",
    tempAfter: "",
    gravityMultiplier: "1.0000",
    tolerance: 0.1,
    capacity: 1000,
    toolsUsed: [] as string[],
  })

  // Tension runs
  const [tensionRun1, setTensionRun1] = useState<LoadCellPoint[]>([
    { appliedLoad: 0, appliedOverride: 0, unitUnderTest: 0, unitError: 0, runError: 0 },
    {
      appliedLoad: 100,
      appliedOverride: 100,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 200,
      appliedOverride: 200,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 300,
      appliedOverride: 300,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 400,
      appliedOverride: 400,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 500,
      appliedOverride: 500,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 600,
      appliedOverride: 600,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 700,
      appliedOverride: 700,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 800,
      appliedOverride: 800,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 900,
      appliedOverride: 900,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 1000,
      appliedOverride: 1000,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
  ])

  const [tensionRun2, setTensionRun2] = useState<LoadCellPoint[]>([
    { appliedLoad: 0, appliedOverride: 0, unitUnderTest: 0, unitError: 0, runError: 0 },
    {
      appliedLoad: 100,
      appliedOverride: 100,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 200,
      appliedOverride: 200,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 300,
      appliedOverride: 300,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 400,
      appliedOverride: 400,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 500,
      appliedOverride: 500,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 600,
      appliedOverride: 600,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 700,
      appliedOverride: 700,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 800,
      appliedOverride: 800,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 900,
      appliedOverride: 900,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 1000,
      appliedOverride: 1000,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
  ])

  // Compression runs
  const [compressionRun1, setCompressionRun1] = useState<LoadCellPoint[]>([
    { appliedLoad: 0, appliedOverride: 0, unitUnderTest: 0, unitError: 0, runError: 0 },
    {
      appliedLoad: 100,
      appliedOverride: 100,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 200,
      appliedOverride: 200,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 300,
      appliedOverride: 300,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 400,
      appliedOverride: 400,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 500,
      appliedOverride: 500,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 600,
      appliedOverride: 600,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 700,
      appliedOverride: 700,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 800,
      appliedOverride: 800,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 900,
      appliedOverride: 900,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 1000,
      appliedOverride: 1000,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
  ])

  const [compressionRun2, setCompressionRun2] = useState<LoadCellPoint[]>([
    { appliedLoad: 0, appliedOverride: 0, unitUnderTest: 0, unitError: 0, runError: 0 },
    {
      appliedLoad: 100,
      appliedOverride: 100,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 200,
      appliedOverride: 200,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 300,
      appliedOverride: 300,
      unitError: 0,
      unitUnderTest: 0,
      runError: 0,
    },
    {
      appliedLoad: 400,
      appliedOverride: 400,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 500,
      appliedOverride: 500,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 600,
      appliedOverride: 600,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 700,
      appliedOverride: 700,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 800,
      appliedOverride: 800,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 900,
      appliedOverride: 900,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
    {
      appliedLoad: 1000,
      appliedOverride: 1000,
      unitUnderTest: 0,
      unitError: 0,
      runError: 0,
    },
  ])

  // Overview data
  const [tensionOverview, setTensionOverview] = useState<RunOverview>({
    run1MaxError: 0,
    run2MaxError: 0,
    maxRepeatError: 0,
  })

  const [compressionOverview, setCompressionOverview] = useState<RunOverview>({
    run1MaxError: 0,
    run2MaxError: 0,
    maxRepeatError: 0,
  })

  const [overallResult, setOverallResult] = useState<"pass" | "fail" | "pending">("pending")
  const [availableTools, setAvailableTools] = useState<CalibrationTool[]>([])

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    loadTools()
  }, [])

  const loadTools = async () => {
    try {
      const tools = await calibrationDB.getToolsByType("load_tool")
      const activeTools = tools.filter((tool) => {
        const nextDate = new Date(tool.nextCalibrationDate)
        const now = new Date()
        return nextDate >= now
      })
      setAvailableTools(activeTools)
    } catch (error) {
      console.error("Error loading tools:", error)
    }
  }

  // Calculate load cell run data with debouncing
  const calculateLoadCellRun = useCallback(
    (run: LoadCellPoint[], index: number, value: string, field: "appliedOverride" | "unitUnderTest") => {
      const newRun = [...run]
      const numValue = Number.parseFloat(value) || 0

      if (field === "appliedOverride") {
        newRun[index].appliedOverride = numValue
      } else {
        newRun[index].unitUnderTest = numValue
      }

      newRun[index].unitError = newRun[index].unitUnderTest - newRun[index].appliedOverride

      if (newRun[index].appliedOverride > 0) {
        newRun[index].runError = (newRun[index].unitError / newRun[index].appliedOverride) * 100
      }

      return newRun
    },
    [],
  )

  // Debounced update functions
  const updateTensionRun1Override = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setTensionRun1((prev) => calculateLoadCellRun(prev, index, value, "appliedOverride"))
      }, 100)
    },
    [calculateLoadCellRun],
  )

  const updateTensionRun2Override = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setTensionRun2((prev) => calculateLoadCellRun(prev, index, value, "appliedOverride"))
      }, 100)
    },
    [calculateLoadCellRun],
  )

  const updateCompressionRun1Override = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setCompressionRun1((prev) => calculateLoadCellRun(prev, index, value, "appliedOverride"))
      }, 100)
    },
    [calculateLoadCellRun],
  )

  const updateCompressionRun2Override = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setCompressionRun2((prev) => calculateLoadCellRun(prev, index, value, "appliedOverride"))
      }, 100)
    },
    [calculateLoadCellRun],
  )

  // Update functions for Unit Under Test
  const updateTensionRun1Test = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setTensionRun1((prev) => calculateLoadCellRun(prev, index, value, "unitUnderTest"))
      }, 100)
    },
    [calculateLoadCellRun],
  )

  const updateTensionRun2Test = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setTensionRun2((prev) => calculateLoadCellRun(prev, index, value, "unitUnderTest"))
      }, 100)
    },
    [calculateLoadCellRun],
  )

  const updateCompressionRun1Test = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setCompressionRun1((prev) => calculateLoadCellRun(prev, index, value, "unitUnderTest"))
      }, 100)
    },
    [calculateLoadCellRun],
  )

  const updateCompressionRun2Test = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setCompressionRun2((prev) => calculateLoadCellRun(prev, index, value, "unitUnderTest"))
      }, 100)
    },
    [calculateLoadCellRun],
  )

  // Calculate overview data
  useEffect(() => {
    // Tension overview
    const tensionRun1Max = Math.max(...tensionRun1.map((r) => Math.abs(r.runError)))
    const tensionRun2Max = Math.max(...tensionRun2.map((r) => Math.abs(r.runError)))

    setTensionOverview({
      run1MaxError: tensionRun1Max,
      run2MaxError: tensionRun2Max,
      maxRepeatError: Math.abs(tensionRun1Max - tensionRun2Max),
    })

    // Compression overview
    const compressionRun1Max = Math.max(...compressionRun1.map((r) => Math.abs(r.runError)))
    const compressionRun2Max = Math.max(...compressionRun2.map((r) => Math.abs(r.runError)))

    setCompressionOverview({
      run1MaxError: compressionRun1Max,
      run2MaxError: compressionRun2Max,
      maxRepeatError: Math.abs(compressionRun1Max - compressionRun2Max),
    })

    // Calculate overall result
    const allErrors = [
      ...tensionRun1.map((r) => Math.abs(r.runError)),
      ...tensionRun2.map((r) => Math.abs(r.runError)),
      ...compressionRun1.map((r) => Math.abs(r.runError)),
      ...compressionRun2.map((r) => Math.abs(r.runError)),
    ]

    const maxError = Math.max(...allErrors)
    const hasReadings = allErrors.some((error) => error > 0)

    if (hasReadings) {
      setOverallResult(maxError <= calibrationData.tolerance ? "pass" : "fail")
    } else {
      setOverallResult("pending")
    }
  }, [tensionRun1, tensionRun2, compressionRun1, compressionRun2, calibrationData.tolerance])

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const nextIndex = index + 1
      if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus()
        inputRefs.current[nextIndex]?.select()
      }
    }
  }

  const handlePrint = async () => {
    try {
      // First save the calibration and wait for it to complete
      const calibrationId = Date.now().toString()
      const calibration = {
        id: calibrationId,
        customerId: customerId || "",
        equipmentId: equipmentId || "",
        type: "load_cell" as const,
        technician: calibrationData.technician,
        date: calibrationData.date,
        temperature: calibrationData.temperature,
        humidity: calibrationData.humidity,
        toolsUsed: calibrationData.toolsUsed,
        data: {
          tolerance: calibrationData.tolerance,
          capacity: calibrationData.capacity,
          tempBefore: calibrationData.tempBefore,
          tempAfter: calibrationData.tempAfter,
          gravityMultiplier: calibrationData.gravityMultiplier,
          tensionRun1,
          tensionRun2,
          compressionRun1,
          compressionRun2,
          tensionOverview,
          compressionOverview,
        },
        result: overallResult as "pass" | "fail",
        synced: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Wait for the save to complete
      await calibrationDB.addCalibration(calibration)

      // Small delay to ensure database write is complete
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Navigate to the certificate page with auto-print
      window.location.href = `/calibrations/${calibrationId}/report?print=true`
    } catch (error) {
      console.error("Error saving calibration for print:", error)
      alert("Error preparing calibration for print. Please try again.")
    }
  }

  const handleSave = async () => {
    try {
      const calibration = {
        id: Date.now().toString(),
        customerId: customerId || "",
        equipmentId: equipmentId || "",
        type: "load_cell" as const,
        technician: calibrationData.technician,
        date: calibrationData.date,
        temperature: calibrationData.temperature,
        humidity: calibrationData.humidity,
        toolsUsed: calibrationData.toolsUsed,
        data: {
          tolerance: calibrationData.tolerance,
          capacity: calibrationData.capacity,
          tempBefore: calibrationData.tempBefore,
          tempAfter: calibrationData.tempAfter,
          gravityMultiplier: calibrationData.gravityMultiplier,
          tensionRun1,
          tensionRun2,
          compressionRun1,
          compressionRun2,
          tensionOverview,
          compressionOverview,
        },
        result: overallResult as "pass" | "fail",
        synced: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await calibrationDB.addCalibration(calibration)
      alert("Calibration saved successfully!")
    } catch (error) {
      console.error("Error saving calibration:", error)
      alert("Error saving calibration. Please try again.")
    }
  }

  const getErrorColor = (error: number) => {
    const absError = Math.abs(error)
    if (absError <= 0.1) return "bg-green-100"
    if (absError <= 0.2) return "bg-yellow-100"
    if (absError <= 0.5) return "bg-orange-100"
    return "bg-red-100"
  }

  const LoadCellRunTable = ({
    title,
    data,
    onUpdateOverride,
    onUpdateTest,
    type,
  }: {
    title: string
    data: LoadCellPoint[]
    onUpdateOverride: (index: number, value: string) => void
    onUpdateTest: (index: number, value: string) => void
    type: "tension" | "compression"
  }) => {
    // Completely isolated local state
    const [localValues, setLocalValues] = useState<{ [key: string]: string }>({})

    const handleOverrideChange = (index: number, value: string) => {
      const key = `override-${index}`
      setLocalValues((prev) => ({ ...prev, [key]: value }))
      onUpdateOverride(index, value)
    }

    const handleTestChange = (index: number, value: string) => {
      const key = `test-${index}`
      setLocalValues((prev) => ({ ...prev, [key]: value }))
      onUpdateTest(index, value)
    }

    const getOverrideValue = (index: number) => {
      const key = `override-${index}`
      if (localValues[key] !== undefined) return localValues[key]
      return data[index]?.appliedOverride?.toString() || ""
    }

    const getTestValue = (index: number) => {
      const key = `test-${index}`
      if (localValues[key] !== undefined) return localValues[key]
      return data[index]?.unitUnderTest?.toString() || ""
    }

    return (
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
          {type === "tension" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          {title}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium">#</th>
                <th className="text-left p-2 font-medium">Applied {type === "tension" ? "Tension" : "Comp"}</th>
                <th className="text-left p-2 font-medium">Applied Override</th>
                <th className="text-left p-2 font-medium">Unit Under Test</th>
                <th className="text-left p-2 font-medium">Unit Error</th>
                <th className="text-left p-2 font-medium">% Run Error</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{index + 1}</td>
                  <td className="p-2 font-medium bg-blue-50">{point.appliedLoad}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={getOverrideValue(index)}
                      onChange={(e) => handleOverrideChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const currentRow = e.currentTarget.closest("tr")
                          const nextInput = currentRow?.querySelector("td:nth-child(4) input") as HTMLInputElement
                          if (nextInput) {
                            nextInput.focus()
                            nextInput.select()
                          } else {
                            const nextRow = currentRow?.nextElementSibling
                            const nextRowInput = nextRow?.querySelector("td:nth-child(3) input") as HTMLInputElement
                            if (nextRowInput) {
                              nextRowInput.focus()
                              nextRowInput.select()
                            }
                          }
                        }
                      }}
                      className="w-24 h-8 bg-red-100"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={getTestValue(index)}
                      onChange={(e) => handleTestChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const currentRow = e.currentTarget.closest("tr")
                          const nextRow = currentRow?.nextElementSibling
                          const nextRowInput = nextRow?.querySelector("td:nth-child(3) input") as HTMLInputElement
                          if (nextRowInput) {
                            nextRowInput.focus()
                            nextRowInput.select()
                          }
                        }
                      }}
                      className={`w-24 h-8 ${getErrorColor(point.runError)}`}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">{point.unitError.toFixed(4)}</td>
                  <td className="p-2">
                    <span
                      className={`font-medium ${Math.abs(point.runError) > calibrationData.tolerance ? "text-red-600" : "text-green-600"}`}
                    >
                      {point.runError.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/calibrations/new">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Load Cell Calibration</h1>
            </div>
            <div className="flex items-center gap-2">
              {overallResult !== "pending" && (
                <Badge
                  variant={overallResult === "pass" ? "default" : "destructive"}
                  className={overallResult === "pass" ? "bg-green-600" : ""}
                >
                  {overallResult === "pass" ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  {overallResult.toUpperCase()}
                </Badge>
              )}
              <Button onClick={handleSave} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calibration Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calibration Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="technician">Technician</Label>
                <Input
                  id="technician"
                  value={calibrationData.technician}
                  onChange={(e) => setCalibrationData((prev) => ({ ...prev, technician: e.target.value }))}
                  placeholder="Enter technician name"
                />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={calibrationData.date}
                  onChange={(e) => setCalibrationData((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="tempBefore">Temp Before (°F)</Label>
                <Input
                  id="tempBefore"
                  value={calibrationData.tempBefore}
                  onChange={(e) => setCalibrationData((prev) => ({ ...prev, tempBefore: e.target.value }))}
                  placeholder="74.2"
                />
              </div>

              <div>
                <Label htmlFor="tempAfter">Temp After (°F)</Label>
                <Input
                  id="tempAfter"
                  value={calibrationData.tempAfter}
                  onChange={(e) => setCalibrationData((prev) => ({ ...prev, tempAfter: e.target.value }))}
                  placeholder="73.90"
                />
              </div>

              <div>
                <Label htmlFor="gravityMultiplier">Gravity Multiplier</Label>
                <Input
                  id="gravityMultiplier"
                  value={calibrationData.gravityMultiplier}
                  onChange={(e) => setCalibrationData((prev) => ({ ...prev, gravityMultiplier: e.target.value }))}
                  placeholder="1.0000"
                />
              </div>

              <div>
                <Label htmlFor="tools">Calibration Tools Used</Label>
                <Select
                  value={calibrationData.toolsUsed[0] || ""}
                  onValueChange={(value) =>
                    setCalibrationData((prev) => ({ ...prev, toolsUsed: value ? [value] : [] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select calibration tool" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTools.map((tool) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        {tool.name} - {tool.serialNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-yellow-50 p-3 rounded border">
                <Label>Tolerance</Label>
                <p className="text-sm font-medium">±{calibrationData.tolerance}%</p>
              </div>

              <div className="bg-green-50 p-3 rounded border">
                <Label>Capacity</Label>
                <p className="text-sm font-medium">{calibrationData.capacity} lbs</p>
              </div>
            </CardContent>
          </Card>

          {/* Main Calibration Data */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Data Fill Section - Follow-the-Force Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tension-run1" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="tension-run1">Tension Run 1</TabsTrigger>
                  <TabsTrigger value="tension-run2">Tension Run 2</TabsTrigger>
                  <TabsTrigger value="compression-run1">Compression Run 1</TabsTrigger>
                  <TabsTrigger value="compression-run2">Compression Run 2</TabsTrigger>
                </TabsList>

                <TabsContent value="tension-run1" className="mt-6">
                  <LoadCellRunTable
                    title="Tension Data Fill - Run 1"
                    data={tensionRun1}
                    onUpdateOverride={updateTensionRun1Override}
                    onUpdateTest={updateTensionRun1Test}
                    type="tension"
                  />
                </TabsContent>

                <TabsContent value="tension-run2" className="mt-6">
                  <LoadCellRunTable
                    title="Tension Data Fill - Run 2"
                    data={tensionRun2}
                    onUpdateOverride={updateTensionRun2Override}
                    onUpdateTest={updateTensionRun2Test}
                    type="tension"
                  />
                </TabsContent>

                <TabsContent value="compression-run1" className="mt-6">
                  <LoadCellRunTable
                    title="Compression Data Fill - Run 1"
                    data={compressionRun1}
                    onUpdateOverride={updateCompressionRun1Override}
                    onUpdateTest={updateCompressionRun1Test}
                    type="compression"
                  />
                </TabsContent>

                <TabsContent value="compression-run2" className="mt-6">
                  <LoadCellRunTable
                    title="Compression Data Fill - Run 2"
                    data={compressionRun2}
                    onUpdateOverride={updateCompressionRun2Override}
                    onUpdateTest={updateCompressionRun2Test}
                    type="compression"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calibration Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h4 className="font-medium mb-3 text-center bg-gray-200 p-2 rounded">Calibration Overview - Tension</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between bg-yellow-200 p-1 rounded">
                    <span>Max Error Run 1:</span>
                    <span className="font-medium">{tensionOverview.run1MaxError.toFixed(3)} [%]</span>
                  </div>
                  <div className="flex justify-between bg-yellow-200 p-1 rounded">
                    <span>Max Error Run 2:</span>
                    <span className="font-medium">{tensionOverview.run2MaxError.toFixed(3)} [%]</span>
                  </div>
                  <div className="flex justify-between bg-yellow-200 p-1 rounded">
                    <span>Max Repeat Error:</span>
                    <span className="font-medium">{tensionOverview.maxRepeatError.toFixed(3)} [%]</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium mb-3 text-center bg-gray-200 p-2 rounded">
                  Calibration Overview - Compression
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between bg-yellow-200 p-1 rounded">
                    <span>Max Error Run 1:</span>
                    <span className="font-medium">{compressionOverview.run1MaxError.toFixed(3)} [%]</span>
                  </div>
                  <div className="flex justify-between bg-yellow-200 p-1 rounded">
                    <span>Max Error Run 2:</span>
                    <span className="font-medium">{compressionOverview.run2MaxError.toFixed(3)} [%]</span>
                  </div>
                  <div className="flex justify-between bg-yellow-200 p-1 rounded">
                    <span>Max Repeat Error:</span>
                    <span className="font-medium">{compressionOverview.maxRepeatError.toFixed(3)} [%]</span>
                  </div>
                </div>
              </div>

              {overallResult !== "pending" && (
                <div
                  className="p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: overallResult === "pass" ? "#f0f9ff" : "#fef2f2",
                    borderColor: overallResult === "pass" ? "#3b82f6" : "#ef4444",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {overallResult === "pass" ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <h3 className="text-lg font-bold">Calibration {overallResult === "pass" ? "PASSED" : "FAILED"}</h3>
                  </div>
                  <p className="text-sm mt-1">
                    {overallResult === "pass"
                      ? "All readings are within the specified tolerance."
                      : "One or more readings exceed the specified tolerance."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
