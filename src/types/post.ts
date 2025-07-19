export interface Post {
    id: number
    content: string
    image?: {
      url: string
    }
    author: {
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
    }
    likes: number
    comments: number
    isLiked: boolean
    createdAt: string
    updatedAt: string
  }
  
  export interface Comment {
    id: number
    content: string
    author: {
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
    }
    createdAt: string
  }
  
  export interface PostReaction {
    id: number
    type: "like" | "love" | "laugh" | "angry" | "sad"
    user: {
      id: number
      username: string
    }
  }
  