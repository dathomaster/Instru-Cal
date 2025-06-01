"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Mail, Shield, Plus, Trash2, Link } from "lucide-react"
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
  const [signupLink, setSignupLink] = useState("")
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    if (isAdmin) {
      loadEmployees()
      // Generate a signup link with the current URL
      const baseUrl = window.location.origin
      setSignupLink(`${baseUrl}/signup?invited=true`)
    }
  }, [isAdmin])

  const loadEmployees = async () => {
    try {
      // For now, we'll simulate employee data since we can't access auth.users directly
      const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setEmployees(data || [])
    } catch (err) {
      console.error("Failed to load employees:", err)
      setError("Failed to load employees")
    }
  }

  const inviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Add employee to our employees table
      const { data, error } = await supabase
        .from("employees")
        .insert([
          {
            email: newEmployeeEmail,
            created_at: new Date().toISOString(),
            invited_by: user?.id || "admin",
          },
        ])
        .select()

      if (error) throw error

      setSuccess(`Employee ${newEmployeeEmail} added! Share the signup link with them.`)
      setNewEmployeeEmail("")

      // Refresh employee list
      loadEmployees()
    } catch (err) {
      console.error("Failed to add employee:", err)
      setError("Failed to add employee")
    } finally {
      setLoading(false)
    }
  }

  const removeEmployee = async (employeeId: string) => {
    if (confirm("Are you sure you want to remove this employee?")) {
      try {
        const { error } = await supabase.from("employees").delete().eq("id", employeeId)

        if (error) throw error

        setEmployees(employees.filter((emp) => emp.id !== employeeId))
        setSuccess("Employee removed successfully")
      } catch (err) {
        console.error("Failed to remove employee:", err)
        setError("Failed to remove employee")
      }
    }
  }

  const copySignupLink = () => {
    navigator.clipboard.writeText(signupLink)
    setSuccess("Signup link copied to clipboard!")
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
                Add Employee
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
                  {loading ? "Adding..." : "Add Employee"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Signup Link for Employees</h3>
                <div className="flex items-center gap-2">
                  <Input value={signupLink} readOnly className="bg-gray-50" />
                  <Button onClick={copySignupLink} size="icon" variant="outline">
                    <Link className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this link with your employees so they can create their accounts.
                </p>
              </div>
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
                        Added: {new Date(employee.created_at).toLocaleDateString()}
                        {employee.last_sign_in_at &&
                          ` • Last login: ${new Date(employee.last_sign_in_at).toLocaleDateString()}`}
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
                  <p className="text-gray-500 text-center py-4">No employees yet. Add your first employee!</p>
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
