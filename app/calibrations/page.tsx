"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calibrationDB, type Calibration, type Customer, type Equipment } from "@/lib/db"
import Link from "next/link"
import { Edit, FileText, Plus } from "lucide-react"
import { useEffect, useState } from "react"

export default function CalibrationsPage() {
  const [calibrations, setCalibrations] = useState<Calibration[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Calibrations</h1>
        <Link href="/calibrations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Calibration
          </Button>
        </Link>
      </div>

      {calibrations.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No calibrations found.</p>
          <Link href="/calibrations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Calibration
            </Button>
          </Link>
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
            {calibrations.map((calibration) => (
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
