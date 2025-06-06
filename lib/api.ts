import { supabase } from "./supabase"

export interface Calibration {
  id: string
  customer_id: string
  equipment_id: string
  tool_id: string
  calibration_type: "load_cell" | "speed_displacement"
  status: "pending" | "in_progress" | "completed" | "failed"
  scheduled_date: string
  completed_date?: string
  technician: string
  location: string
  notes?: string
  results?: any
  certificate_url?: string
  created_at: string
  updated_at: string
  customer?: {
    id: string
    name: string
    email: string
    phone: string
  }
  equipment?: {
    id: string
    name: string
    model: string
    serial_number: string
  }
  tool?: {
    id: string
    name: string
    model: string
    serial_number: string
  }
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  contacts: Array<{
    name: string
    title: string
    phone: string
    email: string
    is_primary: boolean
  }>
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  customer_id: string
  name: string
  model: string
  serial_number: string
  manufacturer: string
  type: string
  location: string
  last_calibration?: string
  next_calibration?: string
  status: "active" | "inactive" | "maintenance"
  created_at: string
  updated_at: string
}

export interface Tool {
  id: string
  name: string
  model: string
  serial_number: string
  manufacturer: string
  type: string
  calibration_date: string
  expiration_date: string
  status: "active" | "expired" | "maintenance"
  accuracy: string
  range: string
  created_at: string
  updated_at: string
}

// Calibrations API
export async function getCalibrations(): Promise<Calibration[]> {
  try {
    const { data, error } = await supabase
      .from("calibrations")
      .select(`
        *,
        customer:customers(*),
        equipment:equipment(*),
        tool:tools(*)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching calibrations:", error)
    return []
  }
}

export async function getCalibration(id: string): Promise<Calibration | null> {
  try {
    const { data, error } = await supabase
      .from("calibrations")
      .select(`
        *,
        customer:customers(*),
        equipment:equipment(*),
        tool:tools(*)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching calibration:", error)
    return null
  }
}

export async function createCalibration(calibration: Partial<Calibration>): Promise<Calibration | null> {
  try {
    const { data, error } = await supabase.from("calibrations").insert([calibration]).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating calibration:", error)
    return null
  }
}

export async function updateCalibration(id: string, updates: Partial<Calibration>): Promise<Calibration | null> {
  try {
    const { data, error } = await supabase.from("calibrations").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating calibration:", error)
    return null
  }
}

export async function deleteCalibration(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("calibrations").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting calibration:", error)
    return false
  }
}

// Customers API
export async function getCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching customers:", error)
    return []
  }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  try {
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching customer:", error)
    return null
  }
}

export async function createCustomer(customer: Partial<Customer>): Promise<Customer | null> {
  try {
    const { data, error } = await supabase.from("customers").insert([customer]).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating customer:", error)
    return null
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  try {
    const { data, error } = await supabase.from("customers").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating customer:", error)
    return null
  }
}

// Equipment API
export async function getEquipment(): Promise<Equipment[]> {
  try {
    const { data, error } = await supabase.from("equipment").select("*").order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return []
  }
}

export async function getEquipmentItem(id: string): Promise<Equipment | null> {
  try {
    const { data, error } = await supabase.from("equipment").select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return null
  }
}

export async function createEquipment(equipment: Partial<Equipment>): Promise<Equipment | null> {
  try {
    const { data, error } = await supabase.from("equipment").insert([equipment]).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating equipment:", error)
    return null
  }
}

// Tools API
export async function getTools(): Promise<Tool[]> {
  try {
    const { data, error } = await supabase.from("tools").select("*").order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching tools:", error)
    return []
  }
}

export async function getTool(id: string): Promise<Tool | null> {
  try {
    const { data, error } = await supabase.from("tools").select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching tool:", error)
    return null
  }
}

export async function createTool(tool: Partial<Tool>): Promise<Tool | null> {
  try {
    const { data, error } = await supabase.from("tools").insert([tool]).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating tool:", error)
    return null
  }
}

export async function updateTool(id: string, updates: Partial<Tool>): Promise<Tool | null> {
  try {
    const { data, error } = await supabase.from("tools").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating tool:", error)
    return null
  }
}

// Utility functions
export async function getUpcomingCalibrations(): Promise<Calibration[]> {
  try {
    const { data, error } = await supabase
      .from("calibrations")
      .select(`
        *,
        customer:customers(*),
        equipment:equipment(*),
        tool:tools(*)
      `)
      .eq("status", "pending")
      .gte("scheduled_date", new Date().toISOString())
      .order("scheduled_date", { ascending: true })
      .limit(10)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching upcoming calibrations:", error)
    return []
  }
}

export async function getCalibrationStats() {
  try {
    const { data: total, error: totalError } = await supabase.from("calibrations").select("id", { count: "exact" })

    const { data: completed, error: completedError } = await supabase
      .from("calibrations")
      .select("id", { count: "exact" })
      .eq("status", "completed")

    const { data: pending, error: pendingError } = await supabase
      .from("calibrations")
      .select("id", { count: "exact" })
      .eq("status", "pending")

    if (totalError || completedError || pendingError) {
      throw new Error("Error fetching stats")
    }

    return {
      total: total?.length || 0,
      completed: completed?.length || 0,
      pending: pending?.length || 0,
      inProgress: (total?.length || 0) - (completed?.length || 0) - (pending?.length || 0),
    }
  } catch (error) {
    console.error("Error fetching calibration stats:", error)
    return {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
    }
  }
}
