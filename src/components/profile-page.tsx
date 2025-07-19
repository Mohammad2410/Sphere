"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogOut, Save, Plus, Trash2, CheckCircle, Clock, XCircle, Shield } from "lucide-react"
import type { User as UserType } from "@/types/user"
import VerificationModal from "@/components/verification-modal"

interface ProfilePageProps {
  user: UserType
  onLogout: () => void
  onUserUpdate: (user: UserType) => void
  hideHeader?: boolean
}

export default function ProfilePage({ user, onLogout, onUserUpdate, hideHeader }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("")
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    socialMedia: {
      facebook: user.socialMedia?.facebook || "",
      twitter: user.socialMedia?.twitter || "",
      linkedin: user.socialMedia?.linkedin || "",
      instagram: user.socialMedia?.instagram || "",
    },
    skills: user.skills || [],
    experience: user.experience || [],
  })
  const [newSkill, setNewSkill] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Check if user can edit restricted fields (not verified yet)
  const canEditRestrictedFields = !user.isVerified

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePictureFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadProfilePicture = async (token: string): Promise<string | null> => {
    if (!profilePictureFile) return null

    const formData = new FormData()
    formData.append("files", profilePictureFile)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data[0]?.id
      }
    } catch (error) {
      console.error("Profile picture upload error:", error)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const token = localStorage.getItem("token")

      let profilePictureId = null
      if (profilePictureFile) {
        profilePictureId = await uploadProfilePicture(token!)
      }

      const updateData = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        socialMedia: formData.socialMedia,
        skills: formData.skills,
        experience: formData.experience,
        ...(profilePictureId && { profilePicture: profilePictureId }),
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        onUserUpdate(data)
        setIsEditing(false)
        setMessage("Profile updated successfully!")
        setProfilePictureFile(null)
        setProfilePicturePreview("")
      } else {
        const errorData = await response.json()
        setError(errorData.error?.message || "Update failed. Please try again.")
      }
    } catch (error) {
      console.error("Network error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name.startsWith("socialMedia.")) {
      const platform = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [platform]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
    }
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }))
  }

  const updateExperience = (id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)),
    }))
  }

  const removeExperience = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }))
  }

  const handleCancel = () => {
    setFormData({
      username: user.username || "",
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      bio: user.bio || "",
      socialMedia: {
        facebook: user.socialMedia?.facebook || "",
        twitter: user.socialMedia?.twitter || "",
        linkedin: user.socialMedia?.linkedin || "",
        instagram: user.socialMedia?.instagram || "",
      },
      skills: user.skills || [],
      experience: user.experience || [],
    })
    setIsEditing(false)
    setError("")
    setMessage("")
    setProfilePictureFile(null)
    setProfilePicturePreview("")
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
      return "Verification in Progress"
    }
    return "Not Verified"
  }

  const handleVerificationComplete = (updatedUser: UserType) => {
    onUserUpdate(updatedUser)
    setShowVerificationModal(false)
    setMessage("Verification submitted successfully! Your account will be reviewed.")
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {!hideHeader && (
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Profile</h1>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}

        {!user.isVerified && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your account is not verified. Complete the verification process to unlock all features.
              <Button variant="link" className="p-0 h-auto ml-2" onClick={() => setShowVerificationModal(true)}>
                Start Verification
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="relative">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage
                    src={profilePicturePreview || user.profilePicture?.url || user.avatar?.url || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    <User className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="mt-2">
                    <Label htmlFor="profilePicture" className="cursor-pointer">
                      <div className="text-xs text-blue-600 hover:text-blue-800">Change Profile Picture</div>
                    </Label>
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
              <CardTitle>
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
              </CardTitle>
              <CardDescription>@{user.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                {user.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {user.phone}
                    {user.phoneVerified && <CheckCircle className="w-3 h-3 text-green-500 inline ml-1" />}
                  </div>
                )}
                <div>
                  <span className="font-medium">Member since:</span> {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Verification:</span>
                  {getVerificationStatusIcon()}
                  <span className="text-xs">{getVerificationStatusText()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    {isEditing ? "Edit your profile information" : "View and manage your profile"}
                  </CardDescription>
                </div>
                {!isEditing && <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Verified Information (Read-only if verified) */}
                {user.isVerified && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Verified Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <div className="flex items-center gap-2">
                          <Input value={user.phone || ""} disabled />
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Identity Type</Label>
                        <Input value={user.identityType?.toUpperCase() || ""} disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea value={user.address || ""} disabled rows={2} />
                    </div>
                  </div>
                )}

                {/* Social Media */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Social Media Profiles</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="socialMedia.facebook">Facebook</Label>
                      <Input
                        id="socialMedia.facebook"
                        name="socialMedia.facebook"
                        value={formData.socialMedia.facebook}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="https://facebook.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="socialMedia.twitter">Twitter</Label>
                      <Input
                        id="socialMedia.twitter"
                        name="socialMedia.twitter"
                        value={formData.socialMedia.twitter}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="https://twitter.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="socialMedia.linkedin">LinkedIn</Label>
                      <Input
                        id="socialMedia.linkedin"
                        name="socialMedia.linkedin"
                        value={formData.socialMedia.linkedin}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="socialMedia.instagram">Instagram</Label>
                      <Input
                        id="socialMedia.instagram"
                        name="socialMedia.instagram"
                        value={formData.socialMedia.instagram}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                      >
                        {skill}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Experience</h3>
                    {isEditing && (
                      <Button type="button" onClick={addExperience} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    )}
                  </div>

                  {formData.experience.map((exp, index) => (
                    <Card key={exp.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="grid gap-3 md:grid-cols-2 flex-1">
                            <div className="space-y-2">
                              <Label>Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                disabled={!isEditing}
                                placeholder="Company name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Position</Label>
                              <Input
                                value={exp.position}
                                onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                                disabled={!isEditing}
                                placeholder="Job title"
                              />
                            </div>
                          </div>
                          {isEditing && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeExperience(exp.id)}
                              className="ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                              type="date"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date (Leave empty if current)</Label>
                            <Input
                              type="date"
                              value={exp.endDate || ""}
                              onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={exp.description || ""}
                            onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                            disabled={!isEditing}
                            placeholder="Describe your role and achievements"
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Verification Modal */}
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          user={user}
          onVerificationComplete={handleVerificationComplete}
        />
      </div>
    </div>
  )
}
