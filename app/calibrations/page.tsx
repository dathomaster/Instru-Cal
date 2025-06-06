"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarIcon, FileText, AlertCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { calibrationDB } from "@/lib/db"
import { FormGuidance } from "@/components/form-guidance"
import Link from "next/link"

export default function CalibrationsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const formattedDate = date ? format(date, "yyyy-MM-dd") : ""

  const {
    data: calibrations,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["calibrations", formattedDate],
    queryFn: async () => {
      try {
        await calibrationDB.init()
        const allCalibrations = await calibrationDB.getAllCalibrations()

        // Filter by date if a date is selected
        if (formattedDate) {
          return allCalibrations.filter((cal) => cal.date.startsWith(formattedDate))
        }

        return allCalibrations
      } catch (err) {
        console.error("Error fetching calibrations:", err)
        throw new Error("Failed to load calibrations")
      }
    },
  })

  const totalCalibrationsThisMonth = calibrations?.length || 0

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Calibrations</h1>

      <FormGuidance type="info" title="Working with Calibrations" className="mb-6">
        <p>
          Select a date to filter calibrations. All calibrations are stored locally and will sync when you're online.
          You can view, edit, and create new calibrations even when offline.
        </p>
      </FormGuidance>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Picker Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view calibrations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date > new Date() || date < new Date("2023-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p>Selected Date: {formattedDate || "No date selected"}</p>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Total calibrations for selected date.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalibrationsThisMonth}</div>
            <Link href="/calibrations/new" className="text-blue-600 hover:underline text-sm flex items-center mt-2">
              <FileText className="h-4 w-4 mr-1" />
              Create new calibration
            </Link>
          </CardContent>
        </Card>

        {/* Calibrations List Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Calibrations List</CardTitle>
            <CardDescription>List of calibrations for the selected date.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading calibrations...</p>
              </div>
            )}

            {isError && (
              <FormGuidance type="error" title="Error Loading Calibrations">
                <p>
                  There was a problem loading the calibrations.{" "}
                  {error instanceof Error ? error.message : "Please try again."}
                </p>
              </FormGuidance>
            )}

            {calibrations && calibrations.length === 0 && (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="mt-2 text-gray-500">No calibrations found for the selected date.</p>
                <Link href="/calibrations/new" className="mt-4 inline-block">
                  <Button>Create New Calibration</Button>
                </Link>
              </div>
            )}

            {calibrations && calibrations.length > 0 && (
              <div className="space-y-3">
                {calibrations.map((calibration) => (
                  <Link href={`/calibrations/${calibration.id}/report`} key={calibration.id} className="block">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium">{calibration.type.replace("_", " & ")} Calibration</p>
                        <p className="text-sm text-muted-foreground">
                          Customer ID: {calibration.customerId} | Equipment ID: {calibration.equipmentId}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(calibration.date).toLocaleDateString()} | Result:{" "}
                          {calibration.result === "pass" ? "Passed" : "Failed"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
