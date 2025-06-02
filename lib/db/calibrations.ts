// lib/db/calibrations.ts - Calibration database operations
import { calibrationDB as db } from "../db"
import type { Calibration } from "../db"

// Re-export the calibrationDB instance
export const calibrationDB = db

// Export specific calibration methods for easier imports
export const addCalibration = (calibration: Omit<Calibration, "id" | "createdAt" | "updatedAt">) =>
  db.addCalibration(calibration)

export const updateCalibration = (calibration: Calibration) => db.updateCalibration(calibration)

export const deleteCalibration = (id: string) => db.deleteCalibration(id)

export const getAllCalibrations = () => db.getAllCalibrations()

export const getCalibrationById = (id: string) => db.getCalibrationById(id)

export const getCalibrationsByCustomer = (customerId: string) => db.getCalibrationsByCustomer(customerId)

export const getCalibrationsByEquipment = (equipmentId: string) => db.getCalibrationsByEquipment(equipmentId)

export const getUnsyncedCalibrations = () => db.getUnsyncedCalibrations()

export const markCalibrationSynced = (id: string) => db.markCalibrationSynced(id)

// Export types
export type { Calibration }
