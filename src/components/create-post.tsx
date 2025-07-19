"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, Send, X } from "lucide-react"
import type { User } from "@/types/user"
import type { Post } from "@/types/post"
import { getUserAvatarUrl } from "@/lib/image-utils"
import { createPost, uploadImage } from "@/lib/strapi-api"

interface CreatePostProps {
  user: User
  onPostCreated: (post: Post) => void
}

export default function CreatePost({ user, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !image) return

    setLoading(true)
    setError("")

    try {
      let imageId: number | undefined

      // Upload image if present
      if (image) {
        imageId = await uploadImage(image)
        if (!imageId) {
          setError("Failed to upload image")
          setLoading(false)
          return
        }
      }

      // Create post
      const newPost = await createPost(content.trim(), user.id, imageId)

      if (newPost) {
        onPostCreated(newPost)
        setContent("")
        setImage(null)
        setImagePreview("")
      } else {
        setError("Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={getUserAvatarUrl(user) || "/placeholder.png"} />
              <AvatarFallback>{user.firstName?.[0] || user.username?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-none shadow-none focus-visible:ring-0 p-0 text-base"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">{content.length}/500</div>
            </div>
          </div>

          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview || "/placeholder.png"}
                alt="Preview"
                className="max-w-full h-64 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Photo
              </Button>
              <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            <Button type="submit" disabled={loading || (!content.trim() && !image)} size="sm">
              {loading ? "Posting..." : "Post"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
