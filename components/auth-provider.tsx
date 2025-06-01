"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { LoginForm } from "@/components/login-form"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
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

        // Check for regular user session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          setIsAdmin(false)

          // Update employee last sign in
          await supabase
            .from("employees")
            .update({ last_sign_in_at: new Date().toISOString() })
            .eq("user_id", session.user.id)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes (only for regular users)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (localStorage.getItem("isAdmin") === "true") return // Don't override admin session

      if (session?.user) {
        setUser(session.user)
        setIsAdmin(false)

        // Update employee last sign in
        try {
          await supabase
            .from("employees")
            .update({ last_sign_in_at: new Date().toISOString() })
            .eq("user_id", session.user.id)
        } catch (error) {
          console.error("Error updating last sign in:", error)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, supabase])

  const signOut = async () => {
    try {
      // Clear admin session
      localStorage.removeItem("adminUser")
      localStorage.removeItem("isAdmin")

      // Sign out regular user
      await supabase.auth.signOut()

      setUser(null)
      setIsAdmin(false)
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
