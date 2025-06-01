// Background sync utilities for when the app comes online
import { calibrationDB, type Calibration } from "./db"
import { createClientSupabaseClient } from "./supabase"

class SyncManager {
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : false
  private syncInProgress = false
  private syncQueue: { type: string; id: string; operation: string }[] = []
  private lastSyncTime = 0
  private syncListeners: ((status: SyncStatus) => void)[] = []
  private serviceWorkerRegistered = false

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline.bind(this))
      window.addEventListener("offline", this.handleOffline.bind(this))

      // Register service worker
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          this.registerServiceWorker()
        })
      }

      // Try to load sync queue from localStorage
      try {
        const savedQueue = localStorage.getItem("syncQueue")
        if (savedQueue) {
          this.syncQueue = JSON.parse(savedQueue)
        }
      } catch (e) {
        console.error("Failed to load sync queue:", e)
      }
    }
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js")
      console.log("Service Worker registered with scope:", registration.scope)
      this.serviceWorkerRegistered = true

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_STARTED") {
          this.syncData()
        }
      })
    } catch (error) {
      console.error("Service Worker registration failed:", error)
    }
  }

  private handleOnline() {
    this.isOnline = true
    this.notifyListeners({ status: "online", pendingItems: this.syncQueue.length })
    this.syncData()
  }

  private handleOffline() {
    this.isOnline = false
    this.notifyListeners({ status: "offline", pendingItems: this.syncQueue.length })
  }

  // Add item to sync queue
  addToSyncQueue(type: string, id: string, operation: string) {
    this.syncQueue.push({ type, id, operation })
    this.saveSyncQueue()
    this.notifyListeners({
      status: this.isOnline ? "online" : "offline",
      pendingItems: this.syncQueue.length,
    })

    // Try to sync if we're online
    if (this.isOnline) {
      this.syncData()
    }

    // Only try to register for background sync if service worker is registered
    // and the browser supports background sync
    this.tryRegisterBackgroundSync()
  }

  private tryRegisterBackgroundSync() {
    if (
      this.serviceWorkerRegistered &&
      "serviceWorker" in navigator &&
      "SyncManager" in window &&
      navigator.serviceWorker.controller
    ) {
      navigator.serviceWorker.ready
        .then((registration) => {
          // Use a simple, short tag name
          return registration.sync
            .register("sync-data")
            .then(() => console.log("Background sync registered successfully"))
            .catch((err) => console.error("Background sync registration failed:", err))
        })
        .catch((err) => console.error("Service worker not ready:", err))
    } else {
      console.log("Background sync not supported or service worker not registered yet")
    }
  }

  private saveSyncQueue() {
    try {
      localStorage.setItem("syncQueue", JSON.stringify(this.syncQueue))
    } catch (e) {
      console.error("Failed to save sync queue:", e)
    }
  }

  async syncData() {
    if (!this.isOnline || this.syncInProgress) return

    const supabase = createClientSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("No session found, skipping sync")
      return
    }

    this.syncInProgress = true
    this.notifyListeners({ status: "syncing", pendingItems: this.syncQueue.length })

    try {
      // Get all unsynced calibrations
      const unsyncedCalibrations = await calibrationDB.getUnsyncedCalibrations()

      // Process sync queue first
      const queueCopy = [...this.syncQueue]
      for (const item of queueCopy) {
        try {
          switch (item.type) {
            case "calibration":
              await this.syncCalibrationItem(item.id, item.operation)
              break
            case "customer":
              await this.syncCustomerItem(item.id, item.operation)
              break
            case "equipment":
              await this.syncEquipmentItem(item.id, item.operation)
              break
            case "tool":
              await this.syncToolItem(item.id, item.operation)
              break
          }

          // Remove from queue if successful
          this.syncQueue = this.syncQueue.filter(
            (i) => !(i.type === item.type && i.id === item.id && i.operation === item.operation),
          )
          this.saveSyncQueue()
        } catch (error) {
          console.error(`Failed to sync ${item.type} ${item.id}:`, error)
        }
      }

      // Then process any remaining unsynced calibrations
      for (const calibration of unsyncedCalibrations) {
        try {
          await this.syncCalibration(calibration)
          await calibrationDB.markCalibrationSynced(calibration.id)
        } catch (error) {
          console.error("Failed to sync calibration:", calibration.id, error)
        }
      }

      // Update last sync time
      this.lastSyncTime = Date.now()
      localStorage.setItem("lastSyncTime", this.lastSyncTime.toString())

      this.notifyListeners({
        status: "synced",
        pendingItems: this.syncQueue.length,
        lastSyncTime: this.lastSyncTime,
      })
    } catch (error) {
      console.error("Sync failed:", error)
      this.notifyListeners({
        status: "error",
        pendingItems: this.syncQueue.length,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncCalibrationItem(id: string, operation: string) {
    const supabase = createClientSupabaseClient()

    // Check if we have a valid session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      console.log("No session found, skipping sync")
      return
    }

    if (operation === "delete") {
      await supabase.from("calibrations").delete().eq("id", id)
      return
    }

    const calibration = await calibrationDB.getCalibrationById(id)
    if (!calibration) return

    if (operation === "create" || operation === "update") {
      await supabase.from("calibrations").upsert({
        id: calibration.id,
        customer_id: calibration.customerId,
        equipment_id: calibration.equipmentId,
        type: calibration.type,
        technician: calibration.technician,
        date: calibration.date,
        temperature: calibration.temperature,
        humidity: calibration.humidity,
        tools_used: calibration.toolsUsed,
        data: calibration.data,
        result: calibration.result,
        created_at: calibration.createdAt,
        updated_at: calibration.updatedAt,
      })
    }
  }

  private async syncCustomerItem(id: string, operation: string) {
    const supabase = createClientSupabaseClient()

    // Check if we have a valid session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      console.log("No session found, skipping sync")
      return
    }

    if (operation === "delete") {
      await supabase.from("customers").delete().eq("id", id)
      return
    }

    const customer = await calibrationDB.getCustomerById(id)
    if (!customer) return

    if (operation === "create" || operation === "update") {
      await supabase.from("customers").upsert({
        id: customer.id,
        name: customer.name,
        location: customer.location,
        contact: customer.contact,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        created_at: customer.createdAt,
        updated_at: customer.updatedAt,
      })
    }
  }

  private async syncEquipmentItem(id: string, operation: string) {
    const supabase = createClientSupabaseClient()

    // Check if we have a valid session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      console.log("No session found, skipping sync")
      return
    }

    if (operation === "delete") {
      await supabase.from("equipment").delete().eq("id", id)
      return
    }

    const equipment = await calibrationDB.getEquipmentById(id)
    if (!equipment) return

    if (operation === "create" || operation === "update") {
      await supabase.from("equipment").upsert({
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        serial_number: equipment.serialNumber,
        customer_id: equipment.customerId,
        specifications: equipment.specifications,
        created_at: equipment.createdAt,
        updated_at: equipment.updatedAt,
      })
    }
  }

  private async syncToolItem(id: string, operation: string) {
    const supabase = createClientSupabaseClient()

    // Check if we have a valid session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      console.log("No session found, skipping sync")
      return
    }

    if (operation === "delete") {
      await supabase.from("tools").delete().eq("id", id)
      return
    }

    const tool = await calibrationDB.getToolById(id)
    if (!tool) return

    if (operation === "create" || operation === "update") {
      await supabase.from("tools").upsert({
        id: tool.id,
        name: tool.name,
        type: tool.type,
        serial_number: tool.serialNumber,
        manufacturer: tool.manufacturer,
        model: tool.model,
        accuracy: tool.accuracy,
        range: tool.range,
        last_calibration_date: tool.lastCalibrationDate,
        next_calibration_date: tool.nextCalibrationDate,
        certificate_number: tool.certificateNumber,
        status: tool.status,
        notes: tool.notes,
        created_at: tool.createdAt,
        updated_at: tool.updatedAt,
      })
    }
  }

  private async syncCalibration(calibration: Calibration) {
    const supabase = createClientSupabaseClient()

    // Check if calibration exists in Supabase
    const { data, error } = await supabase.from("calibrations").select("id").eq("id", calibration.id).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      throw error
    }

    // Insert or update based on existence
    const { error: upsertError } = await supabase.from("calibrations").upsert({
      id: calibration.id,
      customer_id: calibration.customerId,
      equipment_id: calibration.equipmentId,
      type: calibration.type,
      technician: calibration.technician,
      date: calibration.date,
      temperature: calibration.temperature,
      humidity: calibration.humidity,
      tools_used: calibration.toolsUsed,
      data: calibration.data,
      result: calibration.result,
      created_at: calibration.createdAt,
      updated_at: calibration.updatedAt,
    })

    if (upsertError) {
      throw upsertError
    }
  }

  getOnlineStatus() {
    return this.isOnline
  }

  getPendingSyncCount() {
    return this.syncQueue.length
  }

  getLastSyncTime() {
    return this.lastSyncTime || Number.parseInt(localStorage.getItem("lastSyncTime") || "0")
  }

  // Subscribe to sync status changes
  subscribe(callback: (status: SyncStatus) => void) {
    this.syncListeners.push(callback)
    // Immediately notify with current status
    callback({
      status: this.syncInProgress ? "syncing" : this.isOnline ? "online" : "offline",
      pendingItems: this.syncQueue.length,
      lastSyncTime: this.getLastSyncTime(),
    })

    // Return unsubscribe function
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback)
    }
  }

  private notifyListeners(status: SyncStatus) {
    this.syncListeners.forEach((callback) => callback(status))
  }

  // Force a sync
  forceSync() {
    if (this.isOnline && !this.syncInProgress) {
      return this.syncData()
    }
    return Promise.resolve()
  }
}

export type SyncStatus = {
  status: "online" | "offline" | "syncing" | "synced" | "error"
  pendingItems: number
  lastSyncTime?: number
  error?: string
}

export const syncManager = new SyncManager()
