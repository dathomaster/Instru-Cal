"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Edit } from "lucide-react"
import { calibrationDB, type Calibration, type Equipment, type Customer } from "@/lib/db"

// Add print styles
const printStyles = `
  @media print {
    @page {
      margin: 0.5in;
      size: letter;
    }
    
    body {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
    .print\\:break-inside-avoid {
      break-inside: avoid;
    }
    
    .print\\:break-after-page {
      break-after: page;
    }
  }
`

// Add the styles to the document head
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = printStyles
  document.head.appendChild(styleSheet)
}

export default function CalibrationDetailPage() {
  const params = useParams()
  const calibrationId = params.id as string

  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalibrationData()
  }, [calibrationId])

  // Auto-print if print parameter is present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("print") === "true" && !loading && calibration) {
      // Small delay to ensure the page is fully rendered
      setTimeout(() => {
        window.print()
        // Remove the print parameter from URL after printing
        const newUrl = window.location.pathname
        window.history.replaceState({}, "", newUrl)
      }, 500)
    }
  }, [loading, calibration])

  const loadCalibrationData = async () => {
    try {
      // Ensure database is properly initialized
      await calibrationDB.init()

      // Add a small delay to ensure any recent writes are available
      await new Promise((resolve) => setTimeout(resolve, 100))

      const allCalibrations = await calibrationDB.getAllCalibrations()
      console.log("Looking for calibration ID:", calibrationId)
      console.log(
        "Available calibrations:",
        allCalibrations.map((c) => c.id),
      )

      const foundCalibration = allCalibrations.find((cal) => cal.id === calibrationId)

      if (foundCalibration) {
        setCalibration(foundCalibration)
        const allEquipment = await calibrationDB.getAllEquipment()
        const foundEquipment = allEquipment.find((eq) => eq.id === foundCalibration.equipmentId)
        setEquipment(foundEquipment || null)
        const customers = await calibrationDB.getCustomers()
        const foundCustomer = customers.find((c) => c.id === foundCalibration.customerId)
        setCustomer(foundCustomer || null)
      } else {
        console.error("Calibration not found with ID:", calibrationId)
      }
    } catch (error) {
      console.error("Error loading calibration:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    // Ensure all images and content are loaded before printing
    setTimeout(() => {
      window.print()
    }, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calibration report...</p>
        </div>
      </div>
    )
  }

  if (!calibration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Calibration Report Not Found</h2>
          <p className="text-gray-600 mb-4">The calibration report with ID "{calibrationId}" could not be found.</p>
          <Link href="/calibrations">
            <Button>Back to Calibrations</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Screen Header - Hidden when printing */}
      <header className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/calibrations">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Calibration Certificate</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/calibrations/${calibrationId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Certificate
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Professional Certificate Layout */}
      <main className="max-w-4xl mx-auto p-8 bg-white print:p-0 print:max-w-none">
        <div className="print:min-h-screen">
          {/* Certificate Header */}
          <div className="border-4 border-black p-4 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-center mb-2">CERTIFICATE OF CALIBRATION</h1>
                <p className="text-center text-lg mb-1">
                  {calibration.type === "load_cell"
                    ? "Force Verification utilizing ASTM E74-18"
                    : "Speed & Displacement Verification utilizing ASTM E2309"}
                </p>
                <p className="text-center text-lg">Issued By: Your Calibration Company</p>
              </div>
              <div className="ml-4">
                {/* Accreditation Badge Placeholder */}
                <div className="w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center text-xs text-center">
                  ACCREDITED
                  <br />
                  CERT #1377.01
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-4 pt-4 border-t-2 border-black">
              <div>
                <strong>DATE OF CALIBRATION:</strong> {new Date(calibration.date).toLocaleDateString()}
              </div>
              <div>
                <strong>CERTIFICATE NUMBER:</strong> {calibration.id}
              </div>
              <div>
                <strong>DATE OF ISSUE:</strong> {new Date(calibration.date).toLocaleDateString()}
              </div>
              <div className="text-right">
                <div className="border border-black p-2 inline-block">
                  <div className="text-sm">Page 1 of 1</div>
                  <div className="text-sm mt-1">Recommended Due Date:</div>
                  <div className="font-bold">
                    {new Date(new Date(calibration.date).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                  <div
                    className={`text-lg font-bold mt-2 ${calibration.result === "pass" ? "text-green-600" : "text-red-600"}`}
                  >
                    {calibration.result === "pass" ? "Pass" : "Fail"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <div className="text-4xl font-bold mb-2">YC</div>
              <div className="text-lg font-bold">Your Calibration Company</div>
              <div>123 Industrial Drive</div>
              <div>Your City, ST 12345</div>
              <div className="mt-4">
                <div>
                  <strong>Phone:</strong> (555) 123-4567
                </div>
                <div>
                  <strong>Fax:</strong> (555) 123-4568
                </div>
                <div>
                  <strong>Email:</strong> calibration@yourcompany.com
                </div>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Verified By:</strong>
                </div>
                <div>{calibration.technician}</div>
                <div>
                  <strong>Verifier Title:</strong>
                </div>
                <div>Calibration Technician</div>
              </div>
            </div>
          </div>

          {/* Customer and Equipment Information */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="space-y-2 text-sm">
              <div>
                <strong>Customer:</strong> {customer?.name || "N/A"}
              </div>
              <div>
                <strong>Location Of Calibration Address:</strong> {customer?.location || "N/A"}
              </div>
              <div>
                <strong>City:</strong> {customer?.location?.split(",")[0] || "N/A"}
              </div>
              <div>
                <strong>State:</strong> {customer?.location?.split(",")[1]?.trim() || "N/A"}
              </div>
              <div>
                <strong>Zip Code:</strong> N/A
              </div>
              <div>
                <strong>Specific Location of Calibration:</strong> Test Lab
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <strong>Date of Calibration:</strong> {new Date(calibration.date).toLocaleDateString()}
              </div>
              <div>
                <strong>Machine Make / Model:</strong> {equipment?.name || "N/A"}
              </div>
              <div>
                <strong>Machine SN:</strong> {equipment?.serialNumber || "N/A"}
              </div>
              <div>
                <strong>Indicating Device:</strong> Digital Display
              </div>
              <div>
                <strong>Indicating Device SN:</strong> N/A
              </div>
              {calibration.type === "load_cell" && (
                <>
                  <div>
                    <strong>Load Cell Model:</strong> {equipment?.name || "N/A"}
                  </div>
                  <div>
                    <strong>Load Cell SN:</strong> {equipment?.serialNumber || "N/A"}
                  </div>
                  <div>
                    <strong>Fullscale Capacity:</strong> {calibration.data?.capacity || "N/A"} (Lbs)
                  </div>
                  <div>
                    <strong>Verified Capacity:</strong> {calibration.data?.capacity || "N/A"} (Lbs)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="space-y-2 text-sm">
              <div>
                <strong>Contact Name:</strong> {customer?.contact || "N/A"}
              </div>
              <div>
                <strong>Phone:</strong> {customer?.phone || "N/A"}
              </div>
              <div>
                <strong>Email:</strong> {customer?.email || "N/A"}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <strong>Ambient Temp:</strong> Before: {calibration.temperature}°F After: {calibration.temperature}°F
              </div>
              <div>
                <strong>Gravity Multiplier:</strong> 1.0000
              </div>
              <div>
                <strong>Equipment Condition:</strong> Good
              </div>
            </div>
          </div>

          {/* Calibration Data */}
          <div className="mb-6">
            {calibration.type === "load_cell" ? (
              <ProfessionalLoadCellResults data={calibration.data} />
            ) : (
              <ProfessionalSpeedDisplacementResults data={calibration.data} />
            )}
          </div>

          {/* Standards Used */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2 text-center">STANDARDS / EQUIPMENT USED FOR CALIBRATION</h3>
            <div className="text-xs border border-black p-2">
              <p>Devices listed are traceable to NIST</p>
              <p className="mt-2">
                {calibration.type === "load_cell"
                  ? "Load cells calibrated by certified laboratory with 10,000 Lbs capacity, traceable to NIST standards."
                  : "Speed and displacement measuring devices calibrated by certified laboratory, traceable to NIST standards."}
              </p>
            </div>
          </div>

          {/* Certification Statement */}
          <div className="mb-6 text-xs">
            <p>
              This certifies that the testing system described above has had a{" "}
              {calibration.type === "load_cell" ? "force" : "speed and displacement"} verification performed in
              accordance with the latest specifications of ASTM {calibration.type === "load_cell" ? "E74-18" : "E2309"},
              "Standard Practices for{" "}
              {calibration.type === "load_cell"
                ? "Force Calibration and Verification of Testing Machines"
                : "Speed and Displacement Calibration"}
              " employing standard procedures.
            </p>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-3 gap-8 mt-8 pt-4 border-t-2 border-black">
            <div>
              <div className="text-sm font-bold mb-2">Authorized and Verified By:</div>
              <div className="text-lg font-bold">{calibration.technician}</div>
              <div className="mt-4 border-b border-black w-48"></div>
              <div className="text-xs mt-1">Signature</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold mb-2">Issue Date:</div>
              <div className="text-lg">{new Date(calibration.date).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm">Certificate Valid Until:</div>
              <div className="font-bold">
                {new Date(new Date(calibration.date).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Screen Actions - Hidden when printing */}
      <div className="max-w-4xl mx-auto px-8 pb-8 print:hidden">
        <div className="flex gap-4">
          <Link href="/calibrations" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Calibrations
            </Button>
          </Link>
          <Link href={`/calibrations/${calibrationId}/edit`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              Edit Calibration
            </Button>
          </Link>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Certificate
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProfessionalLoadCellResults({ data }: { data: any }) {
  if (!data || !data.points) {
    return <p className="text-gray-500">No calibration data available</p>
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-center">CALIBRATION DATA</h3>

      <div className="mb-4 text-sm">
        <div>
          <strong>Required Tolerance:</strong> ±{data.tolerance}%
        </div>
        <div>
          <strong>Method:</strong> FIT or STF
        </div>
        <div>
          <strong>Values taken with tester:</strong> As Found As Left
        </div>
      </div>

      <table className="w-full border-collapse border border-black text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left">Applied Load (Lbs)</th>
            <th className="border border-black p-2 text-left">Indicated Reading</th>
            <th className="border border-black p-2 text-left">Unit Error</th>
            <th className="border border-black p-2 text-left">% Error</th>
            <th className="border border-black p-2 text-left">% Error + Uncertainty</th>
          </tr>
        </thead>
        <tbody>
          {data.points.map((point: any, index: number) => (
            <tr key={index}>
              <td className="border border-black p-2 font-medium">{point.applied}</td>
              <td className="border border-black p-2">{point.reading}</td>
              <td className="border border-black p-2">{(point.reading - point.applied).toFixed(3)}</td>
              <td className="border border-black p-2">
                <span className={point.withinTolerance ? "text-green-600" : "text-red-600"}>
                  {point.error.toFixed(3)}%
                </span>
              </td>
              <td className="border border-black p-2">{(Math.abs(point.error) + 0.25).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-xs">
        <p>
          <strong>Notes:</strong> Unless otherwise indicated, Run1 is as found and Run 2 is as left. Calibration Value
          set as none. 0-1,000 lbs, 0 to 50,000 , 10.0, 9.5, 10.1 EXC for optimal performance
        </p>
      </div>
    </div>
  )
}

function ProfessionalSpeedDisplacementResults({ data }: { data: any }) {
  if (!data || (!data.speedPoints && !data.displacementPoints)) {
    return <p className="text-gray-500">No calibration data available</p>
  }

  return (
    <div className="space-y-6">
      {data.speedPoints && (
        <div>
          <h3 className="text-lg font-bold mb-4 text-center">SPEED CALIBRATION DATA</h3>

          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left">Set Speed (in/min)</th>
                <th className="border border-black p-2 text-left">Actual Speed (in/min)</th>
                <th className="border border-black p-2 text-left">Unit Error</th>
                <th className="border border-black p-2 text-left">% Error</th>
                <th className="border border-black p-2 text-left">% Error + Uncertainty</th>
              </tr>
            </thead>
            <tbody>
              {data.speedPoints.map((point: any, index: number) => (
                <tr key={index}>
                  <td className="border border-black p-2 font-medium">{point.setSpeed}</td>
                  <td className="border border-black p-2">{point.actualSpeed}</td>
                  <td className="border border-black p-2">{(point.actualSpeed - point.setSpeed).toFixed(3)}</td>
                  <td className="border border-black p-2">
                    <span className={point.withinTolerance ? "text-green-600" : "text-red-600"}>
                      {point.error.toFixed(2)}%
                    </span>
                  </td>
                  <td className="border border-black p-2">{(Math.abs(point.error) + 0.25).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.displacementPoints && (
        <div>
          <h3 className="text-lg font-bold mb-4 text-center">DISPLACEMENT CALIBRATION DATA</h3>

          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left">Set Displacement (in)</th>
                <th className="border border-black p-2 text-left">Actual Displacement (in)</th>
                <th className="border border-black p-2 text-left">Unit Error</th>
                <th className="border border-black p-2 text-left">% Error</th>
                <th className="border border-black p-2 text-left">% Error + Uncertainty</th>
              </tr>
            </thead>
            <tbody>
              {data.displacementPoints.map((point: any, index: number) => (
                <tr key={index}>
                  <td className="border border-black p-2 font-medium">{point.setDisplacement}</td>
                  <td className="border border-black p-2">{point.actualDisplacement}</td>
                  <td className="border border-black p-2">
                    {(point.actualDisplacement - point.setDisplacement).toFixed(4)}
                  </td>
                  <td className="border border-black p-2">
                    <span className={point.withinTolerance ? "text-green-600" : "text-red-600"}>
                      {point.error.toFixed(3)}%
                    </span>
                  </td>
                  <td className="border border-black p-2">{(Math.abs(point.error) + 0.25).toFixed(3)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
