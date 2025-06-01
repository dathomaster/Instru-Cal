"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Mail, Shield, Plus, Trash2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"

interface Employee {
  id: string
  username: string
  password: string
  created_at: string
  last_sign_in_at?: string
  is_active: boolean
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    if (isAdmin) {
      loadEmployees()
    }
  }, [isAdmin])

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      setEmployees(data || [])
    } catch (err) {
      console.error("Failed to load employees:", err)
      // Don't show error for loading, just use empty array
      setEmployees([])
    }
  }

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Check if employee already exists
      const { data: existingEmployee } = await supabase
        .from("employees")
        .select("username")
        .eq("username", newUsername)
        .single()

      if (existingEmployee) {
        setError("Employee with this username already exists")
        setLoading(false)
        return
      }

      // Add employee to our employees table
      const { data, error } = await supabase
        .from("employees")
        .insert([
          {
            username: newUsername,
            password: newPassword, // In a real app, you'd hash this
            is_active: true,
            email: null, // Explicitly set email to null since we're using username/password
            user_id: null, // Explicitly set user_id to null since we're not using Supabase auth
          },
        ])
        .select()

      if (error) {
        console.error("Supabase insert error:", error)
        throw error
      }

      setSuccess(`✅ Employee ${newUsername} added successfully!`)
      setNewUsername("")
      setNewPassword("")

      // Add to local state immediately
      if (data && data[0]) {
        setEmployees([data[0], ...employees])
      }
    } catch (err: any) {
      console.error("Failed to add employee:", err)
      setError(`Failed to add employee: ${err.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const removeEmployee = async (employeeId: string, employeeUsername: string) => {
    if (confirm(`Are you sure you want to remove ${employeeUsername}?`)) {
      try {
        const { error } = await supabase.from("employees").delete().eq("id", employeeId)

        if (error) throw error

        setEmployees(employees.filter((emp) => emp.id !== employeeId))
        setSuccess(`Employee ${employeeUsername} removed successfully`)
      } catch (err: any) {
        console.error("Failed to remove employee:", err)
        setError(`Failed to remove employee: ${err.message}`)
      }
    }
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
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
        {/* Add back button */}
        <div className="mb-4">
          <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

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
          {/* Add Employee */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Employee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addEmployee} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="username"
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="employee1"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="password123"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Adding..." : "Add Employee"}
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{employee.username}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500">
                          Password:{" "}
                          <span className="font-mono bg-gray-100 px-1 rounded">
                            {showPassword[employee.id] ? employee.password : "••••••••"}
                          </span>
                        </p>
                        <button
                          onClick={() => togglePasswordVisibility(employee.id)}
                          className="text-gray-400 hover:text-gray-600"
                          type="button"
                        >
                          {showPassword[employee.id] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Added: {new Date(employee.created_at).toLocaleDateString()}
                        {employee.last_sign_in_at &&
                          ` • Last login: ${new Date(employee.last_sign_in_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEmployee(employee.id, employee.username)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {employees.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No employees yet.</p>
                    <p className="text-sm text-gray-400">Add your first employee to get started!</p>
                  </div>
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
              <h3 className="text-2xl font-bold text-gray-900">5</h3>
              <p className="text-gray-600">Max Employees</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
