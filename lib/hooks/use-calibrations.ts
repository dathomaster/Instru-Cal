"use client"

import { useState, useEffect, useCallback } from "react"
import { calibrationDB } from "../db"

// Define types for our hook
export interface Calibration {
  id: string
  customerId: string
  equipmentId: string
  toolId: string
  type: string
  date: string
  technician: string
  result: "PASS" | "FAIL"
  notes?: string
  reportNumber?: string
  [key: string]: any // For additional fields
}

export interface CalibrationWithNames extends Calibration {
  customerName: string
  equipmentName: string
  toolName: string
}

interface UseCalibrationOptions {
  includeNames?: boolean
  filterBy?: {
    field: string
    value: any
  }
  sortBy?: {
    field: string
    direction: "asc" | "desc"
  }
}

/**
 * Custom hook for accessing and managing calibration data
 */
export function useCalibrations(options: UseCalibrationOptions = {}) {
  const [calibrations, setCalibrations] = useState<CalibrationWithNames[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Load calibrations with optional filtering and sorting
  const loadCalibrations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Get all calibrations
      let allCalibrations = await calibrationDB.getAllCalibrations()

      // Apply filtering if specified
      if (options.filterBy) {
        const { field, value } = options.filterBy
        allCalibrations = allCalibrations.filter((cal) => cal[field] === value)
      }

      // Apply sorting if specified
      if (options.sortBy) {
        const { field, direction } = options.sortBy
        allCalibrations.sort((a, b) => {
          if (direction === "asc") {
            return a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0
          } else {
            return a[field] > b[field] ? -1 : a[field] < b[field] ? 1 : 0
          }
        })
      }

      // Add names if requested
      if (options.includeNames) {
        const calibrationsWithNames = await Promise.all(
          allCalibrations.map(async (cal) => {
            try {
              // Get customer name
              const customer = await calibrationDB.getCustomerById(cal.customerId)
              const customerName = customer ? customer.name : "Unknown Customer"

              // Get equipment name
              const equipment = await calibrationDB.getEquipmentById(cal.equipmentId)
              const equipmentName = equipment ? equipment.name : "Unknown Equipment"

              // Get tool name
              const tool = await calibrationDB.getToolById(cal.toolId)
              const toolName = tool ? tool.name : "Unknown Tool"

              return {
                ...cal,
                customerName,
                equipmentName,
                toolName,
              }
            } catch (err) {
              // If there's an error getting related data, still return the calibration
              return {
                ...cal,
                customerName: "Error loading",
                equipmentName: "Error loading",
                toolName: "Error loading",
              }
            }
          }),
        )

        setCalibrations(calibrationsWithNames)
      } else {
        // Just add empty name fields
        setCalibrations(
          allCalibrations.map((cal) => ({
            ...cal,
            customerName: "",
            equipmentName: "",
            toolName: "",
          })),
        )
      }

      setLoading(false)
    } catch (err) {
      console.error("Error loading calibrations:", err)
      setError("Failed to load calibrations")
      setLoading(false)
    }
  }, [options.filterBy, options.sortBy, options.includeNames])

  // Create a new calibration
  const createCalibration = useCallback(
    async (calibrationData: Omit<Calibration, "id">) => {
      try {
        const newId = await calibrationDB.addCalibration(calibrationData)
        await loadCalibrations()
        return newId
      } catch (err) {
        console.error("Error creating calibration:", err)
        setError("Failed to create calibration")
        throw err
      }
    },
    [loadCalibrations],
  )

  // Update an existing calibration
  const updateCalibration = useCallback(
    async (id: string, calibrationData: Partial<Calibration>) => {
      try {
        await calibrationDB.updateCalibration(id, calibrationData)
        await loadCalibrations()
        return true
      } catch (err) {
        console.error("Error updating calibration:", err)
        setError("Failed to update calibration")
        throw err
      }
    },
    [loadCalibrations],
  )

  // Delete a calibration
  const deleteCalibration = useCallback(
    async (id: string) => {
      try {
        await calibrationDB.deleteCalibration(id)
        await loadCalibrations()
        return true
      } catch (err) {
        console.error("Error deleting calibration:", err)
        setError("Failed to delete calibration")
        throw err
      }
    },
    [loadCalibrations],
  )

  // Get a single calibration by ID
  const getCalibrationById = useCallback(async (id: string): Promise<CalibrationWithNames | null> => {
    try {
      const calibration = await calibrationDB.getCalibrationById(id)

      if (!calibration) {
        return null
      }

      // Get related data
      const customer = await calibrationDB.getCustomerById(calibration.customerId)
      const equipment = await calibrationDB.getEquipmentById(calibration.equipmentId)
      const tool = await calibrationDB.getToolById(calibration.toolId)

      return {
        ...calibration,
        customerName: customer ? customer.name : "Unknown Customer",
        equipmentName: equipment ? equipment.name : "Unknown Equipment",
        toolName: tool ? tool.name : "Unknown Tool",
      }
    } catch (err) {
      console.error("Error getting calibration:", err)
      setError("Failed to get calibration")
      throw err
    }
  }, [])

  // Load calibrations on mount and when options change
  useEffect(() => {
    loadCalibrations()
  }, [loadCalibrations])

  return {
    calibrations,
    loading,
    error,
    loadCalibrations,
    createCalibration,
    updateCalibration,
    deleteCalibration,
    getCalibrationById,
  }
}
