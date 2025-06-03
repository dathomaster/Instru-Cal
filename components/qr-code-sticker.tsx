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

  useEffect(() => {
    setIsClient(true)
    // Dynamically import QR code component only on client side with correct named export
    import("qrcode.react")
      .then((module) => {
        // Use the correct named export QRCodeSVG
        setQRCodeComponent(() => module.QRCodeSVG)
      })
      .catch((error) => {
        console.error("Failed to load QR code component:", error)
      })
  }, [])

  useEffect(() => {
    // Create URL for public certificate view
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const publicUrl = `${baseUrl}/public/calibration/${calibrationId}`
    setQrCodeValue(publicUrl)

    // Store comprehensive calibration data in localStorage for public access
    if (typeof window !== "undefined") {
      console.log("🏷️ Generating QR code for calibration:", calibrationId)
      console.log("📊 Full calibration data available:", !!calibrationData)

      const publicCalibrationData = {
        id: calibrationId,
        technician,
        date,
        equipmentName,
        calibrationType,
        timestamp: new Date().toISOString(),
        // Include full calibration data if available
        fullData: calibrationData || null,
        // Create a comprehensive calibration object
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

      try {
        // Store in localStorage for backup access
        localStorage.setItem(`public_calibration_${calibrationId}`, JSON.stringify(publicCalibrationData))
        console.log("✅ Comprehensive calibration data cached for public access:", calibrationId)
        console.log("📊 Cached data keys:", Object.keys(publicCalibrationData))

        // Also store a simple mapping for ID lookup
        const existingMappings = JSON.parse(localStorage.getItem("calibration_id_mappings") || "{}")
        existingMappings[calibrationId] = {
          shortId: calibrationId.substring(0, 8),
          fullId: calibrationId,
          equipmentName,
          date,
          technician,
        }
        localStorage.setItem("calibration_id_mappings", JSON.stringify(existingMappings))
        console.log("🗂️ Updated calibration ID mappings")
      } catch (error) {
        console.error("Failed to cache calibration data:", error)
      }
    }
  }, [calibrationId, technician, date, equipmentName, calibrationType, calibrationData])

  if (!isClient) {
    return (
      <div className="border-2 border-black p-2 w-48">
        <h3 className="text-sm font-bold text-center mb-2">Calibration Sticker</h3>
        <div className="flex items-center justify-center mb-2">
          <div className="w-32 h-32 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
            Loading QR Code...
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
