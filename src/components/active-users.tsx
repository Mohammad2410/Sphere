"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Circle } from "lucide-react"
import type { User } from "@/types/user"
import { getUserAvatarUrl } from "@/lib/image-utils"

interface ActiveUsersProps {
  currentUser: User
  onUserClick?: (userId: number) => void
}

interface ActiveUser {
  id: number
  username: string
  firstName?: string
  lastName?: string
  profilePicture?: {
    url: string
  }
  avatar?: {
    url: string
  }
  isVerified?: boolean
  lastActive: string
}

export default function ActiveUsers({ currentUser, onUserClick }: ActiveUsersProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveUsers()
    // Set up interval to refresh active users every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users?populate=*&filters[id][$ne]=${currentUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        // Simulate active status - in real app, you'd track this properly
        const users = data.map((user: any) => ({
          ...user,
          lastActive: new Date().toISOString(),
        }))
        setActiveUsers(users.slice(0, 10)) // Show top 10 users
      }
    } catch (error) {
      console.error("Error fetching active users:", error)
    } finally {
      setLoading(false)
    }
  }

  const isRecentlyActive = (lastActive: string) => {
    const now = new Date()
    const lastActiveDate = new Date(lastActive)
    const diffInMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60))
    return diffInMinutes < 15 // Consider active if last seen within 15 minutes
  }

  if (loading) {
    return (
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="w-24 h-3 bg-gray-200 rounded mb-1" />
                  <div className="w-16 h-2 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          Active Users
          <Badge variant="secondary" className="ml-auto">
            {activeUsers.filter((user) => isRecentlyActive(user.lastActive)).length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeUsers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No other users found</p>
          ) : (
            activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors"
                onClick={() => onUserClick?.(user.id)}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={getUserAvatarUrl(user) || "/placeholder.png"} alt={user.username} />
                    <AvatarFallback className="text-xs">
                      {user.firstName?.[0] || user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isRecentlyActive(user.lastActive) && (
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <Circle className="w-3 h-3 text-green-500 fill-current" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
                {user.isVerified && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    ✓
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
