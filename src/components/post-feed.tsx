"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2, Edit, Send } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Post, Comment } from "@/types/post"
import type { User } from "@/types/user"
import { getUserAvatarUrl, getImageUrl } from "@/lib/image-utils"

interface PostFeedProps {
  posts: Post[]
  loading: boolean
  onPostUpdate: (post: Post) => void
  onPostDelete: (postId: number) => void
  currentUser: User
  onUserClick?: (userId: number) => void
}

export default function PostFeed({
  posts,
  loading,
  onPostUpdate,
  onPostDelete,
  currentUser,
  onUserClick,
}: PostFeedProps) {
  const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set())
  const [commentingPosts, setCommentingPosts] = useState<Set<number>>(new Set())
  const [showComments, setShowComments] = useState<Set<number>>(new Set())
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<number, string>>({})
  const [deletingPost, setDeletingPost] = useState<number | null>(null)

  const handleLike = async (postId: number) => {
    if (likingPosts.has(postId)) return

    setLikingPosts((prev) => new Set(prev).add(postId))

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Update the post in the list
        const updatedPost = posts.find((p) => p.id === postId)
        if (updatedPost) {
          const newPost = {
            ...updatedPost,
            likes: updatedPost.isLiked ? updatedPost.likes - 1 : updatedPost.likes + 1,
            isLiked: !updatedPost.isLiked,
          }
          onPostUpdate(newPost)
        }
      }
    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      setLikingPosts((prev) => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleDeletePost = async (postId: number) => {
    setDeletingPost(postId)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        onPostDelete(postId)
      } else {
        console.error("Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
    } finally {
      setDeletingPost(null)
    }
  }

  const fetchComments = async (postId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/comments?filters[post][id][$eq]=${postId}&populate=*&sort=createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        const transformedComments =
          data.data
            ?.map((comment: any) => ({
              id: comment.id || 0,
              content: comment.attributes?.content || "",
              author: {
                id: comment.attributes?.author?.data?.id || 0,
                username: comment.attributes?.author?.data?.attributes?.username || "Unknown User",
                firstName: comment.attributes?.author?.data?.attributes?.firstName || "",
                lastName: comment.attributes?.author?.data?.attributes?.lastName || "",
                profilePicture: comment.attributes?.author?.data?.attributes?.profilePicture?.data
                  ? {
                      url: comment.attributes.author.data.attributes.profilePicture.data.attributes?.url || "",
                    }
                  : null,
                avatar: comment.attributes?.author?.data?.attributes?.avatar?.data
                  ? {
                      url: comment.attributes.author.data.attributes.avatar.data.attributes?.url || "",
                    }
                  : null,
              },
              createdAt: comment.attributes?.createdAt || new Date().toISOString(),
            }))
            .filter((comment) => comment.id !== 0) || []

        setComments((prev) => ({ ...prev, [postId]: transformedComments }))
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleToggleComments = (postId: number) => {
    const isShowing = showComments.has(postId)

    if (isShowing) {
      setShowComments((prev) => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    } else {
      setShowComments((prev) => new Set(prev).add(postId))
      if (!comments[postId]) {
        fetchComments(postId)
      }
    }
  }

  const handleAddComment = async (postId: number) => {
    const content = newComment[postId]?.trim()
    if (!content || commentingPosts.has(postId)) return

    setCommentingPosts((prev) => new Set(prev).add(postId))

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            content,
            post: postId,
            author: currentUser.id,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newCommentObj: Comment = {
          id: data.data.id,
          content: data.data.attributes.content,
          author: {
            id: currentUser.id,
            username: currentUser.username,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            profilePicture: currentUser.profilePicture,
            avatar: currentUser.avatar,
          },
          createdAt: data.data.attributes.createdAt,
        }

        setComments((prev) => ({
          ...prev,
          [postId]: [newCommentObj, ...(prev[postId] || [])],
        }))

        setNewComment((prev) => ({ ...prev, [postId]: "" }))

        // Update comment count
        const updatedPost = posts.find((p) => p.id === postId)
        if (updatedPost) {
          onPostUpdate({ ...updatedPost, comments: updatedPost.comments + 1 })
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setCommentingPosts((prev) => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded" />
                <div className="w-20 h-3 bg-gray-200 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No posts yet. Be the first to share something!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-3">
              <Avatar
                className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                onClick={() => onUserClick?.(post.author.id)}
              >
                <AvatarImage src={getUserAvatarUrl(post.author) || "/placeholder.png"} alt={post.author.username} />
                <AvatarFallback>{post.author.firstName?.[0] || post.author.username?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p
                  className="font-semibold text-sm cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => onUserClick?.(post.author.id)}
                >
                  {post.author.firstName && post.author.lastName
                    ? `${post.author.firstName} ${post.author.lastName}`
                    : post.author.username}
                </p>
                <p className="text-xs text-gray-500">
                  @{post.author.username} • {formatTimeAgo(post.createdAt)}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {post.author.id === currentUser.id && (
                  <>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Post</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" onClick={() => {}}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletingPost === post.id}
                          >
                            {deletingPost === post.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                <DropdownMenuItem>
                  <Share className="w-4 h-4 mr-2" />
                  Share Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="space-y-4">
            {post.content && <p className="text-sm leading-relaxed">{post.content}</p>}

            {post.image && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(post.image) || "/placeholder.png"}
                  alt="Post image"
                  className="w-full max-h-96 object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${post.isLiked ? "text-red-500" : "text-gray-500"}`}
                  onClick={() => handleLike(post.id)}
                  disabled={likingPosts.has(post.id)}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
                  <span className="text-xs">{post.likes}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gray-500"
                  onClick={() => handleToggleComments(post.id)}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{post.comments}</span>
                </Button>

                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500">
                  <Share className="w-4 h-4" />
                  <span className="text-xs">Share</span>
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments.has(post.id) && (
              <div className="space-y-4 pt-4 border-t">
                {/* Add Comment */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={getUserAvatarUrl(currentUser) || "/placeholder.png"} />
                    <AvatarFallback className="text-xs">
                      {currentUser.firstName?.[0] || currentUser.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ""}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment(post.id)
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment[post.id]?.trim() || commentingPosts.has(post.id)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments[post.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar
                        className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        onClick={() => onUserClick?.(comment.author.id)}
                      >
                        <AvatarImage src={getUserAvatarUrl(comment.author) || "/placeholder.png"} />
                        <AvatarFallback className="text-xs">
                          {comment.author.firstName?.[0] || comment.author.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <p
                            className="font-semibold text-sm cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => onUserClick?.(comment.author.id)}
                          >
                            {comment.author.firstName && comment.author.lastName
                              ? `${comment.author.firstName} ${comment.author.lastName}`
                              : comment.author.username}
                          </p>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-3">{formatTimeAgo(comment.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
