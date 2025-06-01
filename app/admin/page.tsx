"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Mail, Shield, UserPlus } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

interface Employee {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
}

export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const { user } = useAuth()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      // For now, we'll just show the current user and any we can track
      // In a real setup, you'd need server-side admin functions
      setEmployees([
        {
          id: user?.id || "",
          email: user?.email || "",
          created_at: user?.created_at || new Date().toISOString(),
          last_sign_in_at: user?.last_sign_in_at,
        },
      ])
    } catch (err: any) {
      console.error("Error loading employees:", err)
      setError("Unable to load employee list")
    }
  }

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      // Use regular signup instead of admin functions
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error

      if (data.user) {
        setMessage(
          `Employee ${newEmail} invited successfully! They need to check their email to confirm their account.`,
        )
        setNewEmail("")
        setNewPassword("")
      }
    } catch (err: any) {
      setError(err.message || "Failed to add employee")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
            <Badge variant="outline">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Employee Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite New Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addEmployee} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="employee@company.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Temporary Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">They'll receive an email to confirm their account</p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {message && (
                  <Alert>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending Invitation..." : "Send Invitation"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{user?.email}</span>
                      <Badge variant="outline" className="text-xs">
                        Admin
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">How Employee Invitations Work:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Employee receives email invitation</li>
                  <li>• They click the link to confirm their account</li>
                  <li>• They can then login with their email and password</li>
                  <li>• All calibration data syncs between team members</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manual Setup Alternative */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Alternative: Manual Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">If Email Invitations Don't Work:</h3>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Give employees your app URL</li>
                  <li>2. Tell them to click "Create Account" on login page</li>
                  <li>3. They sign up with their own email/password</li>
                  <li>4. They can immediately start using the app</li>
                </ol>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Security Features:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All data requires authentication</li>
                  <li>• Secure sync between devices</li>
                  <li>• Works completely offline</li>
                  <li>• Data protected by Row Level Security</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
