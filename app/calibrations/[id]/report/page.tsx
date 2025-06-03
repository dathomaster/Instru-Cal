"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import QRCode from "qrcode.react"

// Define types
interface Calibration {
  id: string
  date: string
  technician: string
  type: string
  equipmentId: string
  customerId: string
  results: any[] // Replace 'any' with a more specific type if possible
  [key: string]: any // Allow for other properties
}

interface Equipment {
  id: string
  name: string
  [key: string]: any
}

interface Customer {
  id: string
  name: string
  [key: string]: any
}

interface QRCodeStickerProps {
  calibrationId: string
  technician: string
  date: string
  equipmentName: string
  calibrationType: string
  calibrationData: any
}

// QRCodeSticker Component
const QRCodeSticker: React.FC<QRCodeStickerProps> = ({
  calibrationId,
  technician,
  date,
  equipmentName,
  calibrationType,
  calibrationData,
}) => {
  const qrCodeValue = JSON.stringify(calibrationData)

  return (
    <div style={{ border: "1px solid black", padding: "5px", width: "200px" }}>
      <p>Calibration ID: {calibrationId}</p>
      <p>Equipment: {equipmentName}</p>
      <p>Date: {date}</p>
      <QRCode value={qrCodeValue} size={128} level="H" />
    </div>
  )
}

const CalibrationReportPage = () => {
  const { id } = useParams()
  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch calibration data
        const calibrationResponse = await fetch(`/api/calibrations/${id}`)
        if (!calibrationResponse.ok) {
          throw new Error(`Failed to fetch calibration: ${calibrationResponse.status}`)
        }
        const calibrationData = await calibrationResponse.json()
        setCalibration(calibrationData)

        // Fetch equipment data
        const equipmentResponse = await fetch(`/api/equipments/${calibrationData.equipmentId}`)
        if (!equipmentResponse.ok) {
          throw new Error(`Failed to fetch equipment: ${equipmentResponse.status}`)
        }
        const equipmentData = await equipmentResponse.json()
        setEquipment(equipmentData)

        // Fetch customer data
        const customerResponse = await fetch(`/api/customers/${calibrationData.customerId}`)
        if (!customerResponse.ok) {
          throw new Error(`Failed to fetch customer: ${customerResponse.status}`)
        }
        const customerData = await customerResponse.json()
        setCustomer(customerData)

        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const generatePDF = () => {
    if (!calibration || !equipment || !customer) {
      console.error("Calibration, equipment, or customer data is missing.")
      return
    }

    const doc = new jsPDF()

    // Title
    doc.text("Calibration Report", 10, 10)

    // Calibration Details
    doc.text(`Calibration ID: ${calibration.id}`, 10, 20)
    doc.text(`Date: ${calibration.date}`, 10, 30)
    doc.text(`Technician: ${calibration.technician}`, 10, 40)
    doc.text(`Type: ${calibration.type}`, 10, 50)

    // Equipment Details
    doc.text(`Equipment Name: ${equipment.name}`, 10, 60)

    // Customer Details
    doc.text(`Customer Name: ${customer.name}`, 10, 70)

    // Results Table
    const resultsData = calibration.results.map((result: any) => [result.name, result.value, result.unit])

    autoTable(doc, {
      head: [["Name", "Value", "Unit"]],
      body: resultsData,
      startY: 80,
    })

    // Save the PDF
    doc.save(`calibration_report_${calibration.id}.pdf`)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h1>Calibration Report</h1>
      {calibration && equipment && customer && (
        <>
          <p>Calibration ID: {calibration.id}</p>
          <p>Date: {calibration.date}</p>
          <p>Technician: {calibration.technician}</p>
          <p>Type: {calibration.type}</p>
          <p>Equipment Name: {equipment.name}</p>
          <p>Customer Name: {customer.name}</p>
          <h2>Results:</h2>
          <ul>
            {calibration.results.map((result: any, index: number) => (
              <li key={index}>
                {result.name}: {result.value} {result.unit}
              </li>
            ))}
          </ul>
        </>
      )}
      <button onClick={generatePDF}>Generate PDF</button>

      {calibration && equipment && customer && (
        <QRCodeSticker
          calibrationId={calibration.id}
          technician={calibration.technician}
          date={calibration.date}
          equipmentName={equipment.name}
          calibrationType={calibration.type}
          calibrationData={{
            ...calibration,
            equipment: equipment,
            customer: customer,
          }}
        />
      )}
    </div>
  )
}

export default CalibrationReportPage
