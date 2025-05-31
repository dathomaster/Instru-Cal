// IndexedDB utilities for offline storage
import { syncManager } from "./sync" // Import syncManager
// Generate UUID function for browser compatibility
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface Customer {
  id: string
  name: string
  location: string
  contact: string
  email: string
  phone: string
  notes: string
  createdAt: string
  updatedAt: string
  synced?: boolean
}

export interface Equipment {
  id: string
  name: string
  type: "load_cell" | "speed_displacement"
  serialNumber: string
  customerId: string
  specifications: {
    capacity?: string
    accuracy?: string
    range?: string
    units?: string
  }
  createdAt: string
  updatedAt: string
  synced?: boolean
}

export interface CalibrationTool {
  id: string
  name: string
  type: string
  serialNumber: string
  manufacturer: string
  model: string
  accuracy: string
  range: string
  lastCalibrationDate: string
  nextCalibrationDate: string
  certificateNumber: string
  status: "active" | "inactive" | "needs_calibration"
  notes: string
  createdAt: string
  updatedAt: string
  synced?: boolean
}

export interface Calibration {
  id: string
  customerId: string
  equipmentId: string
  type: "load_cell" | "speed_displacement"
  technician: string
  date: string
  temperature: string
  humidity: string
  toolsUsed: string[] // Array of tool IDs
  data: any
  result: "pass" | "fail"
  createdAt: string
  updatedAt: string
  synced?: boolean
}

class CalibrationDB {
  private dbName = "CalibrationApp"
  private version = 2 // Incremented for new tools store
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create customers store
        if (!db.objectStoreNames.contains("customers")) {
          const customerStore = db.createObjectStore("customers", { keyPath: "id" })
          customerStore.createIndex("name", "name", { unique: false })
        }

        // Create equipment store
        if (!db.objectStoreNames.contains("equipment")) {
          const equipmentStore = db.createObjectStore("equipment", { keyPath: "id" })
          equipmentStore.createIndex("customerId", "customerId", { unique: false })
          equipmentStore.createIndex("type", "type", { unique: false })
        }

        // Create calibration tools store
        if (!db.objectStoreNames.contains("tools")) {
          const toolsStore = db.createObjectStore("tools", { keyPath: "id" })
          toolsStore.createIndex("type", "type", { unique: false })
          toolsStore.createIndex("status", "status", { unique: false })
          toolsStore.createIndex("nextCalibrationDate", "nextCalibrationDate", { unique: false })
        }

