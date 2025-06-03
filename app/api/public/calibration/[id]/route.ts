import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    // Create Supabase client with service role for admin access
    const supabase = createClient()

    // Fetch calibration data
    const { data: calibration, error: calibrationError } = await supabase
      .from("calibrations")
      .select("*")
      .eq("id", id)
      .single()

    if (calibrationError || !calibration) {
      console.error("Error fetching calibration:", calibrationError)
      return NextResponse.json({ error: "Calibration not found" }, { status: 404 })
    }

    // Fetch related equipment
    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .select("*")
      .eq("id", calibration.equipmentId)
      .single()

    // Fetch related customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", calibration.customerId)
      .single()

    return NextResponse.json({
      calibration,
      equipment: equipment || null,
      customer: customer || null,
    })
  } catch (error) {
    console.error("Server error fetching calibration:", error)
    return NextResponse.json({ error: "Failed to fetch calibration data" }, { status: 500 })
  }
}
