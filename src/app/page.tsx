"use client"

import { useState, useEffect } from "react"
import LoginForm from "@/components/login-form"
import RegistrationForm from "@/components/registration-form"
import HomePage from "@/components/home-page"
import type { User } from "@/types/user"

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    if (token) {
      fetchUserProfile(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me?populate=*`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        console.log("User data fetched:", userData) // Debug log
        setUser(userData)
      } else {
        console.log("Token invalid, removing from storage")
        localStorage.removeItem("token")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      localStorage.removeItem("token")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData: User, token: string) => {
    console.log("Login successful, setting user:", userData) // Debug log
    localStorage.setItem("token", token)
    setUser(userData)
  }

  const handleLogout = () => {
    console.log("Logging out user") // Debug log
    localStorage.removeItem("token")
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  // Debug log to check user state
  console.log("Current user state:", user)

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <HomePage user={user} onLogout={handleLogout} onUserUpdate={setUser} />
      ) : showRegistration ? (
        <RegistrationForm onRegister={handleLogin} onSwitchToLogin={() => setShowRegistration(false)} />
      ) : (
        <LoginForm onLogin={handleLogin} onSwitchToRegister={() => setShowRegistration(true)} />
      )}
    </div>
  )
}
