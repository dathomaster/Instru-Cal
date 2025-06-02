"use client"

import { useEffect, useState } from "react"

interface QRCodeStickerProps {
  calibrationId: string
  technician: string
  date: string
  equipmentName: string
  calibrationType: string
}

export function QRCodeSticker({ calibrationId, technician, date, equipmentName, calibrationType }: QRCodeStickerProps) {
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
  }, [calibrationId])

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
