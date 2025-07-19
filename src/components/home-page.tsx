"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, Settings, Shield, CheckCircle, Clock, XCircle } from "lucide-react"
import type { User } from "@/types/user"
import type { Post } from "@/types/post"
import ProfileModal from "./profile-modal"
import VerificationModal from "./verification-modal"
import UserProfileModal from "./user-profile-modal"
import PostFeed from "./post-feed"
import CreatePost from "./create-post"
import ActiveUsers from "./active-users"
import { getUserAvatarUrl } from "@/lib/image-utils"
import { fetchPosts } from "@/lib/strapi-api"

interface HomePageProps {
  user: User
  onLogout: () => void
  onUserUpdate: (user: User) => void
}

export default function HomePage({ user, onLogout, onUserUpdate }: HomePageProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showUserProfileModal, setShowUserProfileModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const fetchedPosts = await fetchPosts()
      setPosts(fetchedPosts)
    } catch (error) {
      console.error("Failed to load posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
  }

  const handlePostDelete = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const handleUserClick = (userId: number) => {
    if (userId === user.id) {
      setShowProfileModal(true)
    } else {
      setSelectedUserId(userId)
      setShowUserProfileModal(true)
    }
  }

  const getVerificationStatusIcon = () => {
    if (user.isVerified) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (user.verificationStep && user.verificationStep > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />
    }
    return <XCircle className="w-4 h-4 text-gray-400" />
  }

  const getVerificationStatusText = () => {
    if (user.isVerified) {
      return "Verified"
    } else if (user.verificationStep && user.verificationStep > 0) {
      return "Pending"
    }
    return "Unverified"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Sphere</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowProfileModal(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-3">
            <Card className="sticky top-24">
              <CardHeader className="text-center pb-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    <AvatarImage src={getUserAvatarUrl(user) || "/placeholder.png"} alt={user.username} />
                    <AvatarFallback className="text-lg">
                      {user.firstName?.[0] || user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                </CardTitle>
                <CardDescription>@{user.username}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <div className="flex items-center gap-1">
                    {getVerificationStatusIcon()}
                    <span className="font-medium">{getVerificationStatusText()}</span>
                  </div>
                </div>

                {user.bio && (
                  <div className="text-sm text-gray-600">
                    <p className="line-clamp-3">{user.bio}</p>
                  </div>
                )}

                {user.skills && user.skills.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {user.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {user.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => setShowProfileModal(true)}
                  >
                    View Full Profile
                  </Button>
                  {!user.isVerified && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowVerificationModal(true)}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Get Verified
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Feed */}
          <div className="lg:col-span-6">
            <div className="space-y-6">
              <CreatePost user={user} onPostCreated={handlePostCreated} />
              <PostFeed
                posts={posts}
                loading={loading}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
                currentUser={user}
                onUserClick={handleUserClick}
              />
            </div>
          </div>

          {/* Right Sidebar - Active Users */}
          <div className="lg:col-span-3">
            <ActiveUsers currentUser={user} onUserClick={handleUserClick} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUserUpdate={onUserUpdate}
      />

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        user={user}
        onVerificationComplete={onUserUpdate}
      />

      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false)
          setSelectedUserId(null)
        }}
        userId={selectedUserId}
        currentUser={user}
      />
    </div>
  )
}
