"use client"

import { useEffect, useState } from "react"

interface QRCodeStickerProps {
  calibrationId: string
  technician: string
  date: string
  equipmentName: string
  calibrationType: string
  calibrationData?: any
}

// Validation functions for robustness
const validateRequiredData = (data: {
  calibrationId: string
  technician: string
  date: string
  equipmentName: string
  calibrationType: string
}) => {
  const errors: string[] = []

  if (!data.calibrationId || data.calibrationId.length < 8) {
    errors.push("Invalid calibration ID")
  }
  if (!data.technician || data.technician.trim().length === 0) {
    errors.push("Technician name is required")
  }
  if (!data.date || isNaN(new Date(data.date).getTime())) {
    errors.push("Valid calibration date is required")
  }
  if (!data.equipmentName || data.equipmentName.trim().length === 0) {
    errors.push("Equipment name is required")
  }
  if (!data.calibrationType || !["load_cell", "speed_displacement"].includes(data.calibrationType)) {
    errors.push("Valid calibration type is required")
  }

  return errors
}

const sanitizeForUrl = (value: string, maxLength = 50): string => {
  if (!value) return "N/A"
  return value
    .trim()
    .substring(0, maxLength)
    .replace(/[^a-zA-Z0-9\s\-_.]/g, "") // Remove special characters that might break URLs
    .trim()
}

