"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wifi, FileText, Users, Wrench, Plus } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Wifi className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Working Offline</h1>
              <p className="text-gray-600 text-lg">
                No internet connection detected, but you can continue working. All your data will sync automatically
                when you're back online.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Available Offline:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Create new calibrations</li>
                  <li>• Edit existing data</li>
                  <li>• View all records</li>
                  <li>• Generate reports</li>
                  <li>• Manage customers & equipment</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">⏳ Requires Internet:</h3>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Syncing with cloud database</li>
                  <li>• Sharing data with team</li>
                  <li>• Backup to server</li>
                  <li>• Real-time collaboration</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Link href="/calibrations/new">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  <span className="text-xs">New Calibration</span>
                </Button>
              </Link>

              <Link href="/calibrations">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-xs">View Calibrations</span>
                </Button>
              </Link>

              <Link href="/customers">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span className="text-xs">Customers</span>
                </Button>
              </Link>

              <Link href="/equipment">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Wrench className="h-6 w-6" />
                  <span className="text-xs">Equipment</span>
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <Link href="/">
                <Button className="w-full md:w-auto px-8">Continue to Dashboard</Button>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                <strong>Tip:</strong> Install this app on your device for the best offline experience. Look for the
                "Install" button in your browser's address bar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
