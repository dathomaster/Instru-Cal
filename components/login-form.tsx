"use client"

import type React from "react"

import { useState } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Mail, Lock, UserCheck } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSignUp, setShowSignUp] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const supabase = createClientSupabaseClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Check hardcoded admin credentials
      if (adminUsername === "calibadmin" && adminPassword === "CalibPro2024!") {
        // Create a special admin session
        localStorage.setItem("isAdmin", "true")
        localStorage.setItem(
          "adminUser",
          JSON.stringify({
            id: "admin-user",
            email: "admin@calibrationpro.com",
            user_metadata: { isAdmin: true },
          }),
        )
        // Force a page reload to trigger auth provider update
        window.location.reload()
      } else {
        setError("Invalid admin credentials")
      }
    } catch (err) {
      setError("An error occurred during admin login")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        alert("Account created! Check your email to confirm your account.")
      }
    } catch (err) {
      setError("An error occurred during signup")
    } finally {
      setLoading(false)
    }
  }

  if (showAdminLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <UserCheck className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <p className="text-gray-600">Manage employees and system settings</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 text-sm">Admin Features:</h4>
              <ul className="text-xs text-blue-800 mt-1 space-y-1">
                <li>• Manage employee accounts</li>
                <li>• View all calibration data</li>
                <li>• System configuration</li>
                <li>• Data export and reports</li>
              </ul>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Username
                </label>
                <Input
                  id="adminUsername"
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Enter admin username"
                  required
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Password
                </label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Login as Admin"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button variant="link" onClick={() => setShowAdminLogin(false)}>
                ← Back to Employee Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">CalibrationPro</CardTitle>
          <p className="text-gray-600">{showSignUp ? "Create an employee account" : "Employee sign in"}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={showSignUp ? handleSignUp : handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={showSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : showSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {showSignUp ? (
              <>
                <p>Already have an account?</p>
                <Button variant="link" className="text-blue-600" onClick={() => setShowSignUp(false)}>
                  Sign In
                </Button>
              </>
            ) : (
              <>
                <p>Need an account?</p>
                <Button variant="link" className="text-blue-600" onClick={() => setShowSignUp(true)}>
                  Create Account
                </Button>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdminLogin(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Admin Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
