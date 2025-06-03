import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    console.log("🔍 API: Looking for calibration ID:", id)

    // For now, return a not found response since this is primarily an offline app
    // The data should be available through IndexedDB or localStorage
    return NextResponse.json(
      {
        error: "Certificate data not available via API",
        message: "This is an offline-first application. Certificate data should be available through local storage.",
        id: id,
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("Server error fetching calibration:", error)
    return NextResponse.json({ error: "Failed to fetch calibration data" }, { status: 500 })
  }
}
