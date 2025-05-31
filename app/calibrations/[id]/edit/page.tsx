"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, X, CheckCircle, XCircle } from "lucide-react"
import { calibrationDB, type Calibration } from "@/lib/db"

interface SpeedPoint {
  setSpeed: number
  actualSpeed: number
  error: number
  withinTolerance: boolean
}

interface DisplacementPoint {
  setDisplacement: number
  actualDisplacement: number
  error: number
  withinTolerance: boolean
}

interface LoadCellPoint {
  applied: number
  reading: number
  error: number
  withinTolerance: boolean
}

export default function EditCalibrationPage() {
  const params = useParams()
  const router = useRouter()
  const calibrationId = params.id as string

  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form data state
  const [calibrationData, setCalibrationData] = useState({
    technician: "",
    date: "",
    temperature: "",
    humidity: "",
  })

  // Load cell specific state
  const [loadCellPoints, setLoadCellPoints] = useState<LoadCellPoint[]>([])
  const [loadCellTolerance, setLoadCellTolerance] = useState(0.1)
  const [loadCellCapacity, setLoadCellCapacity] = useState(1000)

  // Speed/displacement specific state
  const [speedPoints, setSpeedPoints] = useState<SpeedPoint[]>([])
  const [displacementPoints, setDisplacementPoints] = useState<DisplacementPoint[]>([])
  const [speedTolerance, setSpeedTolerance] = useState(2.0)
  const [displacementTolerance, setDisplacementTolerance] = useState(1.0)

  // Results
  const [loadCellResult, setLoadCellResult] = useState<"pass" | "fail" | "pending">("pending")
  const [speedResult, setSpeedResult] = useState<"pass" | "fail" | "pending">("pending")
  const [displacementResult, setDisplacementResult] = useState<"pass" | "fail" | "pending">("pending")
  const [overallResult, setOverallResult] = useState<"pass" | "fail" | "pending">("pending")

  useEffect(() => {
    loadCalibration()
  }, [calibrationId])

  const loadCalibration = async () => {
    try {
      await calibrationDB.init()
      const allCalibrations = await calibrationDB.getAllCalibrations()
      const foundCalibration = allCalibrations.find((cal) => cal.id === calibrationId)

      if (foundCalibration) {
        setCalibration(foundCalibration)

        // Set basic calibration data
        setCalibrationData({
          technician: foundCalibration.technician,
          date: foundCalibration.date,
          temperature: foundCalibration.temperature,
          humidity: foundCalibration.humidity,
        })

        // Set type-specific data
        if (foundCalibration.type === "load_cell") {
          setLoadCellPoints(foundCalibration.data.points || [])
          setLoadCellTolerance(foundCalibration.data.tolerance || 0.1)
          setLoadCellCapacity(foundCalibration.data.capacity || 1000)
        } else if (foundCalibration.type === "speed_displacement") {
          setSpeedPoints(foundCalibration.data.speedPoints || [])
          setDisplacementPoints(foundCalibration.data.displacementPoints || [])
          setSpeedTolerance(foundCalibration.data.speedTolerance || 2.0)
          setDisplacementTolerance(foundCalibration.data.displacementTolerance || 1.0)
        }
      }
    } catch (error) {
      console.error("Error loading calibration:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate results for load cell
  useEffect(() => {
    if (calibration?.type !== "load_cell") return

    const updatedPoints = loadCellPoints.map((point) => {
      if (point.reading === 0 && point.applied !== 0) {
        return { ...point, error: 0, withinTolerance: true }
      }

      const error = ((point.reading - point.applied) / point.applied) * 100
      const withinTolerance = Math.abs(error) <= loadCellTolerance

      return {
        ...point,
        error: isNaN(error) ? 0 : error,
        withinTolerance,
      }
    })

    // Only update if there's actually a change
    const hasChanged = JSON.stringify(updatedPoints) !== JSON.stringify(loadCellPoints)
    if (hasChanged) {
      setLoadCellPoints(updatedPoints)
    }

    const allWithinTolerance = updatedPoints.every((point) => point.withinTolerance)
    const hasReadings = updatedPoints.some((point) => point.reading > 0)
    const newResult = hasReadings ? (allWithinTolerance ? "pass" : "fail") : "pending"

    if (newResult !== loadCellResult) {
      setLoadCellResult(newResult)
    }
    if (newResult !== overallResult) {
      setOverallResult(newResult)
    }
  }, [loadCellPoints.map((p) => `${p.applied}-${p.reading}`).join(","), loadCellTolerance, calibration?.type])

  // Calculate results for speed/displacement
  useEffect(() => {
    if (calibration?.type !== "speed_displacement") return

    // Calculate speed results
    const updatedSpeedPoints = speedPoints.map((point) => {
      if (point.actualSpeed === 0) {
        return { ...point, error: 0, withinTolerance: true }
      }

      const error = ((point.actualSpeed - point.setSpeed) / point.setSpeed) * 100
      const withinTolerance = Math.abs(error) <= speedTolerance

      return {
        ...point,
        error: isNaN(error) ? 0 : error,
        withinTolerance,
      }
    })

    // Only update if there's actually a change
    const speedHasChanged = JSON.stringify(updatedSpeedPoints) !== JSON.stringify(speedPoints)
    if (speedHasChanged) {
      setSpeedPoints(updatedSpeedPoints)
    }

    const speedAllWithinTolerance = updatedSpeedPoints.every((point) => point.withinTolerance)
    const speedHasReadings = updatedSpeedPoints.some((point) => point.actualSpeed > 0)
    const newSpeedResult = speedHasReadings ? (speedAllWithinTolerance ? "pass" : "fail") : "pending"

    // Calculate displacement results
    const updatedDisplacementPoints = displacementPoints.map((point) => {
      if (point.actualDisplacement === 0) {
        return { ...point, error: 0, withinTolerance: true }
      }

      const error = ((point.actualDisplacement - point.setDisplacement) / point.setDisplacement) * 100
      const withinTolerance = Math.abs(error) <= displacementTolerance

      return {
        ...point,
        error: isNaN(error) ? 0 : error,
        withinTolerance,
      }
    })

    // Only update if there's actually a change
    const displacementHasChanged = JSON.stringify(updatedDisplacementPoints) !== JSON.stringify(displacementPoints)
    if (displacementHasChanged) {
      setDisplacementPoints(updatedDisplacementPoints)
    }

    const displacementAllWithinTolerance = updatedDisplacementPoints.every((point) => point.withinTolerance)
    const displacementHasReadings = updatedDisplacementPoints.some((point) => point.actualDisplacement > 0)
    const newDisplacementResult = displacementHasReadings
      ? displacementAllWithinTolerance
        ? "pass"
        : "fail"
      : "pending"

    // Update results only if they changed
    if (newSpeedResult !== speedResult) {
      setSpeedResult(newSpeedResult)
    }
    if (newDisplacementResult !== displacementResult) {
      setDisplacementResult(newDisplacementResult)
    }

    // Calculate overall result
    if (newSpeedResult !== "pending" && newDisplacementResult !== "pending") {
      const newOverallResult = newSpeedResult === "pass" && newDisplacementResult === "pass" ? "pass" : "fail"
      if (newOverallResult !== overallResult) {
        setOverallResult(newOverallResult)
      }
    } else if (overallResult !== "pending") {
      setOverallResult("pending")
    }
  }, [
    speedPoints.map((p) => `${p.setSpeed}-${p.actualSpeed}`).join(","),
    displacementPoints.map((p) => `${p.setDisplacement}-${p.actualDisplacement}`).join(","),
    speedTolerance,
    displacementTolerance,
    calibration?.type,
  ])

  const updateLoadCellReading = (index: number, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setLoadCellPoints((prevPoints) => {
      const newPoints = [...prevPoints]
      newPoints[index] = { ...newPoints[index], reading: numValue }
      return newPoints
    })
  }

  const updateSpeedReading = (index: number, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setSpeedPoints((prevPoints) => {
      const newPoints = [...prevPoints]
      newPoints[index] = { ...newPoints[index], actualSpeed: numValue }
      return newPoints
    })
  }

  const updateDisplacementReading = (index: number, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setDisplacementPoints((prevPoints) => {
      const newPoints = [...prevPoints]
      newPoints[index] = { ...newPoints[index], actualDisplacement: numValue }
      return newPoints
    })
  }

  const handleSave = async () => {
    if (!calibration) return

    setSaving(true)
    try {
      let updatedData: any = {}

      if (calibration.type === "load_cell") {
        updatedData = {
          tolerance: loadCellTolerance,
          capacity: loadCellCapacity,
          points: loadCellPoints,
        }
      } else if (calibration.type === "speed_displacement") {
        updatedData = {
          speedTolerance,
          displacementTolerance,
          speedPoints,
          displacementPoints,
          speedResult,
          displacementResult,
        }
      }

      const updatedCalibration = {
        ...calibration,
        technician: calibrationData.technician,
        date: calibrationData.date,
        temperature: calibrationData.temperature,
        humidity: calibrationData.humidity,
        data: updatedData,
        result: overallResult as "pass" | "fail",
        synced: false, // Mark as unsynced since it was modified
        updatedAt: new Date().toISOString(),
      }

      await calibrationDB.updateCalibration(updatedCalibration)
      alert("Calibration updated successfully!")
      router.push(`/calibrations/${calibrationId}/report`)
    } catch (error) {
      console.error("Error updating calibration:", error)
      alert("Error updating calibration. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calibration...</p>
        </div>
      </div>
    )
  }

  if (!calibration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Calibration Not Found</h2>
          <p className="text-gray-600 mb-4">The calibration with ID "{calibrationId}" could not be found.</p>
          <Link href="/calibrations">
            <Button>Back to Calibrations</Button>
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
              <Link href={`/calibrations/${calibrationId}/report`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit {calibration.type.replace("_", " & ")} Calibration
              </h1>
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
              <Link href={`/calibrations/${calibrationId}/report`}>
                <Button variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  value={calibrationData.temperature}
                  onChange={(e) => setCalibrationData((prev) => ({ ...prev, temperature: e.target.value }))}
                  placeholder="72"
                />
              </div>

              <div>
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  value={calibrationData.humidity}
                  onChange={(e) => setCalibrationData((prev) => ({ ...prev, humidity: e.target.value }))}
                  placeholder="45"
                />
              </div>

              {calibration.type === "load_cell" && (
                <>
                  <div>
                    <Label>Tolerance</Label>
                    <p className="text-sm text-gray-600">±{loadCellTolerance}%</p>
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <p className="text-sm text-gray-600">{loadCellCapacity} lbs</p>
                  </div>
                </>
              )}

              {calibration.type === "speed_displacement" && (
                <>
                  <div>
                    <Label>Speed Tolerance</Label>
                    <p className="text-sm text-gray-600">±{speedTolerance}%</p>
                  </div>
                  <div>
                    <Label>Displacement Tolerance</Label>
                    <p className="text-sm text-gray-600">±{displacementTolerance}%</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Calibration Data */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Calibration Readings</CardTitle>
            </CardHeader>
            <CardContent>
              {calibration.type === "load_cell" ? (
                <LoadCellEditForm
                  points={loadCellPoints}
                  tolerance={loadCellTolerance}
                  onUpdateReading={updateLoadCellReading}
                  result={loadCellResult}
                />
              ) : (
                <SpeedDisplacementEditForm
                  speedPoints={speedPoints}
                  displacementPoints={displacementPoints}
                  speedTolerance={speedTolerance}
                  displacementTolerance={displacementTolerance}
                  onUpdateSpeedReading={updateSpeedReading}
                  onUpdateDisplacementReading={updateDisplacementReading}
                  speedResult={speedResult}
                  displacementResult={displacementResult}
                />
              )}

              {overallResult !== "pending" && (
                <div
                  className="mt-6 p-4 rounded-lg border-2"
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
                      ? "All readings are within the specified tolerances."
                      : "One or more readings exceed the specified tolerances. Equipment requires adjustment."}
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

function LoadCellEditForm({
  points,
  tolerance,
  onUpdateReading,
  result,
}: {
  points: LoadCellPoint[]
  tolerance: number
  onUpdateReading: (index: number, value: string) => void
  result: "pass" | "fail" | "pending"
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const nextIndex = index + 1
      if (nextIndex < points.length && inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus()
        inputRefs.current[nextIndex]?.select()
      }
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">Applied Load (lbs)</th>
              <th className="text-left p-3 font-medium">Reading (lbs)</th>
              <th className="text-left p-3 font-medium">Error (%)</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium bg-blue-50">{point.applied}</td>
                <td className="p-3">
                  <Input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="number"
                    step="0.1"
                    value={point.reading || ""}
                    onChange={(e) => onUpdateReading(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-24"
                    placeholder="0.0"
                  />
                </td>
                <td className="p-3">
                  <span
                    className={`font-medium ${Math.abs(point.error) > tolerance ? "text-red-600" : "text-green-600"}`}
                  >
                    {point.error.toFixed(3)}%
                  </span>
                </td>
                <td className="p-3">
                  {point.reading > 0 ? (
                    <Badge
                      variant={point.withinTolerance ? "default" : "destructive"}
                      className={point.withinTolerance ? "bg-green-600" : ""}
                    >
                      {point.withinTolerance ? "PASS" : "FAIL"}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SpeedDisplacementEditForm({
  speedPoints,
  displacementPoints,
  speedTolerance,
  displacementTolerance,
  onUpdateSpeedReading,
  onUpdateDisplacementReading,
  speedResult,
  displacementResult,
}: {
  speedPoints: SpeedPoint[]
  displacementPoints: DisplacementPoint[]
  speedTolerance: number
  displacementTolerance: number
  onUpdateSpeedReading: (index: number, value: string) => void
  onUpdateDisplacementReading: (index: number, value: string) => void
  speedResult: "pass" | "fail" | "pending"
  displacementResult: "pass" | "fail" | "pending"
}) {
  const speedInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const displacementInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSpeedKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const nextIndex = index + 1
      if (nextIndex < speedPoints.length && speedInputRefs.current[nextIndex]) {
        speedInputRefs.current[nextIndex]?.focus()
        speedInputRefs.current[nextIndex]?.select()
      }
    }
  }

  const handleDisplacementKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const nextIndex = index + 1
      if (nextIndex < displacementPoints.length && displacementInputRefs.current[nextIndex]) {
        displacementInputRefs.current[nextIndex]?.focus()
        displacementInputRefs.current[nextIndex]?.select()
      }
    }
  }

  return (
    <Tabs defaultValue="speed" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="speed">Speed Calibration</TabsTrigger>
        <TabsTrigger value="displacement">Displacement Calibration</TabsTrigger>
      </TabsList>

      <TabsContent value="speed" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Set Speed (in/min)</th>
                <th className="text-left p-3 font-medium">Actual Speed (in/min)</th>
                <th className="text-left p-3 font-medium">Error (%)</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {speedPoints.map((point, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{point.setSpeed}</td>
                  <td className="p-3">
                    <Input
                      ref={(el) => (speedInputRefs.current[index] = el)}
                      type="number"
                      step="0.01"
                      value={point.actualSpeed || ""}
                      onChange={(e) => onUpdateSpeedReading(index, e.target.value)}
                      onKeyDown={(e) => handleSpeedKeyDown(e, index)}
                      className="w-32"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-3">
                    <span
                      className={`font-medium ${
                        Math.abs(point.error) > speedTolerance ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {point.error.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3">
                    {point.actualSpeed > 0 ? (
                      <Badge
                        variant={point.withinTolerance ? "default" : "destructive"}
                        className={point.withinTolerance ? "bg-green-600" : ""}
                      >
                        {point.withinTolerance ? "PASS" : "FAIL"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="displacement" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Set Displacement (in)</th>
                <th className="text-left p-3 font-medium">Actual Displacement (in)</th>
                <th className="text-left p-3 font-medium">Error (%)</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {displacementPoints.map((point, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{point.setDisplacement}</td>
                  <td className="p-3">
                    <Input
                      ref={(el) => (displacementInputRefs.current[index] = el)}
                      type="number"
                      step="0.001"
                      value={point.actualDisplacement || ""}
                      onChange={(e) => onUpdateDisplacementReading(index, e.target.value)}
                      onKeyDown={(e) => handleDisplacementKeyDown(e, index)}
                      className="w-32"
                      placeholder="0.000"
                    />
                  </td>
                  <td className="p-3">
                    <span
                      className={`font-medium ${
                        Math.abs(point.error) > displacementTolerance ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {point.error.toFixed(3)}%
                    </span>
                  </td>
                  <td className="p-3">
                    {point.actualDisplacement > 0 ? (
                      <Badge
                        variant={point.withinTolerance ? "default" : "destructive"}
                        className={point.withinTolerance ? "bg-green-600" : ""}
                      >
                        {point.withinTolerance ? "PASS" : "FAIL"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  )
}