export function QRCodeSticker({
  calibrationId,
  technician,
  date,
  equipmentName,
  calibrationType,
  calibrationData,
}: QRCodeStickerProps) {
  const [qrCodeValue, setQrCodeValue] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    setIsClient(true)
    // Dynamically import QR code component with error handling
    import("qrcode.react")
      .then((module) => {
        // Use the correct named export QRCodeSVG
        setQRCodeComponent(() => module.QRCodeSVG)
        console.log("✅ QR Code component loaded successfully")
      })
      .catch((error) => {
        console.error("❌ Failed to load QR code component:", error)
        setError("Failed to load QR code generator")
      })
  }, [])

  useEffect(() => {
    generateQRCode()
  }, [calibrationId, technician, date, equipmentName, calibrationType, calibrationData])

  const generateQRCode = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      console.log("🏷️ Starting QR code generation for calibration:", calibrationId)

      // Validate required data first
      const validationErrors = validateRequiredData({
        calibrationId,
        technician,
        date,
        equipmentName,
        calibrationType,
      })

      if (validationErrors.length > 0) {
        const errorMsg = `QR Code generation failed: ${validationErrors.join(", ")}`
        console.error("❌", errorMsg)
        setError(errorMsg)
        return
      }

      // Create a data-rich URL for public certificate view with robust error handling
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

      if (!baseUrl) {
        console.warn("⚠️ Base URL not available, using relative path")
      }

      // Create a compact representation of essential data with sanitization
      const essentialData = {
        id: calibrationId.substring(0, 8), // Short ID for URL brevity
        t: sanitizeForUrl(technician, 20), // Technician (sanitized and shortened)
        d: date, // Calibration date
        e: sanitizeForUrl(equipmentName, 30), // Equipment name (sanitized and shortened)
        ty: calibrationType, // Calibration type
        r: calibrationData?.result || "pass", // Result (pass/fail)
      }

      console.log("📊 Essential data for QR code:", essentialData)

      // Encode the data as URL parameters with error handling
      const params = new URLSearchParams()
      try {
        Object.entries(essentialData).forEach(([key, value]) => {
          if (value && value.toString().trim()) {
            params.append(key, value.toString())
          }
        })
      } catch (paramError) {
        console.error("❌ Error encoding URL parameters:", paramError)
        setError("Failed to encode calibration data")
        return
      }

      // Create the public URL with embedded data
      const publicUrl = `${baseUrl}/public/calibration/${calibrationId}?${params.toString()}`

      // Validate URL length (QR codes have limits)
      if (publicUrl.length > 2000) {
        console.warn("⚠️ QR code URL is very long, may cause scanning issues:", publicUrl.length)
      }

      setQrCodeValue(publicUrl)
      console.log("✅ QR code URL generated:", publicUrl.substring(0, 100) + "...")

      // Store comprehensive calibration data in localStorage for enhanced experience
      await cacheCalibrationData()
    } catch (error) {
      const errorMsg = `QR code generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      console.error("❌", errorMsg)
      setError(errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  const cacheCalibrationData = async () => {
    if (typeof window === "undefined") return

    try {
      console.log("💾 Caching calibration data for enhanced experience...")

      const publicCalibrationData = {
        id: calibrationId,
        technician,
        date,
        equipmentName,
        calibrationType,
        timestamp: new Date().toISOString(),
        version: "1.0", // Version for future compatibility
        // Include full calibration data if available
        fullData: calibrationData || null,
        // Create a comprehensive calibration object with fallbacks
        calibration: calibrationData
          ? {
              id: calibrationId,
              customerId: calibrationData.customerId || "cached",
              equipmentId: calibrationData.equipmentId || "cached",
              type: calibrationType,
              technician: technician,
              date: date,
              temperature: calibrationData.temperature || "N/A",
              humidity: calibrationData.humidity || "N/A",
              toolsUsed: calibrationData.toolsUsed || [],
              data: calibrationData.data || { reportNumber: calibrationId.substring(0, 8) },
              result: calibrationData.result || "pass",
              createdAt: calibrationData.createdAt || new Date().toISOString(),
              updatedAt: calibrationData.updatedAt || new Date().toISOString(),
            }
          : {
              id: calibrationId,
              customerId: "cached",
              equipmentId: "cached",
              type: calibrationType,
              technician: technician,
              date: date,
              temperature: "N/A",
              humidity: "N/A",
              toolsUsed: [],
              data: { reportNumber: calibrationId.substring(0, 8) },
              result: "pass",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
        equipment: calibrationData?.equipment
          ? {
              id: calibrationData.equipment.id || "cached",
              name: calibrationData.equipment.name || equipmentName,
              type: calibrationType,
              serialNumber: calibrationData.equipment.serialNumber || "N/A",
              customerId: calibrationData.equipment.customerId || "cached",
              specifications: calibrationData.equipment.specifications || {},
              createdAt: calibrationData.equipment.createdAt || new Date().toISOString(),
              updatedAt: calibrationData.equipment.updatedAt || new Date().toISOString(),
            }
          : {
              id: "cached",
              name: equipmentName,
              type: calibrationType,
              serialNumber: "N/A",
              customerId: "cached",
              specifications: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
        customer: calibrationData?.customer
          ? {
              id: calibrationData.customer.id || "cached",
              name: calibrationData.customer.name || "N/A",
              location: calibrationData.customer.location || "N/A",
              contact: calibrationData.customer.contact || "N/A",
              email: calibrationData.customer.email || "N/A",
              phone: calibrationData.customer.phone || "N/A",
              notes: calibrationData.customer.notes || "Data cached from QR code generation",
              createdAt: calibrationData.customer.createdAt || new Date().toISOString(),
              updatedAt: calibrationData.customer.updatedAt || new Date().toISOString(),
            }
          : {
              id: "cached",
              name: "N/A",
              location: "N/A",
              contact: "N/A",
              email: "N/A",
              phone: "N/A",
              notes: "Data cached from QR code generation",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
      }

      // Store in localStorage with error handling
      try {
        const dataString = JSON.stringify(publicCalibrationData)
        localStorage.setItem(`public_calibration_${calibrationId}`, dataString)
        console.log("✅ Comprehensive calibration data cached successfully")
      } catch (storageError) {
        console.warn("⚠️ Failed to cache full data (storage full?):", storageError)
        // Try to store minimal data instead
        try {
          const minimalData = {
            id: calibrationId,
            technician,
            date,
            equipmentName,
            calibrationType,
            timestamp: new Date().toISOString(),
          }
          localStorage.setItem(`public_calibration_${calibrationId}`, JSON.stringify(minimalData))
          console.log("✅ Minimal calibration data cached as fallback")
        } catch (minimalError) {
          console.error("❌ Failed to cache even minimal data:", minimalError)
        }
      }

      // Update ID mappings with error handling
      try {
        const existingMappings = JSON.parse(localStorage.getItem("calibration_id_mappings") || "{}")
        existingMappings[calibrationId] = {
          shortId: calibrationId.substring(0, 8),
          fullId: calibrationId,
          equipmentName: equipmentName.substring(0, 30),
          date,
          technician: technician.substring(0, 20),
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem("calibration_id_mappings", JSON.stringify(existingMappings))
        console.log("✅ ID mappings updated successfully")
      } catch (mappingError) {
        console.warn("⚠️ Failed to update ID mappings:", mappingError)
      }
    } catch (error) {
      console.warn("⚠️ Non-critical error caching calibration data:", error)
      // Don't fail QR generation for caching errors
    }
  }

  // Error boundary component
  if (error) {
    return (
      <div className="border-2 border-red-300 bg-red-50 p-2 w-48">
        <h3 className="text-sm font-bold text-center mb-2 text-red-800">QR Code Error</h3>
        <div className="flex items-center justify-center mb-2">
          <div className="w-32 h-32 border border-red-200 flex items-center justify-center text-xs text-red-600 text-center p-2">
            {error}
          </div>
        </div>
        <div className="text-xs text-red-700">
          <div>
            <strong>ID:</strong> {calibrationId.substring(0, 8)}...
          </div>
          <div>
            <strong>Tech:</strong> {technician}
          </div>
          <div>
            <strong>Date:</strong> {date}
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (!isClient || isGenerating) {
    return (
      <div className="border-2 border-gray-300 p-2 w-48">
        <h3 className="text-sm font-bold text-center mb-2">Calibration Sticker</h3>
        <div className="flex items-center justify-center mb-2">
          <div className="w-32 h-32 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
            {isGenerating ? "Generating QR Code..." : "Loading QR Code..."}
          </div>
        </div>
        <div className="text-xs">
          <div>
            <strong>ID:</strong> {calibrationId.substring(0, 8)}...
          </div>
          <div>
            <strong>Tech:</strong> {technician}
          </div>
          <div>
            <strong>Date:</strong> {date}
          </div>
          <div>
            <strong>Equip:</strong> {equipmentName}
          </div>
          <div>
            <strong>Type:</strong> {calibrationType}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-black p-2 w-48">
      <h3 className="text-sm font-bold text-center mb-2">Calibration Sticker</h3>
      <div className="flex items-center justify-center mb-2">
        {qrCodeValue && QRCodeComponent ? (
          <QRCodeComponent
            value={qrCodeValue}
            size={128}
            level="H"
            className="border border-gray-200"
            includeMargin={true}
          />
        ) : (
          <div className="w-32 h-32 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
            {QRCodeComponent ? "Generating QR Code..." : "Loading QR Code..."}
          </div>
        )}
      </div>
      <div className="text-xs">
        <div>
          <strong>ID:</strong> {calibrationId.substring(0, 8)}...
        </div>
        <div>
          <strong>Tech:</strong> {technician}
        </div>
        <div>
          <strong>Date:</strong> {date}
        </div>
        <div>
          <strong>Equip:</strong> {equipmentName}
        </div>
        <div>
          <strong>Type:</strong> {calibrationType}
        </div>
      </div>
    </div>
  )
}
