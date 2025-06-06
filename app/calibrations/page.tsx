"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getCalibrations } from "@/lib/api"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function CalibrationsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const formattedDate = date ? format(date, "yyyy-MM-dd") : ""

  const {
    data: calibrations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["calibrations", formattedDate],
    queryFn: () => getCalibrations(formattedDate),
  })

  const totalCalibrationsThisMonth = calibrations?.length || 0

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Calibrations</h1>

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
            <CardDescription>Total calibrations this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalibrationsThisMonth}</div>
          </CardContent>
        </Card>

        {/* Calibrations List Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Calibrations List</CardTitle>
            <CardDescription>List of calibrations for the selected date.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p>Loading calibrations...</p>}
            {isError && <p>Error fetching calibrations.</p>}
            {calibrations && calibrations.length === 0 && <p>No calibrations found for the selected date.</p>}
            {calibrations && calibrations.length > 0 && (
              <ul>
                {calibrations.map((calibration) => (
                  <li key={calibration.id}>
                    Calibration ID: {calibration.id}, Value: {calibration.value}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
