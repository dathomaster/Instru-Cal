"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Plus, Mail, Shield, Trash2 } from "lucide-react"
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
      const { data, error } = await supabase.auth.admin.listUsers()
      if (error) throw error

      setEmployees(
        data.users.map((user) => ({
          id: user.id,
          email: user.email || "",
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        })),
      )
    } catch (err: any) {
      console.error("Error loading employees:", err)
      setError("Unable to load employees. You may need admin privileges.")
    }
  }

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: newPassword,
        email_confirm: true,
      })

      if (error) throw error

      setMessage(`Employee ${newEmail} added successfully!`)
      setNewEmail("")
      setNewPassword("")
      loadEmployees()
    } catch (err: any) {
      setError(err.message || "Failed to add employee")
    }
    setLoading(false)
  }

  const removeEmployee = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}?`)) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error

      setMessage(`Employee ${email} removed successfully!`)
      loadEmployees()
    } catch (err: any) {
      setError(err.message || "Failed to remove employee")
    }
  }

  // Check if current user is admin (first user or specific email)
  const isAdmin = user?.email === employees[0]?.email || user?.email?.includes("admin")

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
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
                <Plus className="h-5 w-5" />
                Add New Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addEmployee} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
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
                  <p className="text-xs text-gray-500 mt-1">Employee can change this after first login</p>
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
                  {loading ? "Adding Employee..." : "Add Employee"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Employee List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Employees ({employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{employee.email}</span>
                        {employee.id === user?.id && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Added: {new Date(employee.created_at).toLocaleDateString()}
                        {employee.last_sign_in_at && (
                          <span className="ml-2">
                            Last login: {new Date(employee.last_sign_in_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    {employee.id !== user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmployee(employee.id, employee.email)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {employees.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No employees found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Access Control</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Only authenticated users can access the application</li>
                  <li>• All data is protected by Row Level Security</li>
                  <li>• Each employee has their own secure login</li>
                  <li>• Data syncs securely between devices</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Best Practices</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Employees should change their password after first login</li>
                  <li>• Use strong, unique passwords</li>
                  <li>• Log out when using shared devices</li>
                  <li>• Report any suspicious activity immediately</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
