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
    // Dynamically import QR code component only on client side
    import("qrcode.react").then((module) => {
      setQRCodeComponent(() => module.QRCodeSVG)
    })
  }, [])

  useEffect(() => {
    // Create URL for public certificate view
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const publicUrl = `${baseUrl}/public/calibration/${calibrationId}`
    setQrCodeValue(publicUrl)

    // Store comprehensive calibration data in localStorage for public access
    if (typeof window !== "undefined") {
      const publicCalibrationData = {
        id: calibrationId,
        technician,
        date,
        equipmentName,
        calibrationType,
        timestamp: new Date().toISOString(),
        // Include full calibration data if available
        fullData: calibrationData || null,
        // Create a simplified calibration object
        calibration: {
          id: calibrationId,
          customerId: "cached",
          equipmentId: "cached",
          type: calibrationType,
          technician: technician,
          date: date,
          temperature: calibrationData?.temperature || "N/A",
          humidity: calibrationData?.humidity || "N/A",
          toolsUsed: calibrationData?.toolsUsed || [],
          data: calibrationData?.data || { reportNumber: calibrationId.substring(0, 8) },
          result: calibrationData?.result || "pass",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        equipment: {
          id: "cached",
          name: equipmentName,
          type: calibrationType,
          serialNumber: calibrationData?.equipment?.serialNumber || "N/A",
          customerId: "cached",
          specifications: calibrationData?.equipment?.specifications || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        customer: {
          id: "cached",
          name: calibrationData?.customer?.name || "N/A",
          location: calibrationData?.customer?.location || "N/A",
          contact: calibrationData?.customer?.contact || "N/A",
          email: calibrationData?.customer?.email || "N/A",
          phone: calibrationData?.customer?.phone || "N/A",
          notes: "Data cached from QR code generation",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }

      try {
        // Store in localStorage for backup access
        localStorage.setItem(`public_calibration_${calibrationId}`, JSON.stringify(publicCalibrationData))
        console.log("✅ Comprehensive calibration data cached for public access:", calibrationId)
        console.log("📊 Cached data:", publicCalibrationData)
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
          <QRCodeComponent value={qrCodeValue} size={128} level="H" className="border border-gray-200" />
        ) : (
          <div className="w-32 h-32 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
            Loading QR Code...
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
