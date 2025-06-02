// lib/db/customers.ts - Customer database operations
import { calibrationDB as db } from "../db"
import type { Customer } from "../db"

// Re-export the calibrationDB instance
export const calibrationDB = db

// Export specific customer methods for easier imports
export const addCustomer = (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => db.addCustomer(customer)

export const updateCustomer = (customer: Customer) => db.updateCustomer(customer)

export const deleteCustomer = (id: string) => db.deleteCustomer(id)

export const getCustomers = () => db.getCustomers()

export const getCustomerById = (id: string) => db.getCustomerById(id)

// Export types
export type { Customer }
