"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { calibrationDB } from "@/lib/db/calibrations"

export default function LoadCellCalibrationForm() {
  const [capacity, setCapacity] = useState("")
  const [units, setUnits] = useState("kg")
  const [manufacturer, setManufacturer] = useState("")
  const [model, setModel] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const calibrationData = {
      capacity: Number.parseFloat(capacity),
      units,
      manufacturer,
      model,
      type: "load_cell",
    }

    try {
      // After successful save, use the returned calibration ID
      const savedCalibration = await calibrationDB.addCalibration(calibrationData)
      console.log("✅ Calibration saved with ID:", savedCalibration.id)

      // Redirect to the report page using the proper ID
      router.push(`/calibrations/${savedCalibration.id}/report`)
    } catch (error) {
      console.error("🚨 Error saving calibration:", error)
      alert("Failed to save calibration. Please try again.")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Load Cell Calibration Form</h1>
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label htmlFor="capacity" className="block text-gray-700 text-sm font-bold mb-2">
            Capacity
          </label>
          <input
            type="number"
            id="capacity"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Enter capacity"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="units" className="block text-gray-700 text-sm font-bold mb-2">
            Units
          </label>
          <select
            id="units"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
          >
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
            <option value="N">N</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="manufacturer" className="block text-gray-700 text-sm font-bold mb-2">
            Manufacturer
          </label>
          <input
            type="text"
            id="manufacturer"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="Enter manufacturer"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="model" className="block text-gray-700 text-sm font-bold mb-2">
            Model
          </label>
          <input
            type="text"
            id="model"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Enter model"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Save Calibration
          </button>
        </div>
      </form>
    </div>
  )
}
