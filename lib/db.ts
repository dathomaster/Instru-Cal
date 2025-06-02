// lib/db.ts - Enhanced offline-first database

// IndexedDB utilities for offline storage
let syncManager: any = null

// Lazy load sync manager to avoid circular dependencies
const getSyncManager = () => {
  if (!syncManager && typeof window !== "undefined") {
    try {
      syncManager = require("./sync").syncManager
    } catch (e) {
      console.warn("Sync manager not available, running in offline-only mode")
    }
  }
  return syncManager
}

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
  private version = 2
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null
  private isInitialized = false

  async init(): Promise<void> {
    // Return immediately if already initialized
    if (this.isInitialized && this.db) {
      return Promise.resolve()
    }

    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          throw new Error("IndexedDB not supported")
        }

        const request = indexedDB.open(this.dbName, this.version)

        request.onerror = () => {
          console.error("IndexedDB error:", request.error)
          reject(new Error(`IndexedDB failed to open: ${request.error?.message}`))
        }

        request.onsuccess = () => {
          this.db = request.result
          this.isInitialized = true
          console.log("✅ IndexedDB initialized successfully")
          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          console.log("🔄 Upgrading IndexedDB schema...")

          // Create customers store
          if (!db.objectStoreNames.contains("customers")) {
            const customerStore = db.createObjectStore("customers", { keyPath: "id" })
            customerStore.createIndex("name", "name", { unique: false })
            console.log("Created customers store")
          }

          // Create equipment store
          if (!db.objectStoreNames.contains("equipment")) {
            const equipmentStore = db.createObjectStore("equipment", { keyPath: "id" })
            equipmentStore.createIndex("customerId", "customerId", { unique: false })
            equipmentStore.createIndex("type", "type", { unique: false })
            console.log("Created equipment store")
          }

          // Create calibration tools store
          if (!db.objectStoreNames.contains("tools")) {
            const toolsStore = db.createObjectStore("tools", { keyPath: "id" })
            toolsStore.createIndex("type", "type", { unique: false })
            toolsStore.createIndex("status", "status", { unique: false })
            toolsStore.createIndex("nextCalibrationDate", "nextCalibrationDate", { unique: false })
            console.log("Created tools store")
          }

          // Create calibrations store
          if (!db.objectStoreNames.contains("calibrations")) {
            const calibrationStore = db.createObjectStore("calibrations", { keyPath: "id" })
            calibrationStore.createIndex("customerId", "customerId", { unique: false })
            calibrationStore.createIndex("equipmentId", "equipmentId", { unique: false })
            calibrationStore.createIndex("type", "type", { unique: false })
            calibrationStore.createIndex("date", "date", { unique: false })
            console.log("Created calibrations store")
          }
        }
      } catch (error) {
        console.error("Failed to initialize IndexedDB:", error)
        reject(error)
      }
    })

    return this.initPromise
  }

  private addToSyncQueue(type: string, id: string, operation: string) {
    try {
      const manager = getSyncManager()
      if (manager) {
        manager.addToSyncQueue(type, id, operation)
      } else {
        console.log(`📝 Queued for sync when online: ${operation} ${type} ${id}`)
      }
    } catch (error) {
      console.warn("Could not add to sync queue:", error)
    }
  }

  // Tool management methods
  async addTool(tool: Omit<CalibrationTool, "id" | "createdAt" | "updatedAt">): Promise<CalibrationTool> {
    await this.init()

    const newTool: CalibrationTool = {
      ...tool,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    try {
      await this.saveToStore("tools", newTool)
      console.log("✅ Tool saved to IndexedDB:", newTool.id)
      this.addToSyncQueue("tool", newTool.id, "create")
      return newTool
    } catch (error) {
      console.error("❌ Failed to save tool:", error)
      throw new Error(`Failed to save tool: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getTools(): Promise<CalibrationTool[]> {
    await this.init()
    try {
      return await this.getAllFromStore("tools")
    } catch (error) {
      console.error("❌ Failed to get tools:", error)
      return []
    }
  }

  async getToolsByType(type: string): Promise<CalibrationTool[]> {
    await this.init()
    try {
      return await this.getFromStoreByIndex("tools", "type", type)
    } catch (error) {
      console.error("❌ Failed to get tools by type:", error)
      return []
    }
  }

  async updateTool(id: string, updates: Partial<CalibrationTool>): Promise<CalibrationTool> {
    await this.init()

    const existing = await this.getToolById(id)
    if (!existing) throw new Error("Tool not found")

    const updated: CalibrationTool = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    try {
      await this.saveToStore("tools", updated)
      this.addToSyncQueue("tool", id, "update")
      return updated
    } catch (error) {
      console.error("❌ Failed to update tool:", error)
      throw new Error(`Failed to update tool: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getToolById(id: string): Promise<CalibrationTool | null> {
    await this.init()
    try {
      return await this.getFromStore("tools", id)
    } catch (error) {
      console.error("❌ Failed to get tool by ID:", error)
      return null
    }
  }

  // Customer operations
  async addCustomer(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    await this.init()

    const newCustomer: Customer = {
      ...customer,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    try {
      await this.saveToStore("customers", newCustomer)
      console.log("✅ Customer saved to IndexedDB:", newCustomer.id)
      this.addToSyncQueue("customer", newCustomer.id, "create")
      return newCustomer
    } catch (error) {
      console.error("❌ Failed to save customer:", error)
      throw new Error(`Failed to save customer: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async updateCustomer(customer: Customer): Promise<void> {
    await this.init()

    const updated: Customer = {
      ...customer,
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    try {
      await this.saveToStore("customers", updated)
      this.addToSyncQueue("customer", customer.id, "update")
    } catch (error) {
      console.error("❌ Failed to update customer:", error)
      throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.init()
    try {
      await this.deleteFromStore("customers", id)
      this.addToSyncQueue("customer", id, "delete")
    } catch (error) {
      console.error("❌ Failed to delete customer:", error)
      throw new Error(`Failed to delete customer: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getCustomers(): Promise<Customer[]> {
    await this.init()
    try {
      return await this.getAllFromStore("customers")
    } catch (error) {
      console.error("❌ Failed to get customers:", error)
      return []
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    await this.init()
    try {
      return await this.getFromStore("customers", id)
    } catch (error) {
      console.error("❌ Failed to get customer by ID:", error)
      return null
    }
  }

  // Equipment operations
  async addEquipment(equipment: Omit<Equipment, "id" | "createdAt" | "updatedAt">): Promise<Equipment> {
    await this.init()

    const newEquipment: Equipment = {
      ...equipment,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    try {
      await this.saveToStore("equipment", newEquipment)
      console.log("✅ Equipment saved to IndexedDB:", newEquipment.id)
      this.addToSyncQueue("equipment", newEquipment.id, "create")
      return newEquipment
    } catch (error) {
      console.error("❌ Failed to save equipment:", error)
      throw new Error(`Failed to save equipment: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async updateEquipment(equipment: Equipment): Promise<void> {
    await this.init()

    const updated: Equipment = {
      ...equipment,
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    try {
      await this.saveToStore("equipment", updated)
      this.addToSyncQueue("equipment", equipment.id, "update")
    } catch (error) {
      console.error("❌ Failed to update equipment:", error)
      throw new Error(`Failed to update equipment: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async deleteEquipment(id: string): Promise<void> {
    await this.init()
    try {
      await this.deleteFromStore("equipment", id)
      this.addToSyncQueue("equipment", id, "delete")
    } catch (error) {
      console.error("❌ Failed to delete equipment:", error)
      throw new Error(`Failed to delete equipment: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getAllEquipment(): Promise<Equipment[]> {
    await this.init()
    try {
      return await this.getAllFromStore("equipment")
    } catch (error) {
      console.error("❌ Failed to get equipment:", error)
      return []
    }
  }

  async getEquipmentById(id: string): Promise<Equipment | null> {
    await this.init()
    try {
      return await this.getFromStore("equipment", id)
    } catch (error) {
      console.error("❌ Failed to get equipment by ID:", error)
      return null
    }
  }

  async getEquipmentByCustomer(customerId: string): Promise<Equipment[]> {
    await this.init()
    try {
      return await this.getFromStoreByIndex("equipment", "customerId", customerId)
    } catch (error) {
      console.error("❌ Failed to get equipment by customer:", error)
      return []
    }
  }

  // Calibration operations
  async addCalibration(calibration: Omit<Calibration, "id" | "createdAt" | "updatedAt">): Promise<Calibration> {
    await this.init()

    const newCalibration: Calibration = {
      ...calibration,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    try {
      await this.saveToStore("calibrations", newCalibration)
      console.log("✅ Calibration saved to IndexedDB:", newCalibration.id)
      this.addToSyncQueue("calibration", newCalibration.id, "create")
      return newCalibration
    } catch (error) {
      console.error("❌ Failed to save calibration:", error)
      throw new Error(`Failed to save calibration: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async updateCalibration(calibration: Calibration): Promise<void> {
    await this.init()

    const updated: Calibration = {
      ...calibration,
      updatedAt: new Date().toISOString(),
      synced: false,
    }

    try {
      await this.saveToStore("calibrations", updated)
      console.log("✅ Calibration updated in IndexedDB:", calibration.id)
      this.addToSyncQueue("calibration", calibration.id, "update")
    } catch (error) {
      console.error("❌ Failed to update calibration:", error)
      throw new Error(`Failed to update calibration: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async deleteCalibration(id: string): Promise<void> {
    await this.init()

    try {
      await this.deleteFromStore("calibrations", id)
      console.log("✅ Calibration deleted from IndexedDB:", id)
      this.addToSyncQueue("calibration", id, "delete")
    } catch (error) {
      console.error("❌ Failed to delete calibration:", error)
      throw new Error(`Failed to delete calibration: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getAllCalibrations(): Promise<Calibration[]> {
    await this.init()
    try {
      return await this.getAllFromStore("calibrations")
    } catch (error) {
      console.error("❌ Failed to get calibrations:", error)
      return []
    }
  }

  async getCalibrationById(id: string): Promise<Calibration | null> {
    await this.init()
    try {
      return await this.getFromStore("calibrations", id)
    } catch (error) {
      console.error("❌ Failed to get calibration by ID:", error)
      return null
    }
  }

  async getCalibrationsByCustomer(customerId: string): Promise<Calibration[]> {
    await this.init()
    try {
      return await this.getFromStoreByIndex("calibrations", "customerId", customerId)
    } catch (error) {
      console.error("❌ Failed to get calibrations by customer:", error)
      return []
    }
  }

  async getCalibrationsByEquipment(equipmentId: string): Promise<Calibration[]> {
    await this.init()
    try {
      return await this.getFromStoreByIndex("calibrations", "equipmentId", equipmentId)
    } catch (error) {
      console.error("❌ Failed to get calibrations by equipment:", error)
      return []
    }
  }

  // Sync-related operations
  async getUnsyncedCalibrations(): Promise<Calibration[]> {
    await this.init()
    try {
      const allCalibrations = await this.getAllCalibrations()
      return allCalibrations.filter((cal) => !cal.synced)
    } catch (error) {
      console.error("❌ Failed to get unsynced calibrations:", error)
      return []
    }
  }

  async markCalibrationSynced(id: string): Promise<void> {
    await this.init()
    try {
      const calibration = await this.getCalibrationById(id)
      if (calibration) {
        calibration.synced = true
        await this.saveToStore("calibrations", calibration)
      }
    } catch (error) {
      console.error("❌ Failed to mark calibration as synced:", error)
    }
  }

  // Get upcoming calibrations (equipment and tools)
  async getUpcomingCalibrations(): Promise<{
    equipment: Array<{ equipment: Equipment; customer: Customer; daysUntilDue: number }>
    tools: Array<{ tool: CalibrationTool; daysUntilDue: number }>
  }> {
    await this.init()

    try {
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
    } catch (error) {
      console.error("❌ Failed to get upcoming calibrations:", error)
      return { equipment: [], tools: [] }
    }
  }

  // Generic store operations with enhanced error handling
  private async saveToStore<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      try {
        const transaction = this.db.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.put(data)

        request.onerror = () => {
          const error = request.error || new Error("Unknown IndexedDB error")
          console.error(`Failed to save to ${storeName}:`, error)
          reject(error)
        }

        request.onsuccess = () => resolve()

        transaction.onerror = () => {
          const error = transaction.error || new Error("Transaction failed")
          console.error(`Transaction failed for ${storeName}:`, error)
          reject(error)
        }

        transaction.onabort = () => {
          const error = new Error("Transaction aborted")
          console.error(`Transaction aborted for ${storeName}`)
          reject(error)
        }
      } catch (error) {
        console.error(`Exception in saveToStore for ${storeName}:`, error)
        reject(error)
      }
    })
  }

  private async getFromStore<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      try {
        const transaction = this.db.transaction([storeName], "readonly")
        const store = transaction.objectStore(storeName)
        const request = store.get(id)

        request.onerror = () => {
          const error = request.error || new Error("Unknown IndexedDB error")
          console.error(`Failed to get from ${storeName}:`, error)
          reject(error)
        }

        request.onsuccess = () => resolve(request.result || null)
      } catch (error) {
        console.error(`Exception in getFromStore for ${storeName}:`, error)
        reject(error)
      }
    })
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      try {
        const transaction = this.db.transaction([storeName], "readonly")
        const store = transaction.objectStore(storeName)
        const request = store.getAll()

        request.onerror = () => {
          const error = request.error || new Error("Unknown IndexedDB error")
          console.error(`Failed to get all from ${storeName}:`, error)
          reject(error)
        }

        request.onsuccess = () => resolve(request.result || [])
      } catch (error) {
        console.error(`Exception in getAllFromStore for ${storeName}:`, error)
        reject(error)
      }
    })
  }

  private async getFromStoreByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      try {
        const transaction = this.db.transaction([storeName], "readonly")
        const store = transaction.objectStore(storeName)
        const index = store.index(indexName)
        const request = index.getAll(value)

        request.onerror = () => {
          const error = request.error || new Error("Unknown IndexedDB error")
          console.error(`Failed to get from ${storeName} by index ${indexName}:`, error)
          reject(error)
        }

        request.onsuccess = () => resolve(request.result || [])
      } catch (error) {
        console.error(`Exception in getFromStoreByIndex for ${storeName}:`, error)
        reject(error)
      }
    })
  }

  private async deleteFromStore(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      try {
        const transaction = this.db.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.delete(id)

        request.onerror = () => {
          const error = request.error || new Error("Unknown IndexedDB error")
          console.error(`Failed to delete from ${storeName}:`, error)
          reject(error)
        }

        request.onsuccess = () => resolve()
      } catch (error) {
        console.error(`Exception in deleteFromStore for ${storeName}:`, error)
        reject(error)
      }
    })
  }

  getMonthlyCalibrationCount(): number {
    // This would be implemented to get actual monthly stats
    // For now, we'll return a placeholder
    return 23
  }

  async initializeSampleData(): Promise<void> {
    try {
      await this.init()

      const customers = await this.getCustomers()
      const equipment = await this.getAllEquipment()
      const calibrations = await this.getAllCalibrations()
      const tools = await this.getTools()

      console.log("🔄 Initializing sample data...")
      console.log(
        `Found: ${customers.length} customers, ${equipment.length} equipment, ${calibrations.length} calibrations, ${tools.length} tools`,
      )

      // Add sample tools if none exist
      if (tools.length === 0) {
        console.log("📝 Adding sample tools...")
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
        console.log("✅ Sample tools added")
      }

      // Add sample customers if none exist
      if (customers.length === 0) {
        console.log("📝 Adding sample customers...")
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
        console.log("✅ Sample customers added")
      }

      // Add sample equipment if none exist
      if (equipment.length === 0) {
        console.log("📝 Adding sample equipment...")
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
          console.log("✅ Sample equipment added")
        }
      }

      // Add sample calibrations if none exist
      if (calibrations.length === 0) {
        console.log("📝 Adding sample calibrations...")
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
                reportNumber: "CAL-2024-001",
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
                reportNumber: "CAL-2024-002",
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
          console.log("✅ Sample calibrations added")
        }
      }

      console.log("✅ Sample data initialization complete")
    } catch (error) {
      console.error("❌ Error initializing sample data:", error)
    }
  }
}

export const calibrationDB = new CalibrationDB()

// Initialize the database when the module loads
if (typeof window !== "undefined") {
  calibrationDB
    .init()
    .then(() => {
      console.log("🚀 Database initialized, loading sample data...")
      return calibrationDB.initializeSampleData()
    })
    .then(() => {
      console.log("🎉 App ready for offline use!")
    })
    .catch((error) => {
      console.error("💥 Failed to initialize app:", error)
    })
}

// Add this line to export calibrationDB as db as well
export const db = calibrationDB
