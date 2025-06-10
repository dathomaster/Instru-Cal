"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClientSupabaseClient } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  isOffline: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOffline: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    // Check if we're offline
    const checkOfflineStatus = () => {
      const offline = !navigator.onLine
      setIsOffline(offline)

      if (offline) {
        // In offline mode, create a mock user to allow app functionality
        const offlineUser = {
          id: "offline-user",
          email: "offline@local.app",
          user_metadata: { name: "Offline User" },
        } as User

        setUser(offlineUser)
        setLoading(false)
        return
      }
    }

    // Initial check
    checkOfflineStatus()

    // Listen for online/offline events
    window.addEventListener("online", checkOfflineStatus)
    window.addEventListener("offline", checkOfflineStatus)

    // Only try Supabase auth if we're online
    if (navigator.onLine) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error("Auth error:", error)
        }
        setUser(session?.user ?? null)
        setLoading(false)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => {
        subscription.unsubscribe()
        window.removeEventListener("online", checkOfflineStatus)
        window.removeEventListener("offline", checkOfflineStatus)
      }
    }

    return () => {
      window.removeEventListener("online", checkOfflineStatus)
      window.removeEventListener("offline", checkOfflineStatus)
    }
  }, [])

  const signOut = async () => {
    if (isOffline) {
      // In offline mode, just clear the user
      setUser(null)
      return
    }

    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return <AuthContext.Provider value={{ user, loading, isOffline, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
