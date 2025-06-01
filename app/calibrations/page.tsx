"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { calibrationDB, type Calibration, type Customer, type Equipment } from "@/lib/db"
import Link from "next/link"
import { Edit, FileText, Plus, ArrowLeft, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function CalibrationsPage() {
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [calibrationsData, customersData, equipmentData] = await Promise.all([
          calibrationDB.getAllCalibrations(),
          calibrationDB.getCustomers(),
          calibrationDB.getAllEquipment(),
        ])

        setCalibrations(calibrationsData)
        setCustomers(customersData)
        setEquipment(equipmentData)
      } catch (error) {
        console.error("Error loading calibrations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    return customer?.name || "Unknown Customer"
  }

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId)
    return eq?.name || "Unknown Equipment"
  }

  const handleDeleteCalibration = async (calibrationId: string) => {
    try {
      setDeletingId(calibrationId)
      await calibrationDB.deleteCalibration(calibrationId)

      // Remove from local state
      setCalibrations((prev) => prev.filter((cal) => cal.id !== calibrationId))

      console.log("Calibration deleted successfully")
    } catch (error) {
      console.error("Error deleting calibration:", error)
      alert("Failed to delete calibration. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const filteredCalibrations = calibrations.filter((calibration) => {
    const customerName = getCustomerName(calibration.customerId).toLowerCase()
    const equipmentName = getEquipmentName(calibration.equipmentId).toLowerCase()
    const technicianName = calibration.technician.toLowerCase()
    const type = calibration.type.replace("_", " ").toLowerCase()
    const search = searchTerm.toLowerCase()

    return (
      customerName.includes(search) ||
      equipmentName.includes(search) ||
      technicianName.includes(search) ||
      type.includes(search)
    )
  })

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading calibrations...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900">Calibrations</span>
      </div>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-semibold">Calibrations</h1>
        </div>
        <Link href="/calibrations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Calibration
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search calibrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {filteredCalibrations.length === 0 ? (
        <div className="text-center py-10">
          {searchTerm ? (
            <div>
              <p className="text-gray-500 mb-4">No calibrations found matching "{searchTerm}".</p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-4">No calibrations found.</p>
              <Link href="/calibrations/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Calibration
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Table>
          <TableCaption>A list of your recent calibrations.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCalibrations.map((calibration) => (
              <TableRow key={calibration.id}>
                <TableCell className="font-medium">{getCustomerName(calibration.customerId)}</TableCell>
                <TableCell>{getEquipmentName(calibration.equipmentId)}</TableCell>
                <TableCell className="capitalize">{calibration.type.replace("_", " ")}</TableCell>
                <TableCell>{new Date(calibration.date).toLocaleDateString()}</TableCell>
                <TableCell>{calibration.technician}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      calibration.result === "pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {calibration.result.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/calibrations/${calibration.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/calibrations/${calibration.id}/report`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        View Report
                      </Button>
                    </Link>

                    {/* Delete Button with Confirmation Dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === calibration.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deletingId === calibration.id ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Calibration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this calibration for{" "}
                            <strong>{getCustomerName(calibration.customerId)}</strong> -{" "}
                            <strong>{getEquipmentName(calibration.equipmentId)}</strong>?
                            <br />
                            <br />
                            This action cannot be undone. The calibration data and report will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCalibration(calibration.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Calibration
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
