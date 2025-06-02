// lib/db/index.ts - Main database exports
export * from "./calibrations"
export * from "./customers"
export * from "./equipment"
export * from "./tools"

// Re-export main database instance and types
export { calibrationDB, db } from "../db"
export type { Customer, Equipment, CalibrationTool, Calibration } from "../db"
