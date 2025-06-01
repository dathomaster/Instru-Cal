"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { LoginForm } from "@/components/login-form"

interface Employee {
  id: string
  username: string
  is_active: boolean
  last_sign_in_at?: string
}

interface AuthContextType {
  user: Employee | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initAuth = async () => {
      try {
        // Check for admin session first
        const adminUser = localStorage.getItem("adminUser")
        const isAdminFlag = localStorage.getItem("isAdmin")

        if (adminUser && isAdminFlag === "true") {
          setUser(JSON.parse(adminUser))
          setIsAdmin(true)
          setLoading(false)
          return
        }

        // Check for employee session
        const employeeUser = localStorage.getItem("employeeUser")
        if (employeeUser) {
          setUser(JSON.parse(employeeUser))
          setIsAdmin(false)
          setLoading(false)
          return
        }

        // No session found
        setUser(null)
        setIsAdmin(false)
      } catch (error) {
        console.error("Auth initialization error:", error)
        // Clear any potentially corrupted session data
        localStorage.removeItem("adminUser")
        localStorage.removeItem("isAdmin")
        localStorage.removeItem("employeeUser")
        setUser(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const signOut = async () => {
    try {
      // Clear all sessions
      localStorage.removeItem("adminUser")
      localStorage.removeItem("isAdmin")
      localStorage.removeItem("employeeUser")

      setUser(null)
      setIsAdmin(false)

      // Force reload to clear any cached state
      window.location.href = "/"
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
