// lib/db/equipment.ts - Equipment database operations
import { calibrationDB as db } from "../db"
import type { Equipment } from "../db"

// Re-export the calibrationDB instance
export const calibrationDB = db

// Export specific equipment methods for easier imports
export const addEquipment = (equipment: Omit<Equipment, "id" | "createdAt" | "updatedAt">) => db.addEquipment(equipment)

export const updateEquipment = (equipment: Equipment) => db.updateEquipment(equipment)

export const deleteEquipment = (id: string) => db.deleteEquipment(id)

export const getAllEquipment = () => db.getAllEquipment()

export const getEquipmentById = (id: string) => db.getEquipmentById(id)

export const getEquipmentByCustomer = (customerId: string) => db.getEquipmentByCustomer(customerId)

// Export types
export type { Equipment }
