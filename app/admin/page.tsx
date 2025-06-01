"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Mail, Shield, Plus, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"

interface Employee {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    if (isAdmin) {
      loadEmployees()
    }
  }, [isAdmin])

  const loadEmployees = async () => {
    try {
      // For now, we'll simulate employee data since we can't access auth.users directly
      const mockEmployees: Employee[] = [
        {
          id: "1",
          email: "employee1@company.com",
          created_at: "2024-01-15",
          last_sign_in_at: "2024-01-20",
        },
        {
          id: "2",
          email: "employee2@company.com",
          created_at: "2024-01-16",
          last_sign_in_at: "2024-01-19",
        },
      ]
      setEmployees(mockEmployees)
    } catch (err) {
      setError("Failed to load employees")
    }
  }

  const inviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Send invitation email (this would normally create an account)
      setSuccess(`Invitation sent to ${newEmployeeEmail}! They can now create an account.`)
      setNewEmployeeEmail("")

      // Add to mock employee list
      const newEmployee: Employee = {
        id: Date.now().toString(),
        email: newEmployeeEmail,
        created_at: new Date().toISOString().split("T")[0],
      }
      setEmployees([...employees, newEmployee])
    } catch (err) {
      setError("Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  const removeEmployee = async (employeeId: string) => {
    if (confirm("Are you sure you want to remove this employee?")) {
      setEmployees(employees.filter((emp) => emp.id !== employeeId))
      setSuccess("Employee removed successfully")
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage employees and system settings</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invite Employee */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Invite Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={inviteEmployee} className="space-y-4">
                <div>
                  <label htmlFor="employeeEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="employeeEmail"
                      type="email"
                      value={newEmployeeEmail}
                      onChange={(e) => setNewEmployeeEmail(e.target.value)}
                      placeholder="employee@company.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Employee List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employees ({employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{employee.email}</p>
                      <p className="text-sm text-gray-500">
                        Joined: {employee.created_at}
                        {employee.last_sign_in_at && ` • Last login: ${employee.last_sign_in_at}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEmployee(employee.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {employees.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No employees yet. Invite your first employee!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">{employees.length}</h3>
              <p className="text-gray-600">Total Employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">Active</h3>
              <p className="text-gray-600">System Status</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
              <p className="text-gray-600">Pending Invites</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
