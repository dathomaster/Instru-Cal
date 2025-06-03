"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, CalendarPlus, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { calibrationDB, type Calibration, type Equipment, type Customer } from "@/lib/db"

export default function PublicCalibrationPage() {
  const params = useParams()
  const calibrationId = params.id as string

  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMethod, setLoadingMethod] = useState<string>("checking")
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    loadCalibrationData()
  }, [calibrationId])

  const addDebugInfo = (info: string) => {
    console.log(info)
    setDebugInfo((prev) => [...prev, info])
  }

  const loadCalibrationData = async () => {
    try {
      setLoading(true)
      setError(null)
      setDebugInfo([])

      addDebugInfo(`🔍 Loading calibration for public view: ${calibrationId}`)

      // Try localStorage first since it's most reliable for this offline app
      if (await tryLoadFromLocalStorage()) {
        addDebugInfo("✅ Successfully loaded from localStorage")
        return
      }

      // Try IndexedDB with fuzzy matching
      if (await tryLoadFromIndexedDB()) {
        addDebugInfo("✅ Successfully loaded from IndexedDB")
        return
      }

      // Finally show error
      addDebugInfo("❌ Could not find calibration in any data source")
      setError(`Calibration certificate not found. ID: ${calibrationId}`)
    } catch (error) {
      const errorMsg = `Error loading calibration data: ${error instanceof Error ? error.message : "Unknown error"}`
      addDebugInfo(`❌ ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const tryLoadFromLocalStorage = async (): Promise<boolean> => {
    try {
      setLoadingMethod("localStorage")
      addDebugInfo("📂 Trying to load from localStorage...")

      if (typeof window === "undefined") {
        addDebugInfo("❌ Window not available (SSR)")
        return false
      }

      // First try exact match
      let cachedData = localStorage.getItem(`public_calibration_${calibrationId}`)

      if (!cachedData) {
        addDebugInfo("❌ No exact match found in localStorage")

        // Try to find by partial ID match
        const allKeys = Object.keys(localStorage).filter((key) => key.startsWith("public_calibration_"))
        addDebugInfo(`📋 Available localStorage keys: ${allKeys.join(", ") || "none"}`)

        // Check ID mappings
        const mappings = JSON.parse(localStorage.getItem("calibration_id_mappings") || "{}")
        addDebugInfo(`🗂️ Available ID mappings: ${Object.keys(mappings).join(", ") || "none"}`)

        // Try to find a match by short ID
        const shortId = calibrationId.substring(0, 8)
        for (const [fullId, mapping] of Object.entries(mappings)) {
          if (fullId.startsWith(shortId) || mapping.shortId === shortId) {
            addDebugInfo(`🎯 Found potential match: ${fullId}`)
            cachedData = localStorage.getItem(`public_calibration_${fullId}`)
            if (cachedData) {
              addDebugInfo(`✅ Found data for ${fullId}`)
              break
            }
          }
        }

        if (!cachedData) {
          return false
        }
      }

      const parsedData = JSON.parse(cachedData)
      addDebugInfo("📋 Found calibration in localStorage")
      addDebugInfo(`📊 Cached data structure: ${Object.keys(parsedData).join(", ")}`)

      // Use the comprehensive cached data
      if (parsedData.calibration) {
        setCalibration(parsedData.calibration)
        setEquipment(parsedData.equipment)
        setCustomer(parsedData.customer)
        addDebugInfo("✅ Using comprehensive cached data")
      } else {
        // Fallback to simple data structure
        const simplifiedCalibration = {
          id: parsedData.id,
          customerId: "cached",
          equipmentId: "cached",
          type: parsedData.calibrationType,
          technician: parsedData.technician,
          date: parsedData.date,
          temperature: "N/A",
          humidity: "N/A",
          toolsUsed: [],
          data: { reportNumber: parsedData.id.substring(0, 8) },
          result: "pass",
          createdAt: parsedData.timestamp,
          updatedAt: parsedData.timestamp,
        } as Calibration

        setCalibration(simplifiedCalibration)
        setEquipment({
          id: "cached",
          name: parsedData.equipmentName,
          type: parsedData.calibrationType as any,
          serialNumber: "N/A",
          customerId: "cached",
          specifications: {},
          createdAt: parsedData.timestamp,
          updatedAt: parsedData.timestamp,
        })
        setCustomer({
          id: "cached",
          name: "N/A",
          location: "N/A",
          contact: "N/A",
          email: "N/A",
          phone: "N/A",
          notes: "Limited data available from QR code scan",
          createdAt: parsedData.timestamp,
          updatedAt: parsedData.timestamp,
        })
        addDebugInfo("✅ Using simplified cached data")
      }

      return true
    } catch (error) {
      addDebugInfo(`❌ Error loading from localStorage: ${error}`)
      return false
    }
  }

  const tryLoadFromIndexedDB = async (): Promise<boolean> => {
    try {
      setLoadingMethod("IndexedDB")
      addDebugInfo("📂 Trying to load from IndexedDB...")

      await calibrationDB.init()
      addDebugInfo("✅ Database initialized for public access")

      // First try exact match
      let foundCalibration = await calibrationDB.getCalibrationById(calibrationId)
      addDebugInfo(`📋 Found calibration in IndexedDB (exact): ${foundCalibration ? "Yes" : "No"}`)

      if (!foundCalibration) {
        // Try fuzzy matching - look for calibrations with similar IDs
        const allCalibrations = await calibrationDB.getAllCalibrations()
        addDebugInfo(`📋 Available calibrations in IndexedDB: ${allCalibrations.length}`)

        const shortId = calibrationId.substring(0, 8)
        addDebugInfo(`🔍 Looking for calibrations matching short ID: ${shortId}`)

        allCalibrations.forEach((cal, index) => {
          const calShortId = cal.id.substring(0, 8)
          addDebugInfo(`  ${index + 1}. ID: ${calShortId}..., Type: ${cal.type}, Date: ${cal.date}`)

          // Try to find a match by short ID
          if (calShortId === shortId || cal.id === calibrationId) {
            foundCalibration = cal
            addDebugInfo(`🎯 Found potential match: ${cal.id}`)
          }
        })
      }

      if (foundCalibration) {
        addDebugInfo("📊 Calibration data from IndexedDB found")
        setCalibration(foundCalibration)

        const [allEquipment, allCustomers] = await Promise.all([
          calibrationDB.getAllEquipment(),
          calibrationDB.getCustomers(),
        ])

        const foundEquipment = allEquipment.find((eq) => eq.id === foundCalibration.equipmentId)
        const foundCustomer = allCustomers.find((c) => c.id === foundCalibration.customerId)

        setEquipment(foundEquipment || null)
        setCustomer(foundCustomer || null)

        addDebugInfo("✅ Public calibration data loaded successfully from IndexedDB")
        return true
      }

      return false
    } catch (error) {
      addDebugInfo(`❌ Error loading from IndexedDB: ${error}`)
      return false
    }
  }

  const addToCalendar = () => {
    if (!calibration) return

    const dueDate = new Date(new Date(calibration.date).getTime() + 365 * 24 * 60 * 60 * 1000)
    const title = `Calibration Due: ${equipment?.name || "Equipment"}`
    const description = `Calibration due for ${equipment?.name || "Equipment"} (S/N: ${equipment?.serialNumber || "N/A"})\n\nOriginal calibration performed by: ${calibration.technician}\nCertificate ID: ${calibration.id}\nCustomer: ${customer?.name || "N/A"}`

    const startDate = dueDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const endDate =
      new Date(dueDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title,
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}`

    window.open(calendarUrl, "_blank")
  }

  const downloadPDF = () => {
    if (!calibration) return

    // Open the print-friendly version in a new window
    const printUrl = `/calibrations/${calibrationId}/report?print=true`
    window.open(printUrl, "_blank")
  }

  const viewFullCertificate = () => {
    if (!calibration) return

    const certificateUrl = `/calibrations/${calibrationId}/report`
    window.open(certificateUrl, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calibration certificate...</p>
          <p className="mt-2 text-sm text-gray-500">Checking {loadingMethod}...</p>
        </div>
      </div>
    )
  }

  if (error || !calibration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Certificate Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || "The calibration certificate could not be found or may have been removed."}
            </p>
            <p className="text-sm text-gray-500 mb-4">Certificate ID: {calibrationId}</p>

            {/* Debug Information */}
            <details className="text-left mb-4">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                Show Debug Information
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-left max-h-40 overflow-y-auto">
                {debugInfo.map((info, index) => (
                  <div key={index} className="mb-1">
                    {info}
                  </div>
                ))}
              </div>
            </details>

            <Button onClick={loadCalibrationData} variant="outline" className="flex items-center gap-2 mx-auto">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dueDate = new Date(new Date(calibration.date).getTime() + 365 * 24 * 60 * 60 * 1000)
  const isExpired = new Date() > dueDate
  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Calibration Certificate</h1>
            <p className="text-gray-600 mt-2">Public View - Certificate Verification</p>
            <Badge variant="outline" className="mt-2">
              Loaded from {loadingMethod}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Certificate Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {calibration.result === "pass" ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                Certificate Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Certificate Number</span>
                    <p className="text-lg font-mono">
                      {calibration.data?.reportNumber || calibration.id.substring(0, 8)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Calibration Result</span>
                    <div className="mt-1">
                      <Badge className={calibration.result === "pass" ? "bg-green-600" : "bg-red-600"}>
                        {calibration.result === "pass" ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Calibration Date</span>
                    <p className="text-lg">{new Date(calibration.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Due Date</span>
                    <p className="text-lg">{dueDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <div className="mt-1">
                      <Badge
                        className={isExpired ? "bg-red-500" : daysUntilDue <= 30 ? "bg-yellow-500" : "bg-green-500"}
                      >
                        {isExpired ? "EXPIRED" : daysUntilDue <= 30 ? "DUE SOON" : "CURRENT"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Technician</span>
                    <p className="text-lg">{calibration.technician}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Equipment Name</span>
                    <p className="text-lg">{equipment?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Serial Number</span>
                    <p className="text-lg font-mono">{equipment?.serialNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Calibration Type</span>
                    <p className="text-lg capitalize">{calibration.type.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Customer</span>
                    <p className="text-lg">{customer?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location</span>
                    <p className="text-lg">{customer?.location || "N/A"}</p>
                  </div>
                  {calibration.type === "load_cell" && calibration.data?.capacity && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Capacity</span>
                      <p className="text-lg">{calibration.data.capacity} lbs</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Certificate Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={addToCalendar} className="w-full">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add Due Date to Calendar
                </Button>
                <Button onClick={downloadPDF} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={viewFullCertificate} variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Certificate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Calibration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700">
                  This certificate confirms that the{" "}
                  {calibration.type === "load_cell" ? "force measurement" : "speed and displacement"}
                  calibration was performed on <strong>{new Date(calibration.date).toLocaleDateString()}</strong> by
                  certified technician <strong>{calibration.technician}</strong> in accordance with ASTM{" "}
                  {calibration.type === "load_cell" ? "E74-18" : "E2309"} standards.
                </p>

                {calibration.result === "pass" ? (
                  <p className="text-green-700 font-medium">
                    ✓ The equipment passed all calibration requirements and is certified for use until{" "}
                    {dueDate.toLocaleDateString()}.
                  </p>
                ) : (
                  <p className="text-red-700 font-medium">
                    ✗ The equipment did not meet calibration requirements and requires adjustment or repair.
                  </p>
                )}

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Certificate Authenticity</h4>
                  <p className="text-sm text-blue-800">
                    This certificate can be verified by scanning the QR code or visiting this URL. For questions about
                    this calibration, please contact your calibration provider.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
