"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Printer, TrendingUp, TrendingDown } from "lucide-react"
import { calibrationDB } from "@/lib/db"

interface SpeedRun {
  setSpeed: number
  distance: number
  timeTotal: number
  timeMin: number
  timeSeconds: number
  actualSpeed: number
  unitError: number
  percentError: number
  class: "A" | "B" | "C" | "D" | ""
}

interface DisplacementRun {
  setDisplacement: number
  actualDisplacement: number
  error: number
  percentError: number
  class: "A" | "B" | "C" | "D" | ""
}

interface RunOverview {
  run1MaxError: number
  run2MaxError: number
  maxRepeatError: number
}

export default function SpeedDisplacementCalibrationPage() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customer")
  const equipmentId = searchParams.get("equipment")

  const [calibrationData, setCalibrationData] = useState({
    technician: "",
    date: new Date().toISOString().split("T")[0],
    temperature: "",
    humidity: "",
    speedTolerance: 2.0,
    displacementTolerance: 1.0,
  })

  // Speed runs - UP and DOWN for Run 1 and Run 2
  const [speedUpRun1, setSpeedUpRun1] = useState<SpeedRun[]>([
    {
      setSpeed: 1,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 2,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 5,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 10,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 12,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
  ])

  const [speedDownRun1, setSpeedDownRun1] = useState<SpeedRun[]>([
    {
      setSpeed: 12,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 10,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 5,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 2,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 1,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
  ])

  const [speedUpRun2, setSpeedUpRun2] = useState<SpeedRun[]>([
    {
      setSpeed: 1,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 2,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 5,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 10,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 12,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
  ])

  const [speedDownRun2, setSpeedDownRun2] = useState<SpeedRun[]>([
    {
      setSpeed: 12,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 10,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 5,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 2,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
    {
      setSpeed: 1,
      distance: 0,
      timeTotal: 0,
      timeMin: 0,
      timeSeconds: 0,
      actualSpeed: 0,
      unitError: 0,
      percentError: 0,
      class: "",
    },
  ])

  // Displacement runs - UP and DOWN for Run 1 and Run 2
  const [displacementUpRun1, setDisplacementUpRun1] = useState<DisplacementRun[]>([
    { setDisplacement: 1.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 5.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 10.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 25.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 50.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
  ])

  const [displacementDownRun1, setDisplacementDownRun1] = useState<DisplacementRun[]>([
    { setDisplacement: 50.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 25.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 10.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 5.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 1.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
  ])

  const [displacementUpRun2, setDisplacementUpRun2] = useState<DisplacementRun[]>([
    { setDisplacement: 1.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 5.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 10.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 25.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 50.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
  ])

  const [displacementDownRun2, setDisplacementDownRun2] = useState<DisplacementRun[]>([
    { setDisplacement: 50.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 25.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 10.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 5.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
    { setDisplacement: 1.0, actualDisplacement: 0, error: 0, percentError: 0, class: "" },
  ])

  // Overview data
  const [speedOverview, setSpeedOverview] = useState<{
    up: RunOverview
    down: RunOverview
  }>({
    up: { run1MaxError: 0, run2MaxError: 0, maxRepeatError: 0 },
    down: { run1MaxError: 0, run2MaxError: 0, maxRepeatError: 0 },
  })

  const [displacementOverview, setDisplacementOverview] = useState<{
    up: RunOverview
    down: RunOverview
  }>({
    up: { run1MaxError: 0, run2MaxError: 0, maxRepeatError: 0 },
    down: { run1MaxError: 0, run2MaxError: 0, maxRepeatError: 0 },
  })

  const [overallResult, setOverallResult] = useState<"pass" | "fail" | "pending">("pending")

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Calculate speed run data with debouncing
  const calculateSpeedRun = useCallback((run: SpeedRun[], index: number, field: string, value: string) => {
    const newRun = [...run]
    const numValue = Number.parseFloat(value) || 0

    if (field === "distance") {
      newRun[index].distance = numValue
    } else if (field === "timeMin") {
      newRun[index].timeMin = numValue
    } else if (field === "timeSeconds") {
      newRun[index].timeSeconds = numValue
    }

    // Calculate total time and actual speed
    const totalTime = newRun[index].timeMin + newRun[index].timeSeconds / 60
    newRun[index].timeTotal = totalTime

    if (totalTime > 0 && newRun[index].distance > 0) {
      newRun[index].actualSpeed = newRun[index].distance / totalTime
      newRun[index].unitError = newRun[index].actualSpeed - newRun[index].setSpeed
      newRun[index].percentError = (newRun[index].unitError / newRun[index].setSpeed) * 100

      // Determine class based on error
      const absError = Math.abs(newRun[index].percentError)
      if (absError <= 0.5) newRun[index].class = "A"
      else if (absError <= 1.0) newRun[index].class = "B"
      else if (absError <= 2.0) newRun[index].class = "C"
      else newRun[index].class = "D"
    }

    return newRun
  }, [])

  // Calculate displacement run data with debouncing
  const calculateDisplacementRun = useCallback((run: DisplacementRun[], index: number, value: string) => {
    const newRun = [...run]
    const numValue = Number.parseFloat(value) || 0

    newRun[index].actualDisplacement = numValue
    newRun[index].error = newRun[index].actualDisplacement - newRun[index].setDisplacement

    if (newRun[index].setDisplacement > 0) {
      newRun[index].percentError = (newRun[index].error / newRun[index].setDisplacement) * 100

      // Determine class based on error
      const absError = Math.abs(newRun[index].percentError)
      if (absError <= 0.5) newRun[index].class = "A"
      else if (absError <= 1.0) newRun[index].class = "B"
      else if (absError <= 2.0) newRun[index].class = "C"
      else newRun[index].class = "D"
    }

    return newRun
  }, [])

  // Debounced update functions for speed runs
  const updateSpeedUpRun1 = useCallback(
    (index: number, field: string, value: string) => {
      setTimeout(() => {
        setSpeedUpRun1((prev) => calculateSpeedRun(prev, index, field, value))
      }, 100)
    },
    [calculateSpeedRun],
  )

  const updateSpeedDownRun1 = useCallback(
    (index: number, field: string, value: string) => {
      setTimeout(() => {
        setSpeedDownRun1((prev) => calculateSpeedRun(prev, index, field, value))
      }, 100)
    },
    [calculateSpeedRun],
  )

  const updateSpeedUpRun2 = useCallback(
    (index: number, field: string, value: string) => {
      setTimeout(() => {
        setSpeedUpRun2((prev) => calculateSpeedRun(prev, index, field, value))
      }, 100)
    },
    [calculateSpeedRun],
  )

  const updateSpeedDownRun2 = useCallback(
    (index: number, field: string, value: string) => {
      setTimeout(() => {
        setSpeedDownRun2((prev) => calculateSpeedRun(prev, index, field, value))
      }, 100)
    },
    [calculateSpeedRun],
  )

  // Debounced update functions for displacement runs
  const updateDisplacementUpRun1 = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setDisplacementUpRun1((prev) => calculateDisplacementRun(prev, index, value))
      }, 100)
    },
    [calculateDisplacementRun],
  )

  const updateDisplacementDownRun1 = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setDisplacementDownRun1((prev) => calculateDisplacementRun(prev, index, value))
      }, 100)
    },
    [calculateDisplacementRun],
  )

  const updateDisplacementUpRun2 = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setDisplacementUpRun2((prev) => calculateDisplacementRun(prev, index, value))
      }, 100)
    },
    [calculateDisplacementRun],
  )

  const updateDisplacementDownRun2 = useCallback(
    (index: number, value: string) => {
      setTimeout(() => {
        setDisplacementDownRun2((prev) => calculateDisplacementRun(prev, index, value))
      }, 100)
    },
    [calculateDisplacementRun],
  )

  // Calculate overview data
  useEffect(() => {
    // Speed overview
    const speedUpRun1Max = Math.max(...speedUpRun1.map((r) => Math.abs(r.percentError)))
    const speedUpRun2Max = Math.max(...speedUpRun2.map((r) => Math.abs(r.percentError)))
    const speedDownRun1Max = Math.max(...speedDownRun1.map((r) => Math.abs(r.percentError)))
    const speedDownRun2Max = Math.max(...speedDownRun2.map((r) => Math.abs(r.percentError)))

    setSpeedOverview({
      up: {
        run1MaxError: speedUpRun1Max,
        run2MaxError: speedUpRun2Max,
        maxRepeatError: Math.abs(speedUpRun1Max - speedUpRun2Max),
      },
      down: {
        run1MaxError: speedDownRun1Max,
        run2MaxError: speedDownRun2Max,
        maxRepeatError: Math.abs(speedDownRun1Max - speedDownRun2Max),
      },
    })

    // Displacement overview
    const dispUpRun1Max = Math.max(...displacementUpRun1.map((r) => Math.abs(r.percentError)))
    const dispUpRun2Max = Math.max(...displacementUpRun2.map((r) => Math.abs(r.percentError)))
    const dispDownRun1Max = Math.max(...displacementDownRun1.map((r) => Math.abs(r.percentError)))
    const dispDownRun2Max = Math.max(...displacementDownRun2.map((r) => Math.abs(r.percentError)))

    setDisplacementOverview({
      up: {
        run1MaxError: dispUpRun1Max,
        run2MaxError: dispUpRun2Max,
        maxRepeatError: Math.abs(dispUpRun1Max - dispUpRun2Max),
      },
      down: {
        run1MaxError: dispDownRun1Max,
        run2MaxError: dispDownRun2Max,
        maxRepeatError: Math.abs(dispDownRun1Max - dispDownRun2Max),
      },
    })
  }, [
    speedUpRun1,
    speedDownRun1,
    speedUpRun2,
    speedDownRun2,
    displacementUpRun1,
    displacementDownRun1,
    displacementUpRun2,
    displacementDownRun2,
  ])

  const handlePrint = () => {
    window.print()
  }

  const handleSave = async () => {
    try {
      const calibration = {
        id: Date.now().toString(),
        customerId: customerId || "",
        equipmentId: equipmentId || "",
        type: "speed_displacement" as const,
        technician: calibrationData.technician,
        date: calibrationData.date,
        temperature: calibrationData.temperature,
        humidity: calibrationData.humidity,
        data: {
          speedTolerance: calibrationData.speedTolerance,
          displacementTolerance: calibrationData.displacementTolerance,
          speedUpRun1,
          speedDownRun1,
          speedUpRun2,
          speedDownRun2,
          displacementUpRun1,
          displacementDownRun1,
          displacementUpRun2,
          displacementDownRun2,
          speedOverview,
          displacementOverview,
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

  const SpeedRunTable = ({
    title,
    data,
    onUpdate,
    direction,
  }: {
    title: string
    data: SpeedRun[]
    onUpdate: (index: number, field: string, value: string) => void
    direction: "up" | "down"
  }) => {
    // Completely isolated local state
    const [localValues, setLocalValues] = useState<{ [key: string]: string }>({})

    const handleFieldChange = (index: number, field: string, value: string) => {
      const key = `${field}-${index}`
      setLocalValues((prev) => ({ ...prev, [key]: value }))
      onUpdate(index, field, value)
    }

    const getFieldValue = (index: number, field: string) => {
      const key = `${field}-${index}`
      if (localValues[key] !== undefined) return localValues[key]

      switch (field) {
        case "distance":
          return data[index]?.distance?.toString() || ""
        case "timeMin":
          return data[index]?.timeMin?.toString() || ""
        case "timeSeconds":
          return data[index]?.timeSeconds?.toString() || ""
        default:
          return ""
      }
    }

    return (
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
          {direction === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {title}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium">UUT Set Speed</th>
                <th className="text-left p-2 font-medium">Distance</th>
                <th className="text-left p-2 font-medium">Time Total</th>
                <th className="text-left p-2 font-medium">Time Min</th>
                <th className="text-left p-2 font-medium">Time Seconds</th>
                <th className="text-left p-2 font-medium">Actual Speed</th>
                <th className="text-left p-2 font-medium">Unit Error</th>
                <th className="text-left p-2 font-medium">% Error</th>
                <th className="text-left p-2 font-medium">Class</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{point.setSpeed}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={getFieldValue(index, "distance")}
                      onChange={(e) => handleFieldChange(index, "distance", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const currentRow = e.currentTarget.closest("tr")
                          const nextInput = currentRow?.querySelector("td:nth-child(4) input") as HTMLInputElement
                          if (nextInput) {
                            nextInput.focus()
                            nextInput.select()
                          }
                        }
                      }}
                      className="w-20 h-8"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="p-2">{point.timeTotal.toFixed(3)}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="1"
                      value={getFieldValue(index, "timeMin")}
                      onChange={(e) => handleFieldChange(index, "timeMin", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const currentRow = e.currentTarget.closest("tr")
                          const nextInput = currentRow?.querySelector("td:nth-child(5) input") as HTMLInputElement
                          if (nextInput) {
                            nextInput.focus()
                            nextInput.select()
                          }
                        }
                      }}
                      className="w-16 h-8"
                      placeholder="0"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={getFieldValue(index, "timeSeconds")}
                      onChange={(e) => handleFieldChange(index, "timeSeconds", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const currentRow = e.currentTarget.closest("tr")
                          const nextRow = currentRow?.nextElementSibling
                          const nextRowInput = nextRow?.querySelector("td:nth-child(2) input") as HTMLInputElement
                          if (nextRowInput) {
                            nextRowInput.focus()
                            nextRowInput.select()
                          }
                        }
                      }}
                      className="w-20 h-8"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="p-2">{point.actualSpeed.toFixed(3)}</td>
                  <td className="p-2">{point.unitError.toFixed(3)}</td>
                  <td className="p-2">
                    <span
                      className={`font-medium ${Math.abs(point.percentError) > calibrationData.speedTolerance ? "text-red-600" : "text-green-600"}`}
                    >
                      {point.percentError.toFixed(3)}%
                    </span>
                  </td>
                  <td className="p-2">
                    <Badge
                      variant={point.class === "A" ? "default" : point.class === "B" ? "secondary" : "destructive"}
                    >
                      {point.class || "-"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Also update DisplacementRunTable
  const DisplacementRunTable = ({
    title,
    data,
    onUpdate,
    direction,
  }: {
    title: string
    data: DisplacementRun[]
    onUpdate: (index: number, value: string) => void
    direction: "up" | "down"
  }) => {
    // Completely isolated local state
    const [localValues, setLocalValues] = useState<{ [key: string]: string }>({})

    const handleChange = (index: number, value: string) => {
      const key = `displacement-${index}`
      setLocalValues((prev) => ({ ...prev, [key]: value }))
      onUpdate(index, value)
    }

    const getValue = (index: number) => {
      const key = `displacement-${index}`
      if (localValues[key] !== undefined) return localValues[key]
      return data[index]?.actualDisplacement?.toString() || ""
    }

    return (
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 flex items-center gap-2">
          {direction === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {title}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2 font-medium">Set Displacement (in)</th>
                <th className="text-left p-2 font-medium">Actual Displacement (in)</th>
                <th className="text-left p-2 font-medium">Error (in)</th>
                <th className="text-left p-2 font-medium">% Error</th>
                <th className="text-left p-2 font-medium">Class</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{point.setDisplacement}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={getValue(index)}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const currentRow = e.currentTarget.closest("tr")
                          const nextRow = currentRow?.nextElementSibling
                          const nextRowInput = nextRow?.querySelector("td:nth-child(2) input") as HTMLInputElement
                          if (nextRowInput) {
                            nextRowInput.focus()
                            nextRowInput.select()
                          }
                        }
                      }}
                      className="w-24 h-8"
                      placeholder="0.000"
                    />
                  </td>
                  <td className="p-2">{point.error.toFixed(3)}</td>
                  <td className="p-2">
                    <span
                      className={`font-medium ${Math.abs(point.percentError) > calibrationData.displacementTolerance ? "text-red-600" : "text-green-600"}`}
                    >
                      {point.percentError.toFixed(3)}%
                    </span>
                  </td>
                  <td className="p-2">
                    <Badge
                      variant={point.class === "A" ? "default" : point.class === "B" ? "secondary" : "destructive"}
                    >
                      {point.class || "-"}
                    </Badge>
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
              <h1 className="text-2xl font-bold text-gray-900">Speed & Displacement Calibration</h1>
            </div>
            <div className="flex items-center gap-2">
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

              <div>
                <Label>Speed Tolerance</Label>
                <p className="text-sm text-gray-600">±{calibrationData.speedTolerance}%</p>
              </div>

              <div>
                <Label>Displacement Tolerance</Label>
                <p className="text-sm text-gray-600">±{calibrationData.displacementTolerance}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Main Calibration Data */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Calibration Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="speed-up" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="speed-up">Speed UP</TabsTrigger>
                  <TabsTrigger value="speed-down">Speed DOWN</TabsTrigger>
                  <TabsTrigger value="displacement-up">Displacement UP</TabsTrigger>
                  <TabsTrigger value="displacement-down">Displacement DOWN</TabsTrigger>
                </TabsList>

                <TabsContent value="speed-up" className="mt-6">
                  <SpeedRunTable
                    title="Speed UP - Run 1"
                    data={speedUpRun1}
                    onUpdate={updateSpeedUpRun1}
                    direction="up"
                  />
                  <SpeedRunTable
                    title="Speed UP - Run 2"
                    data={speedUpRun2}
                    onUpdate={updateSpeedUpRun2}
                    direction="up"
                  />
                </TabsContent>

                <TabsContent value="speed-down" className="mt-6">
                  <SpeedRunTable
                    title="Speed DOWN - Run 1"
                    data={speedDownRun1}
                    onUpdate={updateSpeedDownRun1}
                    direction="down"
                  />
                  <SpeedRunTable
                    title="Speed DOWN - Run 2"
                    data={speedDownRun2}
                    onUpdate={updateSpeedDownRun2}
                    direction="down"
                  />
                </TabsContent>

                <TabsContent value="displacement-up" className="mt-6">
                  <DisplacementRunTable
                    title="Displacement UP - Run 1"
                    data={displacementUpRun1}
                    onUpdate={updateDisplacementUpRun1}
                    direction="up"
                  />
                  <DisplacementRunTable
                    title="Displacement UP - Run 2"
                    data={displacementUpRun2}
                    onUpdate={updateDisplacementUpRun2}
                    direction="up"
                  />
                </TabsContent>

                <TabsContent value="displacement-down" className="mt-6">
                  <DisplacementRunTable
                    title="Displacement DOWN - Run 1"
                    data={displacementDownRun1}
                    onUpdate={updateDisplacementDownRun1}
                    direction="down"
                  />
                  <DisplacementRunTable
                    title="Displacement DOWN - Run 2"
                    data={displacementDownRun2}
                    onUpdate={updateDisplacementDownRun2}
                    direction="down"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Speed Overview</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Speed Up</p>
                    <p>Run 1 Max: {speedOverview.up.run1MaxError.toFixed(2)}%</p>
                    <p>Run 2 Max: {speedOverview.up.run2MaxError.toFixed(2)}%</p>
                    <p>Max Repeat: {speedOverview.up.maxRepeatError.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Speed Down</p>
                    <p>Run 1 Max: {speedOverview.down.run1MaxError.toFixed(2)}%</p>
                    <p>Run 2 Max: {speedOverview.down.run2MaxError.toFixed(2)}%</p>
                    <p>Max Repeat: {speedOverview.down.maxRepeatError.toFixed(2)}%</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Displacement Overview</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Displacement Up</p>
                    <p>Run 1 Max: {displacementOverview.up.run1MaxError.toFixed(2)}%</p>
                    <p>Run 2 Max: {displacementOverview.up.run2MaxError.toFixed(2)}%</p>
                    <p>Max Repeat: {displacementOverview.up.maxRepeatError.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Displacement Down</p>
                    <p>Run 1 Max: {displacementOverview.down.run1MaxError.toFixed(2)}%</p>
                    <p>Run 2 Max: {displacementOverview.down.run2MaxError.toFixed(2)}%</p>
                    <p>Max Repeat: {displacementOverview.down.maxRepeatError.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