        // Create calibrations store
        if (!db.objectStoreNames.contains("calibrations")) {
          const calibrationStore = db.createObjectStore("calibrations", { keyPath: "id" })
          calibrationStore.createIndex("customerId", "customerId", { unique: false })
          calibrationStore.createIndex("equipmentId", "equipmentId", { unique: false })
          calibrationStore.createIndex("type", "type", { unique: false })
          calibrationStore.createIndex("date", "date", { unique: false })
        }
      }
    })
  }

  // Tool management methods
  async addTool(tool: Omit<CalibrationTool, "id" | "createdAt" | "updatedAt">): Promise<CalibrationTool> {
    const newTool: CalibrationTool = {
      ...tool,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    await this.saveToStore("tools", newTool)

    // Add to sync queue
    syncManager.addToSyncQueue("tool", newTool.id, "create")

    return newTool
  }

  async getTools(): Promise<CalibrationTool[]> {
    return this.getAllFromStore("tools")
  }

  async getToolsByType(type: string): Promise<CalibrationTool[]> {
    return this.getFromStoreByIndex("tools", "type", type)
  }

  async updateTool(id: string, updates: Partial<CalibrationTool>): Promise<CalibrationTool> {
    const existing = await this.getToolById(id)
    if (!existing) throw new Error("Tool not found")

    const updated: CalibrationTool = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    await this.saveToStore("tools", updated)

    // Add to sync queue
    syncManager.addToSyncQueue("tool", id, "update")

    return updated
  }

  async getToolById(id: string): Promise<CalibrationTool | null> {
    return this.getFromStore("tools", id)
  }

  // Get upcoming calibrations (equipment and tools)
  async getUpcomingCalibrations(): Promise<{
    equipment: Array<{ equipment: Equipment; customer: Customer; daysUntilDue: number }>
    tools: Array<{ tool: CalibrationTool; daysUntilDue: number }>
  }> {
    const allEquipment = await this.getAllEquipment()
    const allCalibrations = await this.getAllCalibrations()
    const allTools = await this.getTools()
    const allCustomers = await this.getCustomers()

    const now = new Date()
    const upcomingEquipment: Array<{ equipment: Equipment; customer: Customer; daysUntilDue: number }> = []
    const upcomingTools: Array<{ tool: CalibrationTool; daysUntilDue: number }> = []

    // Find equipment that needs calibration
    for (const equipment of allEquipment) {
      const equipmentCalibrations = allCalibrations.filter((cal) => cal.equipmentId === equipment.id)
      const customer = allCustomers.find((c) => c.id === equipment.customerId)

      if (!customer) continue

      if (equipmentCalibrations.length === 0) {
        upcomingEquipment.push({ equipment, customer, daysUntilDue: -999 }) // Never calibrated
        continue
      }

      const lastCalibration = equipmentCalibrations.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0]

      const lastDate = new Date(lastCalibration.date)
      const nextDate = new Date(lastDate)
      nextDate.setFullYear(nextDate.getFullYear() + 1)

      const daysUntilDue = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilDue <= 90) {
        upcomingEquipment.push({ equipment, customer, daysUntilDue })
      }
    }

    // Find tools that need calibration
    for (const tool of allTools) {
      if (!tool.nextCalibrationDate) continue

      const nextDate = new Date(tool.nextCalibrationDate)
      const daysUntilDue = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilDue <= 90) {
        upcomingTools.push({ tool, daysUntilDue })
      }
    }

    return {
      equipment: upcomingEquipment.sort((a, b) => a.daysUntilDue - b.daysUntilDue),
      tools: upcomingTools.sort((a, b) => a.daysUntilDue - b.daysUntilDue),
    }
  }

  // Customer operations
  async addCustomer(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    await this.saveToStore("customers", newCustomer)

    // Add to sync queue
    syncManager.addToSyncQueue("customer", newCustomer.id, "create")

    return newCustomer
  }

  async updateCustomer(customer: Customer): Promise<void> {
    const updated: Customer = {
      ...customer,
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    await this.saveToStore("customers", updated)

    // Add to sync queue
    syncManager.addToSyncQueue("customer", customer.id, "update")
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.deleteFromStore("customers", id)

    // Add to sync queue
    syncManager.addToSyncQueue("customer", id, "delete")
  }

  async getCustomers(): Promise<Customer[]> {
    return this.getAllFromStore("customers")
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.getFromStore("customers", id)
  }

  // Equipment operations
  async addEquipment(equipment: Omit<Equipment, "id" | "createdAt" | "updatedAt">): Promise<Equipment> {
    const newEquipment: Equipment = {
      ...equipment,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    await this.saveToStore("equipment", newEquipment)

    // Add to sync queue
    syncManager.addToSyncQueue("equipment", newEquipment.id, "create")

    return newEquipment
  }

  async updateEquipment(equipment: Equipment): Promise<void> {
    const updated: Equipment = {
      ...equipment,
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    await this.saveToStore("equipment", updated)

    // Add to sync queue
    syncManager.addToSyncQueue("equipment", equipment.id, "update")
  }

  async deleteEquipment(id: string): Promise<void> {
    await this.deleteFromStore("equipment", id)

    // Add to sync queue
    syncManager.addToSyncQueue("equipment", id, "delete")
  }

  async getAllEquipment(): Promise<Equipment[]> {
    return this.getAllFromStore("equipment")
  }

  async getEquipmentById(id: string): Promise<Equipment | null> {
    return this.getFromStore("equipment", id)
  }

  async getEquipmentByCustomer(customerId: string): Promise<Equipment[]> {
    return this.getFromStoreByIndex("equipment", "customerId", customerId)
  }

  // Calibration operations
  async addCalibration(calibration: Omit<Calibration, "id" | "createdAt" | "updatedAt">): Promise<Calibration> {
    const newCalibration: Calibration = {
      ...calibration,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    await this.saveToStore("calibrations", newCalibration)

    // Add to sync queue
    syncManager.addToSyncQueue("calibration", newCalibration.id, "create")

    return newCalibration
  }

  async updateCalibration(calibration: Calibration): Promise<void> {
    const updated: Calibration = {
      ...calibration,
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    await this.saveToStore("calibrations", updated)

    // Add to sync queue
    syncManager.addToSyncQueue("calibration", calibration.id, "update")
  }

  async deleteCalibration(id: string): Promise<void> {
    await this.deleteFromStore("calibrations", id)

    // Add to sync queue
    syncManager.addToSyncQueue("calibration", id, "delete")
  }

  async getAllCalibrations(): Promise<Calibration[]> {
    return this.getAllFromStore("calibrations")
  }

  async getCalibrationById(id: string): Promise<Calibration | null> {
    return this.getFromStore("calibrations", id)
  }

  async getCalibrationsByCustomer(customerId: string): Promise<Calibration[]> {
    return this.getFromStoreByIndex("calibrations", "customerId", customerId)
  }

  async getCalibrationsByEquipment(equipmentId: string): Promise<Calibration[]> {
    return this.getFromStoreByIndex("calibrations", "equipmentId", equipmentId)
  }

  // Sync-related operations
  async getUnsyncedCalibrations(): Promise<Calibration[]> {
    const allCalibrations = await this.getAllCalibrations()
    return allCalibrations.filter((cal) => !cal.synced)
  }

  async markCalibrationSynced(id: string): Promise<void> {
    const calibration = await this.getCalibrationById(id)
    if (calibration) {
      calibration.synced = true
      await this.saveToStore("calibrations", calibration)
    }
  }

  // Generic store operations
  private async saveToStore<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async getFromStore<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = this.db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = this.db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  private async getFromStoreByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = this.db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  private async deleteFromStore(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  getMonthlyCalibrationCount(): number {
    // This would be implemented to get actual monthly stats
    // For now, we'll return a placeholder
    return 23
  }

  async initializeSampleData(): Promise<void> {
    try {
      const customers = await this.getCustomers()
      const equipment = await this.getAllEquipment()
      const calibrations = await this.getAllCalibrations()
      const tools = await this.getTools()

      // Add sample tools if none exist
      if (tools.length === 0) {
        const sampleTools = [
          {
            name: "Precision Load Cell Tester",
            type: "load_tool",
            serialNumber: "PLT-2023-001",
            manufacturer: "Calibration Systems Inc",
            model: "CSI-5000",
            accuracy: "±0.05%",
            range: "0-5000 lbs",
            lastCalibrationDate: "2024-01-15",
            nextCalibrationDate: "2025-01-15",
            certificateNumber: "CSI-CERT-2024-001",
            status: "active" as const,
            notes: "Primary load testing equipment",
          },
          {
            name: "Digital Force Gauge",
            type: "load_tool",
            serialNumber: "DFG-2023-002",
            manufacturer: "Force Dynamics",
            model: "FD-1000",
            accuracy: "±0.1%",
            range: "0-1000 lbs",
            lastCalibrationDate: "2024-02-01",
            nextCalibrationDate: "2025-02-01",
            certificateNumber: "FD-CERT-2024-002",
            status: "active" as const,
            notes: "Portable force measurement",
          },
          {
            name: "Linear Displacement Sensor",
            type: "displacement_tool",
            serialNumber: "LDS-2023-003",
            manufacturer: "Precision Instruments",
            model: "PI-LVDT-500",
            accuracy: "±0.01%",
            range: "0-500 inches",
            lastCalibrationDate: "2024-01-20",
            nextCalibrationDate: "2025-01-20",
            certificateNumber: "PI-CERT-2024-003",
            status: "active" as const,
            notes: "High precision displacement measurement",
          },
          {
            name: "Speed Measurement System",
            type: "displacement_tool",
            serialNumber: "SMS-2023-004",
            manufacturer: "Velocity Systems",
            model: "VS-SpeedPro",
            accuracy: "±0.5%",
            range: "0-200 in/min",
            lastCalibrationDate: "2023-12-01",
            nextCalibrationDate: "2024-12-01",
            certificateNumber: "VS-CERT-2023-004",
            status: "needs_calibration" as const,
            notes: "Speed and velocity calibration system",
          },
        ]

        for (const tool of sampleTools) {
          await this.addTool(tool)
        }
      }

      // Add sample customers if none exist
      if (customers.length === 0) {
        const sampleCustomers = [
          {
            name: "Acme Corporation",
            location: "123 Industrial Blvd, Detroit, MI 48201",
            contact: "John Smith",
            email: "john.smith@acme.com",
            phone: "(555) 123-4567",
            notes: "Primary contact for all calibrations. Prefers morning appointments.",
          },
          {
            name: "TechCorp Industries",
            location: "456 Tech Park Dr, Austin, TX 78701",
            contact: "Sarah Johnson",
            email: "sarah.j@techcorp.com",
            phone: "(555) 987-6543",
            notes: "High-precision requirements. Annual contract customer.",
          },
          {
            name: "Manufacturing Plus",
            location: "789 Factory Rd, Cleveland, OH 44101",
            contact: "Mike Wilson",
            email: "mike.w@mfgplus.com",
            phone: "(555) 456-7890",
            notes: "Large facility with multiple equipment types.",
          },
        ]

        for (const customer of sampleCustomers) {
          await this.addCustomer(customer)
        }
      }

      // Add sample equipment if none exist
      if (equipment.length === 0) {
        const allCustomers = await this.getCustomers()
        if (allCustomers.length > 0) {
          const sampleEquipment = [
            {
              name: "LC-500 Load Cell",
              type: "load_cell" as const,
              serialNumber: "LC500-2023-001",
              customerId: allCustomers[0].id,
              specifications: {
                capacity: "500 lbs",
                accuracy: "±0.1%",
                range: "0-500 lbs",
                units: "lbs",
              },
            },
            {
              name: "LC-1000 Load Cell",
              type: "load_cell" as const,
              serialNumber: "LC1000-2023-002",
              customerId: allCustomers[0].id,
              specifications: {
                capacity: "1000 lbs",
                accuracy: "±0.1%",
                range: "0-1000 lbs",
                units: "lbs",
              },
            },
            {
              name: "SD-200 Speed Tester",
              type: "speed_displacement" as const,
              serialNumber: "SD200-2023-003",
              customerId: allCustomers[1]?.id || allCustomers[0].id,
              specifications: {
                capacity: "200 in/min max speed",
                accuracy: "±2%",
                range: "0-200 in/min",
                units: "in/min",
              },
            },
            {
              name: "SD-500 Displacement",
              type: "speed_displacement" as const,
              serialNumber: "SD500-2023-004",
              customerId: allCustomers[1]?.id || allCustomers[0].id,
              specifications: {
                capacity: "500 inches",
                accuracy: "±1%",
                range: "0-500 inches",
                units: "inches",
              },
            },
          ]

          for (const eq of sampleEquipment) {
            await this.addEquipment(eq)
          }
        }
      }

      // Add sample calibrations if none exist
      if (calibrations.length === 0) {
        const allCustomers = await this.getCustomers()
        const allEquipment = await this.getAllEquipment()
        const allTools = await this.getTools()

        if (allCustomers.length > 0 && allEquipment.length > 0 && allTools.length > 0) {
          const sampleCalibrations = [
            {
              customerId: allCustomers[0].id,
              equipmentId: allEquipment[0].id,
              type: "load_cell" as const,
              technician: "John Doe",
              date: "2024-01-15",
              temperature: "72",
              humidity: "45",
              toolsUsed: [allTools[0].id],
              data: {
                tolerance: 0.1,
                capacity: 500,
                points: [
                  { applied: 0, reading: 0, error: 0, withinTolerance: true },
                  { applied: 100, reading: 100.05, error: 0.05, withinTolerance: true },
                  { applied: 250, reading: 249.8, error: -0.08, withinTolerance: true },
                  { applied: 500, reading: 500.2, error: 0.04, withinTolerance: true },
                ],
              },
              result: "pass" as const,
            },
            {
              customerId: allCustomers[1]?.id || allCustomers[0].id,
              equipmentId: allEquipment[2]?.id || allEquipment[0].id,
              type: "speed_displacement" as const,
              technician: "Jane Smith",
              date: "2024-01-14",
              temperature: "70",
              humidity: "50",
              toolsUsed: [allTools[2]?.id || allTools[0].id, allTools[3]?.id || allTools[1]?.id || allTools[0].id],
              data: {
                speedTolerance: 2.0,
                displacementTolerance: 1.0,
                speedPoints: [
                  { setSpeed: 0.1, actualSpeed: 0.102, error: 2.0, withinTolerance: true },
                  { setSpeed: 1.0, actualSpeed: 1.015, error: 1.5, withinTolerance: true },
                  { setSpeed: 5.0, actualSpeed: 5.08, error: 1.6, withinTolerance: true },
                ],
                displacementPoints: [
                  { setDisplacement: 1.0, actualDisplacement: 1.005, error: 0.5, withinTolerance: true },
                  { setDisplacement: 10.0, actualDisplacement: 10.08, error: 0.8, withinTolerance: true },
                ],
                speedResult: "pass",
                displacementResult: "pass",
              },
              result: "pass" as const,
            },
          ]

          for (const calibration of sampleCalibrations) {
            await this.addCalibration(calibration)
          }
        }
      }
    } catch (error) {
      console.error("Error initializing sample data:", error)
    }
  }
}

export const calibrationDB = new CalibrationDB()

// Initialize the database when the module loads
if (typeof window !== "undefined") {
  calibrationDB
    .init()
    .then(() => {
      calibrationDB.initializeSampleData()
    })
    .catch(console.error)
}
