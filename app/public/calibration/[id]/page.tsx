"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, CalendarPlus, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react"
import { calibrationDB, type Calibration, type Equipment, type Customer } from "@/lib/db"

// Robust URL parameter parsing with validation
const parseUrlParams = (searchParams: URLSearchParams) => {
  try {
    const params = {
      technician: searchParams.get("t") || "",
      date: searchParams.get("d") || "",
      equipmentName: searchParams.get("e") || "",
      calibrationType: searchParams.get("ty") || "",
      result: searchParams.get("r") || "pass",
    }

    // Validate essential parameters
    const hasRequiredParams = params.technician && params.date && params.equipmentName && params.calibrationType

    return {
      ...params,
      isValid: hasRequiredParams,
      isEmpty: !Object.values(params).some((v) => v && v.trim()),
    }
  } catch (error) {
    console.error("❌ Error parsing URL parameters:", error)
    return {
      technician: "",
      date: "",
      equipmentName: "",
      calibrationType: "",
      result: "pass",
      isValid: false,
      isEmpty: true,
    }
  }
}

// Robust date validation
const validateDate = (dateString: string): boolean => {
  if (!dateString) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100
}

// Safe localStorage access with error handling
const safeLocalStorageGet = (key: string): string | null => {
  try {
    if (typeof window === "undefined") return null
    return localStorage.getItem(key)
  } catch (error) {
    console.warn("⚠️ localStorage access failed:", error)
    return null
  }
}

const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    if (typeof window === "undefined") return false
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn("⚠️ localStorage write failed:", error)
    return false
  }
}

