import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import type { Calibration } from "@/types"
import Link from "next/link"
import { Edit, FileText } from "lucide-react"

async function getCalibrations(): Promise<Calibration[]> {
  // Simulate fetching calibrations from a database
  // Replace this with your actual data fetching logic
  const calibrations = await db.calibration.findMany()
  return calibrations
}

export default async function CalibrationsPage() {
  const calibrations = await getCalibrations()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Calibrations</h1>
      <Table>
        <TableCaption>A list of your recent calibrations.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Technician</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calibrations.map((calibration) => (
            <TableRow key={calibration.id}>
              <TableCell className="font-medium">{calibration.id}</TableCell>
              <TableCell>{calibration.equipmentId}</TableCell>
              <TableCell>{calibration.date.toLocaleDateString()}</TableCell>
              <TableCell>{calibration.technicianId}</TableCell>
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
    </div>
  )
}
