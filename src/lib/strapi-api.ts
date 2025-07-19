// Clean Strapi v5 API functions for fetching posts and comments

interface StrapiResponse<T> {
    data: T
    meta?: any
  }
  
  interface StrapiPost {
    id: number
    documentId: string
    content: string
    likes: number
    comments: number
    isLiked: boolean
    createdAt: string
    updatedAt: string
    publishedAt: string
    author: {
      id: number
      documentId: string
      username: string
      firstName?: string
      lastName?: string
      email: string
      profilePicture?: {
        id: number
        documentId: string
        url: string
        name: string
        alternativeText?: string
      }
      avatar?: {
        id: number
        documentId: string
        url: string
        name: string
        alternativeText?: string
      }
    }
    image?: {
      id: number
      documentId: string
      url: string
      name: string
      alternativeText?: string
    }
  }
  
  interface StrapiComment {
    id: number
    documentId: string
    content: string
    createdAt: string
    updatedAt: string
    publishedAt: string
    author: {
      id: number
      documentId: string
      username: string
      firstName?: string
      lastName?: string
      profilePicture?: {
        id: number
        documentId: string
        url: string
        name: string
        alternativeText?: string
      }
      avatar?: {
        id: number
        documentId: string
        url: string
        name: string
        alternativeText?: string
      }
    }
    post: {
      id: number
      documentId: string
    }
  }
  
  interface Post {
    id: number
    content: string
    image: { url: string } | null
    author: {
      id: number
      username: string
      firstName: string
      lastName: string
      profilePicture: { url: string } | null
      avatar: { url: string } | null
    }
    likes: number
    comments: number
    isLiked: boolean
    createdAt: string
    updatedAt: string
  }
  
  interface Comment {
    id: number
    content: string
    author: {
      id: number
      username: string
      firstName: string
      lastName: string
      profilePicture: { url: string } | null
      avatar: { url: string } | null
    }
    createdAt: string
  }
  
  // Helper function to construct full image URL
  function getFullImageUrl(relativeUrl: string): string {
    if (!relativeUrl) return ""
    if (relativeUrl.startsWith("http")) return relativeUrl
    return `${process.env.NEXT_PUBLIC_STRAPI_URL}${relativeUrl}`
  }
  
  // Transform Strapi v5 post data to our Post interface
  function transformStrapiPost(strapiPost: StrapiPost): Post {
    return {
      id: strapiPost.id,
      content: strapiPost.content || "",
      image: strapiPost.image
        ? {
            url: getFullImageUrl(strapiPost.image.url),
          }
        : null,
      author: {
        id: strapiPost.author.id,
        username: strapiPost.author.username,
        firstName: strapiPost.author.firstName || "",
        lastName: strapiPost.author.lastName || "",
        profilePicture: strapiPost.author.profilePicture
          ? {
              url: getFullImageUrl(strapiPost.author.profilePicture.url),
            }
          : null,
        avatar: strapiPost.author.avatar
          ? {
              url: getFullImageUrl(strapiPost.author.avatar.url),
            }
          : null,
      },
      likes: strapiPost.likes || 0,
      comments: strapiPost.comments || 0,
      isLiked: strapiPost.isLiked || false,
      createdAt: strapiPost.createdAt,
      updatedAt: strapiPost.updatedAt,
    }
  }
  
  // Transform Strapi v5 comment data to our Comment interface
  function transformStrapiComment(strapiComment: StrapiComment): Comment {
    return {
      id: strapiComment.id,
      content: strapiComment.content || "",
      author: {
        id: strapiComment.author.id,
        username: strapiComment.author.username,
        firstName: strapiComment.author.firstName || "",
        lastName: strapiComment.author.lastName || "",
        profilePicture: strapiComment.author.profilePicture
          ? {
              url: getFullImageUrl(strapiComment.author.profilePicture.url),
            }
          : null,
        avatar: strapiComment.author.avatar
          ? {
              url: getFullImageUrl(strapiComment.author.avatar.url),
            }
          : null,
      },
      createdAt: strapiComment.createdAt,
    }
  }
  
  // Fetch all posts with proper population for Strapi v5
  export async function fetchPosts(): Promise<Post[]> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }
  
      // Strapi v5 populate syntax
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts?populate[author][populate]=profilePicture,avatar&populate=image&sort=createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
  
      if (!response.ok) {
        // Try simpler query if complex populate fails
        const simpleResponse = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts?populate=*&sort=createdAt:desc`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )
  
        if (!simpleResponse.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
  
        const simpleData: StrapiResponse<StrapiPost[]> = await simpleResponse.json()
  
        if (!simpleData.data || !Array.isArray(simpleData.data)) {
          console.warn("No posts data received from API")
          return []
        }
  
        return simpleData.data.map(transformStrapiPost)
      }
  
      const data: StrapiResponse<StrapiPost[]> = await response.json()
  
      if (!data.data || !Array.isArray(data.data)) {
        console.warn("No posts data received from API")
        return []
      }
  
      return data.data.map(transformStrapiPost)
    } catch (error) {
      console.error("Error fetching posts:", error)
  
      // Final fallback - try the most basic query
      try {
        const token = localStorage.getItem("token")
        const basicResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
  
        if (basicResponse.ok) {
          const basicData: StrapiResponse<StrapiPost[]> = await basicResponse.json()
          return basicData.data?.map(transformStrapiPost) || []
        }
      } catch (fallbackError) {
        console.error("Fallback fetch also failed:", fallbackError)
      }
  
      return []
    }
  }
  
  // Fetch comments for a specific post
  export async function fetchComments(postId: number): Promise<Comment[]> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }
  
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/comments?filters[post][id][$eq]=${postId}&populate[author][populate]=profilePicture,avatar&sort=createdAt:desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const data: StrapiResponse<StrapiComment[]> = await response.json()
  
      if (!data.data || !Array.isArray(data.data)) {
        return []
      }
  
      return data.data.map(transformStrapiComment)
    } catch (error) {
      console.error("Error fetching comments:", error)
      return []
    }
  }
  
  // Create a new post
  export async function createPost(content: string, authorId: number, imageId?: number): Promise<Post | null> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }
  
      const postData = {
        data: {
          content,
          author: authorId,
          likes: 0,
          comments: 0,
          isLiked: false,
          ...(imageId && { image: imageId }),
        },
      }
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const data: StrapiResponse<StrapiPost> = await response.json()
  
      // Fetch the complete post with populated data
      const completePostResponse = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/posts/${data.data.id}?populate[author][populate]=profilePicture,avatar&populate=image`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
  
      if (completePostResponse.ok) {
        const completeData: StrapiResponse<StrapiPost> = await completePostResponse.json()
        return transformStrapiPost(completeData.data)
      }
  
      return transformStrapiPost(data.data)
    } catch (error) {
      console.error("Error creating post:", error)
      return null
    }
  }
  
  // Create a new comment
  export async function createComment(content: string, postId: number, authorId: number): Promise<Comment | null> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }
  
      const commentData = {
        data: {
          content,
          post: postId,
          author: authorId,
        },
      }
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentData),
      })
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const data: StrapiResponse<StrapiComment> = await response.json()
  
      // Fetch the complete comment with populated data
      const completeCommentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/comments/${data.data.id}?populate[author][populate]=profilePicture,avatar`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
  
      if (completeCommentResponse.ok) {
        const completeData: StrapiResponse<StrapiComment> = await completeCommentResponse.json()
        return transformStrapiComment(completeData.data)
      }
  
      return transformStrapiComment(data.data)
    } catch (error) {
      console.error("Error creating comment:", error)
      return null
    }
  }
  
  // Upload image to Strapi
  export async function uploadImage(file: File): Promise<number | null> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }
  
      const formData = new FormData()
      formData.append("files", file)
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const data = await response.json()
      return data[0]?.id || null
    } catch (error) {
      console.error("Error uploading image:", error)
      return null
    }
  }
  