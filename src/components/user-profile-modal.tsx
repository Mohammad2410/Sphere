"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, XCircle, MapPin, Phone, Calendar, Briefcase } from "lucide-react"
import type { User } from "@/types/user"
import type { Post } from "@/types/post"
import { getUserAvatarUrl } from "@/lib/image-utils"
import PostFeed from "./post-feed"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number | null
  currentUser: User
}

export default function UserProfileModal({ isOpen, onClose, userId, currentUser }: UserProfileModalProps) {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile()
      fetchUserPosts()
    }
  }, [isOpen, userId])

  const fetchUserProfile = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/${userId}?populate=*`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    if (!userId) return

    setPostsLoading(true)
    try {
      const token = localStorage.getItem("token")
      // Fixed the populate syntax
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts?filters[author][id][$eq]=${userId}&populate=*&sort=createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        const transformedPosts =
          data.data
            ?.map((post: any) => {
              console.log("User post data:", post) // Debug log

              return {
                id: post.id || 0,
                content: post.attributes?.content || "",
                image: post.attributes?.image?.data
                  ? {
                      url: post.attributes.image.data.attributes?.url || "",
                    }
                  : null,
                author: {
                  id: post.attributes?.author?.data?.id || 0,
                  username: post.attributes?.author?.data?.attributes?.username || "Unknown User",
                  firstName: post.attributes?.author?.data?.attributes?.firstName || "",
                  lastName: post.attributes?.author?.data?.attributes?.lastName || "",
                  profilePicture: post.attributes?.author?.data?.attributes?.profilePicture?.data
                    ? {
                        url: post.attributes.author.data.attributes.profilePicture.data.attributes?.url || "",
                      }
                    : null,
                  avatar: post.attributes?.author?.data?.attributes?.avatar?.data
                    ? {
                        url: post.attributes.author.data.attributes.avatar.data.attributes?.url || "",
                      }
                    : null,
                },
                likes: post.attributes?.likes || 0,
                comments: post.attributes?.comments || 0,
                isLiked: post.attributes?.isLiked || false,
                createdAt: post.attributes?.createdAt || new Date().toISOString(),
                updatedAt: post.attributes?.updatedAt || new Date().toISOString(),
              }
            })
            .filter((post) => post.id !== 0) || []

        setPosts(transformedPosts)
      } else {
        // Fallback to simpler query
        const simpleResponse = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts?filters[author][id][$eq]=${userId}&populate=*`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json()
          const simplePosts =
            simpleData.data
              ?.map((post: any) => {
                console.log("Simple user post data:", post) // Debug log

                return {
                  id: post.id || 0,
                  content: post.attributes?.content || "",
                  image: post.attributes?.image?.data
                    ? {
                        url: post.attributes.image.data.attributes?.url || "",
                      }
                    : null,
                  author: {
                    id: post.attributes?.author?.data?.id || 0,
                    username: post.attributes?.author?.data?.attributes?.username || "Unknown User",
                    firstName: post.attributes?.author?.data?.attributes?.firstName || "",
                    lastName: post.attributes?.author?.data?.attributes?.lastName || "",
                    profilePicture: null,
                    avatar: null,
                  },
                  likes: 0,
                  comments: 0,
                  isLiked: false,
                  createdAt: post.attributes?.createdAt || new Date().toISOString(),
                  updatedAt: post.attributes?.updatedAt || new Date().toISOString(),
                }
              })
              .filter((post) => post.id !== 0) || []

          setPosts(simplePosts)
        }
      }
    } catch (error) {
      console.error("Error fetching user posts:", error)
    } finally {
      setPostsLoading(false)
    }
  }

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
  }

  const handlePostDelete = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const getVerificationStatusIcon = () => {
    if (user?.isVerified) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (user?.verificationStep && user.verificationStep > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />
    }
    return <XCircle className="w-4 h-4 text-gray-400" />
  }

  const getVerificationStatusText = () => {
    if (user?.isVerified) {
      return "Verified"
    } else if (user?.verificationStep && user.verificationStep > 0) {
      return "Pending"
    }
    return "Unverified"
  }

  if (!user && !loading) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">User Profile</DialogTitle>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Loading profile...</div>
          </div>
        ) : user ? (
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={getUserAvatarUrl(user) || "/placeholder.png"} alt={user.username} />
                    <AvatarFallback className="text-2xl">
                      {user.firstName?.[0] || user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                    </h2>
                    <p className="text-gray-600">@{user.username}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    {getVerificationStatusIcon()}
                    <span className="text-sm font-medium">{getVerificationStatusText()}</span>
                  </div>
                </div>

                {user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{user.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {user.skills && user.skills.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Experience Section */}
            {user.experience && user.experience.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4">
                        <h4 className="font-semibold">{exp.position}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {exp.startDate} - {exp.endDate || "Present"}
                        </p>
                        {exp.description && <p className="text-sm text-gray-700 mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts Section */}
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-6">
                <PostFeed
                  posts={posts}
                  loading={postsLoading}
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={handlePostDelete}
                  currentUser={currentUser}
                />
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Contact Information</h3>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Email:</strong> {user.email}
                          </p>
                          {user.phone && (
                            <p>
                              <strong>Phone:</strong> {user.phone}
                            </p>
                          )}
                          {user.address && (
                            <p>
                              <strong>Address:</strong> {user.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {user.socialMedia && (
                        <div>
                          <h3 className="font-semibold mb-2">Social Media</h3>
                          <div className="space-y-2 text-sm">
                            {user.socialMedia.facebook && (
                              <p>
                                <strong>Facebook:</strong> {user.socialMedia.facebook}
                              </p>
                            )}
                            {user.socialMedia.twitter && (
                              <p>
                                <strong>Twitter:</strong> {user.socialMedia.twitter}
                              </p>
                            )}
                            {user.socialMedia.linkedin && (
                              <p>
                                <strong>LinkedIn:</strong> {user.socialMedia.linkedin}
                              </p>
                            )}
                            {user.socialMedia.instagram && (
                              <p>
                                <strong>Instagram:</strong> {user.socialMedia.instagram}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
