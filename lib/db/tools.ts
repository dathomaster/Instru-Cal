// lib/db/tools.ts - Tools database operations
import { calibrationDB as db } from "../db"
import type { CalibrationTool } from "../db"

// Re-export the calibrationDB instance
export const calibrationDB = db

// Export specific tool methods for easier imports
export const addTool = (tool: Omit<CalibrationTool, "id" | "createdAt" | "updatedAt">) => db.addTool(tool)

export const updateTool = (id: string, updates: Partial<CalibrationTool>) => db.updateTool(id, updates)

export const getTools = () => db.getTools()

export const getToolById = (id: string) => db.getToolById(id)

export const getToolsByType = (type: string) => db.getToolsByType(type)

// Export types
export type { CalibrationTool }
