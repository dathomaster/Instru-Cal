"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { calibrationDB } from "@/lib/db/calibrations"

export default function SpeedDisplacementCalibrationForm() {
  const [vehicle, setVehicle] = useState("")
  const [driver, setDriver] = useState("")
  const [testDate, setTestDate] = useState("")
  const [speedReadings, setSpeedReadings] = useState("")
  const [displacementReadings, setDisplacementReadings] = useState("")

  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const calibrationData = {
      vehicle,
      driver,
      testDate,
      speedReadings,
      displacementReadings,
      type: "speed_displacement",
    }

    try {
      // After successful save, use the returned calibration ID
      const savedCalibration = await calibrationDB.addCalibration(calibrationData)
      console.log("✅ Calibration saved with ID:", savedCalibration.id)

      // Redirect to the report page using the proper ID
      router.push(`/calibrations/${savedCalibration.id}/report`)
    } catch (error) {
      console.error("Failed to save calibration:", error)
      // Optionally, display an error message to the user
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="vehicle">Vehicle:</label>
        <input type="text" id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="driver">Driver:</label>
        <input type="text" id="driver" value={driver} onChange={(e) => setDriver(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="testDate">Test Date:</label>
        <input type="date" id="testDate" value={testDate} onChange={(e) => setTestDate(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="speedReadings">Speed Readings:</label>
        <textarea
          id="speedReadings"
          value={speedReadings}
          onChange={(e) => setSpeedReadings(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="displacementReadings">Displacement Readings:</label>
        <textarea
          id="displacementReadings"
          value={displacementReadings}
          onChange={(e) => setDisplacementReadings(e.target.value)}
          required
        />
      </div>
      <button type="submit">Save Calibration</button>
    </form>
  )
}
