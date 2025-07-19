export interface User {
  id: number
  username: string
  email: string
  firstName?: string
  lastName?: string
  bio?: string
  phone?: string
  address?: string
  socialMedia?: {
    facebook?: string
    twitter?: string
    linkedin?: string
    instagram?: string
  }
  nid?: string
  nidStatus?: "pending" | "approved" | "rejected"
  nidImages?: {
    front?: { url: string }
    back?: { url: string }
  }
  profilePicture?: {
    url: string
  }
  identityType?: "nid" | "passport"
  identityImages?: {
    front?: { url: string }
    back?: { url: string }
  }
  skills?: string[]
  experience?: Array<{
    id: string
    company: string
    position: string
    startDate: string
    endDate?: string
    description?: string
  }>
  avatar?: {
    url: string
  }
  createdAt: string
  updatedAt: string
  isProfileCompleted?: boolean
  isVerified?: boolean
  verificationStep?: number
}

export interface VerificationData {
  identityType: "nid" | "passport"
  identityImages: {
    front: File | null
    back: File | null
  }
  phone: string
  address: string
}