export default function PublicCalibrationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const calibrationId = params.id as string

  // Parse URL parameters with validation
  const urlParams = parseUrlParams(searchParams)

  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMethod, setLoadingMethod] = useState<string>("checking")
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    loadCalibrationData()
  }, [calibrationId])

  const addDebugInfo = (info: string) => {
    console.log(info)
    setDebugInfo((prev) => [...prev, info])
  }

  const addWarning = (warning: string) => {
    console.warn(warning)
    setWarnings((prev) => [...prev, warning])
  }

  const loadCalibrationData = async () => {
    try {
      setLoading(true)
      setError(null)
      setDebugInfo([])
      setWarnings([])

      addDebugInfo(`🔍 Loading calibration for public view: ${calibrationId}`)

      // Validate calibration ID
      if (!calibrationId || calibrationId.length < 8) {
        throw new Error("Invalid calibration ID format")
      }

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

      // If we have valid URL parameters, create a basic view from them
      if (urlParams.isValid) {
        addDebugInfo("📝 Creating basic view from URL parameters")
        createBasicViewFromUrlParams()
        return
      }

      // Show helpful error message with troubleshooting
      addDebugInfo("❌ Could not find calibration data")
      const errorMessage = urlParams.isEmpty
        ? `Calibration certificate not found. This may happen if:\n• The QR code was generated on a different device\n• Browser data was cleared\n• The calibration was not properly saved\n\nCertificate ID: ${calibrationId}`
        : `Calibration certificate data is incomplete. The QR code may be damaged or from an older version.\n\nCertificate ID: ${calibrationId}`

      setError(errorMessage)
    } catch (error) {
      const errorMsg = `Error loading calibration data: ${error instanceof Error ? error.message : "Unknown error"}`
      addDebugInfo(`❌ ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const createBasicViewFromUrlParams = () => {
    try {
      setLoadingMethod("URL parameters")
      addDebugInfo("📝 Creating view from URL parameters")

      // Validate date
      if (!validateDate(urlParams.date)) {
        addWarning("Invalid date in URL parameters")
        urlParams.date = new Date().toISOString().split("T")[0] // Fallback to today
      }

      // Validate calibration type
      if (!["load_cell", "speed_displacement"].includes(urlParams.calibrationType)) {
        addWarning("Invalid calibration type in URL parameters")
        urlParams.calibrationType = "load_cell" // Fallback
      }

      // Create a simplified calibration object from URL parameters
      const simplifiedCalibration = {
        id: calibrationId,
        customerId: "url-param",
        equipmentId: "url-param",
        type: urlParams.calibrationType,
        technician: urlParams.technician || "Unknown",
        date: urlParams.date,
        temperature: "N/A",
        humidity: "N/A",
        toolsUsed: [],
        data: { reportNumber: calibrationId.substring(0, 8) },
        result: urlParams.result === "fail" ? "fail" : "pass", // Ensure valid result
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Calibration

      setCalibration(simplifiedCalibration)
      setEquipment({
        id: "url-param",
        name: urlParams.equipmentName || "Unknown Equipment",
        type: urlParams.calibrationType as any,
        serialNumber: "N/A",
        customerId: "url-param",
        specifications: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setCustomer({
        id: "url-param",
        name: "N/A",
        location: "N/A",
        contact: "N/A",
        email: "N/A",
        phone: "N/A",
        notes: "Limited data available from QR code",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      addDebugInfo("✅ Created basic view from URL parameters")

      if (warnings.length > 0) {
        addDebugInfo(`⚠️ ${warnings.length} warnings during URL parameter parsing`)
      }
    } catch (error) {
      addDebugInfo(`❌ Error creating view from URL parameters: ${error}`)
      throw error
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

      // First try exact match with error handling
      let cachedData = safeLocalStorageGet(`public_calibration_${calibrationId}`)

      if (!cachedData) {
        addDebugInfo("❌ No exact match found in localStorage")

        // Try to find by partial ID match
        const allKeys = Object.keys(localStorage).filter((key) => key.startsWith("public_calibration_"))
        addDebugInfo(`📋 Available localStorage keys: ${allKeys.length} found`)

        // Check ID mappings with error handling
        const mappingsData = safeLocalStorageGet("calibration_id_mappings")
        const mappings = mappingsData ? JSON.parse(mappingsData) : {}
        addDebugInfo(`🗂️ Available ID mappings: ${Object.keys(mappings).length} found`)

        // Try to find a match by short ID
        const shortId = calibrationId.substring(0, 8)
        addDebugInfo(`🔍 Searching for short ID: ${shortId}`)

        for (const [fullId, mapping] of Object.entries(mappings as any)) {
          if (fullId.startsWith(shortId) || mapping.shortId === shortId) {
            addDebugInfo(`🎯 Found potential match: ${fullId}`)
            cachedData = safeLocalStorageGet(`public_calibration_${fullId}`)
            if (cachedData) {
              addDebugInfo(`✅ Found data for ${fullId}`)
              break
            }
          }
        }

        // If still no match, try searching through all cached calibrations
        if (!cachedData) {
          addDebugInfo("🔍 Searching through all cached calibrations...")
          for (const key of allKeys) {
            const data = safeLocalStorageGet(key)
            if (data) {
              try {
                const parsed = JSON.parse(data)
                if (parsed.id && (parsed.id === calibrationId || parsed.id.startsWith(shortId))) {
                  addDebugInfo(`🎯 Found match in ${key}`)
                  cachedData = data
                  break
                }
              } catch (e) {
                addDebugInfo(`⚠️ Skipping invalid JSON in ${key}`)
              }
            }
          }
        }

        if (!cachedData) {
          addDebugInfo("❌ No matching calibration found in localStorage")
          return false
        }
      }

      // Parse cached data with error handling
      let parsedData
      try {
        parsedData = JSON.parse(cachedData)
      } catch (parseError) {
        addDebugInfo("❌ Failed to parse cached data")
        return false
      }

      addDebugInfo("📋 Found calibration in localStorage")
      addDebugInfo(`📊 Cached data structure: ${Object.keys(parsedData).join(", ")}`)

      // Use the comprehensive cached data with fallbacks
      if (parsedData.calibration) {
        setCalibration(parsedData.calibration)
        setEquipment(parsedData.equipment || null)
        setCustomer(parsedData.customer || null)
        addDebugInfo("✅ Using comprehensive cached data")
      } else {
        // Fallback to simple data structure with validation
        const simplifiedCalibration = {
          id: parsedData.id || calibrationId,
          customerId: "cached",
          equipmentId: "cached",
          type: parsedData.calibrationType || "load_cell",
          technician: parsedData.technician || "Unknown",
          date: parsedData.date || new Date().toISOString(),
          temperature: "N/A",
          humidity: "N/A",
          toolsUsed: [],
          data: { reportNumber: (parsedData.id || calibrationId).substring(0, 8) },
          result: "pass",
          createdAt: parsedData.timestamp || new Date().toISOString(),
          updatedAt: parsedData.timestamp || new Date().toISOString(),
        } as Calibration

        setCalibration(simplifiedCalibration)
        setEquipment({
          id: "cached",
          name: parsedData.equipmentName || "Unknown Equipment",
          type: parsedData.calibrationType || "load_cell",
          serialNumber: "N/A",
          customerId: "cached",
          specifications: {},
          createdAt: parsedData.timestamp || new Date().toISOString(),
          updatedAt: parsedData.timestamp || new Date().toISOString(),
        })
        setCustomer({
          id: "cached",
          name: "N/A",
          location: "N/A",
          contact: "N/A",
          email: "N/A",
          phone: "N/A",
          notes: "Limited data available from QR code scan",
          createdAt: parsedData.timestamp || new Date().toISOString(),
          updatedAt: parsedData.timestamp || new Date().toISOString(),
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

    try {
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
    } catch (error) {
      console.error("❌ Error creating calendar event:", error)
      alert("Failed to create calendar event. Please try again.")
    }
  }

  const downloadPDF = () => {
    if (!calibration) return

    try {
      if (loadingMethod === "URL parameters") {
        // Generate a simplified PDF for URL parameter mode
        generateSimplifiedPDF()
      } else {
        // Open the full report for cached data
        const printUrl = `/calibrations/${calibration.id}/report?print=true`
        window.open(printUrl, "_blank")
      }
    } catch (error) {
      console.error("❌ Error opening PDF:", error)
      alert("Failed to open PDF. Please try again.")
    }
  }

  const generateSimplifiedPDF = () => {
    // Create a new window with simplified certificate content
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups to download the PDF")
      return
    }

    const dueDate = new Date(new Date(calibration!.date).getTime() + 365 * 24 * 60 * 60 * 1000)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Calibration Certificate - ${calibration!.id.substring(0, 8)}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              border: 3px solid black; 
              padding: 20px; 
              margin-bottom: 20px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .subtitle { 
              font-size: 16px; 
              margin-bottom: 5px;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin: 20px 0;
            }
            .info-item { 
              margin-bottom: 10px;
            }
            .label { 
              font-weight: bold;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: bold;
              color: white;
            }
            .pass { background-color: #16a34a; }
            .fail { background-color: #dc2626; }
            .current { background-color: #16a34a; }
            .due-soon { background-color: #eab308; }
            .expired { background-color: #dc2626; }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid black;
              text-align: center;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">CERTIFICATE OF CALIBRATION</div>
            <div class="subtitle">
              ${
                calibration!.type === "load_cell"
                  ? "Force Verification utilizing ASTM E74-18"
                  : "Speed & Displacement Verification utilizing ASTM E2309"
              }
            </div>
            <div class="subtitle">Issued By: Your Calibration Company</div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="label">Certificate Number:</span> ${calibration!.id.substring(0, 8)}
              </div>
              <div class="info-item">
                <span class="label">Calibration Date:</span> ${new Date(calibration!.date).toLocaleDateString()}
              </div>
              <div class="info-item">
                <span class="label">Due Date:</span> ${dueDate.toLocaleDateString()}
              </div>
              <div class="info-item">
                <span class="label">Technician:</span> ${calibration!.technician}
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="label">Equipment:</span> ${equipment?.name || "N/A"}
              </div>
              <div class="info-item">
                <span class="label">Serial Number:</span> ${equipment?.serialNumber || "N/A"}
              </div>
              <div class="info-item">
                <span class="label">Calibration Type:</span> ${calibration!.type.replace("_", " ")}
              </div>
              <div class="info-item">
                <span class="label">Result:</span> 
                <span class="status-badge ${calibration!.result}">${calibration!.result.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <h3>Calibration Summary</h3>
            <p>
              This certificate confirms that the ${calibration!.type === "load_cell" ? "force measurement" : "speed and displacement"}
              calibration was performed on <strong>${new Date(calibration!.date).toLocaleDateString()}</strong> by
              certified technician <strong>${calibration!.technician}</strong> in accordance with ASTM 
              ${calibration!.type === "load_cell" ? "E74-18" : "E2309"} standards.
            </p>
            ${
              calibration!.result === "pass"
                ? `<p style="color: #16a34a; font-weight: bold;">✓ The equipment passed all calibration requirements and is certified for use until ${dueDate.toLocaleDateString()}.</p>`
                : `<p style="color: #dc2626; font-weight: bold;">✗ The equipment did not meet calibration requirements and requires adjustment or repair.</p>`
            }
          </div>

          <div class="footer">
            <p><strong>Certificate Authenticity</strong></p>
            <p>This certificate can be verified by scanning the QR code or visiting the verification URL.</p>
            <p>For questions about this calibration, please contact your calibration provider.</p>
            <p style="margin-top: 20px; font-size: 10px;">
              Generated from QR code scan • Limited data view • Full certificate available on original device
            </p>
          </div>

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print/Save as PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background-color: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>

          <script>
            // Auto-print after a short delay
            setTimeout(() => {
              window.print();
            }, 1000);
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const viewFullCertificate = () => {
    if (!calibration) return

    try {
      const certificateUrl = `/calibrations/${calibration.id}/report`
      window.open(certificateUrl, "_blank")
    } catch (error) {
      console.error("❌ Error opening certificate:", error)
      alert("Failed to open certificate. Please try again.")
    }
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
            <div className="text-gray-600 mb-4 whitespace-pre-line">
              {error || "The calibration certificate could not be found or may have been removed."}
            </div>

            {/* Helpful Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
              <h3 className="font-medium text-blue-900 mb-2">💡 Troubleshooting Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Make sure you're using the same device that generated the QR code</li>
                <li>• Check that browser data hasn't been cleared</li>
                <li>• Try scanning the QR code again from the original report</li>
                <li>• Contact your calibration provider if the issue persists</li>
              </ul>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4 text-left">
                <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Debug Information */}
            <details className="text-left mb-4">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                Show Technical Details
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

  // Calculate status dynamically (this updates in real-time)
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
            {warnings.length > 0 && (
              <Badge variant="outline" className="mt-2 ml-2 bg-yellow-50 text-yellow-800 border-yellow-200">
                {warnings.length} warning{warnings.length > 1 ? "s" : ""}
              </Badge>
            )}
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
                      {!isExpired && (
                        <p className="text-sm text-gray-500 mt-1">
                          {daysUntilDue > 0 ? `${daysUntilDue} days remaining` : "Due today"}
                        </p>
                      )}
                      {isExpired && (
                        <p className="text-sm text-red-600 mt-1">Expired {Math.abs(daysUntilDue)} days ago</p>
                      )}
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
                  {loadingMethod === "URL parameters" ? "Download Basic PDF" : "Download PDF"}
                </Button>
                {loadingMethod !== "URL parameters" && (
                  <Button onClick={viewFullCertificate} variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Certificate
                  </Button>
                )}
                {loadingMethod === "URL parameters" && (
                  <div className="text-sm text-gray-500 flex items-center justify-center">
                    <p>Limited view mode. Full certificate available on the device where calibration was performed.</p>
                  </div>
                )}
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
