"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Calendar, Printer, Mail } from "lucide-react"
import { calibrationDB, type Calibration, type Customer } from "@/lib/db"

interface CalibrationWithEquipment extends Calibration {
  equipmentName: string
}

export default function CustomerReportsPage() {
  const params = useParams()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [calibrations, setCalibrations] = useState<CalibrationWithEquipment[]>([])
  const [selectedCalibrations, setSelectedCalibrations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadCustomerReports()
  }, [customerId])

  const loadCustomerReports = async () => {
    try {
      await calibrationDB.init()

      // Load customer
      const customers = await calibrationDB.getCustomers()
      const foundCustomer = customers.find((c) => c.id === customerId)
      setCustomer(foundCustomer || null)

      // Load calibrations for this customer
      const allCalibrations = await calibrationDB.getAllCalibrations()
      const customerCalibrations = allCalibrations.filter((cal) => cal.customerId === customerId)

      // Load equipment names
      const allEquipment = await calibrationDB.getAllEquipment()
      const calibrationsWithEquipment = customerCalibrations.map((cal) => {
        const equipment = allEquipment.find((eq) => eq.id === cal.equipmentId)
        return {
          ...cal,
          equipmentName: equipment?.name || "Unknown Equipment",
        }
      })

      setCalibrations(calibrationsWithEquipment.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch (error) {
      console.error("Error loading customer reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedCalibrations.length === calibrations.length) {
      setSelectedCalibrations([])
    } else {
      setSelectedCalibrations(calibrations.map((cal) => cal.id))
    }
  }

  const handleSelectCalibration = (calibrationId: string) => {
    setSelectedCalibrations((prev) =>
      prev.includes(calibrationId) ? prev.filter((id) => id !== calibrationId) : [...prev, calibrationId],
    )
  }

  const handlePrintSelected = () => {
    if (selectedCalibrations.length === 0) {
      alert("Please select at least one calibration to print.")
      return
    }

    // Open each selected calibration report in a new tab for printing
    selectedCalibrations.forEach((calibrationId, index) => {
      setTimeout(() => {
        const printWindow = window.open(`/calibrations/${calibrationId}/report?print=true`, "_blank")
        if (printWindow) {
          printWindow.addEventListener("load", () => {
            setTimeout(() => {
              printWindow.print()
            }, 500)
          })
        }
      }, index * 1000) // Stagger the opening to avoid browser blocking
    })
  }

  const handleSendToCustomer = async () => {
    if (selectedCalibrations.length === 0) {
      alert("Please select at least one calibration to send.")
      return
    }

    setSending(true)
    try {
      // In a real app, this would send emails with PDF attachments
      // For now, we'll simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert(
        `Successfully prepared ${selectedCalibrations.length} calibration report(s) for ${customer?.name}.\n\nIn a production environment, these would be automatically emailed as PDF attachments to: ${customer?.email}`,
      )

      setSelectedCalibrations([])
    } catch (error) {
      console.error("Error sending reports:", error)
      alert("Error sending reports. Please try again.")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calibration reports...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">The customer with ID "{customerId}" could not be found.</p>
          <Link href="/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href={`/customers/${customerId}/details`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Calibration Reports - {customer.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {selectedCalibrations.length > 0 && (
                <>
                  <Button onClick={handlePrintSelected} variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Selected ({selectedCalibrations.length})
                  </Button>
                  <Button onClick={handleSendToCustomer} disabled={sending}>
                    <Mail className="h-4 w-4 mr-2" />
                    {sending ? "Sending..." : `Send to Customer (${selectedCalibrations.length})`}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {calibrations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select Reports to Send</span>
                <Button onClick={handleSelectAll} variant="outline" size="sm">
                  {selectedCalibrations.length === calibrations.length ? "Deselect All" : "Select All"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Select multiple calibration reports to print or send to the customer via email.
              </div>
              {selectedCalibrations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedCalibrations.length}</strong> report(s) selected for{" "}
                    <strong>{customer.name}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Reports will be sent to: {customer.email || "No email on file"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {calibrations.map((calibration) => (
            <Card key={calibration.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedCalibrations.includes(calibration.id)}
                    onCheckedChange={() => handleSelectCalibration(calibration.id)}
                    className="mt-1"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-medium">{calibration.type.replace("_", " & ")} Calibration</h3>
                      <Badge
                        variant={calibration.result === "pass" ? "default" : "destructive"}
                        className={calibration.result === "pass" ? "bg-green-600" : ""}
                      >
                        {calibration.result.toUpperCase()}
                      </Badge>
                      {!calibration.synced && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Pending Sync
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{calibration.equipmentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(calibration.date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span>Technician: {calibration.technician}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      {calibration.temperature && <span>Temp: {calibration.temperature}°F</span>}
                      {calibration.humidity && <span className="ml-4">Humidity: {calibration.humidity}%</span>}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link href={`/calibrations/${calibration.id}/report`}>
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {calibrations.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No calibration reports found for this customer</p>
            <Link href={`/calibrations/new?customer=${customerId}`}>
              <Button>Perform First Calibration</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
