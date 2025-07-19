"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Upload, ArrowRight, ArrowLeft, CheckCircle, Phone, MapPin, FileText } from "lucide-react"
import type { User, VerificationData } from "@/types/user"

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onVerificationComplete: (user: User) => void
}

export default function VerificationModal({ isOpen, onClose, user, onVerificationComplete }: VerificationModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [verificationData, setVerificationData] = useState<VerificationData>({
    identityType: "nid",
    identityImages: {
      front: null,
      back: null,
    },
    phone: "",
    address: "",
  })

  const [imagePreviews, setImagePreviews] = useState({
    front: "",
    back: "",
  })

  const handleImageUpload = (side: "front" | "back", file: File) => {
    setVerificationData((prev) => ({
      ...prev,
      identityImages: {
        ...prev.identityImages,
        [side]: file,
      },
    }))

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreviews((prev) => ({
        ...prev,
        [side]: e.target?.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  const uploadImages = async (token: string) => {
    const formData = new FormData()

    if (verificationData.identityImages.front) {
      formData.append("files", verificationData.identityImages.front)
    }
    if (verificationData.identityImages.back) {
      formData.append("files", verificationData.identityImages.back)
    }

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
        return {
          front: data[0]?.id,
          back: data[1]?.id,
        }
      }
    } catch (error) {
      console.error("Image upload error:", error)
    }
    return null
  }

  const submitVerification = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      // Upload images first
      const imageIds = await uploadImages(token!)
      if (!imageIds) {
        setError("Failed to upload images")
        setLoading(false)
        return
      }

      // Submit verification data
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          identityType: verificationData.identityType,
          identityImages: imageIds,
          phone: verificationData.phone,
          address: verificationData.address,
          verificationStep: 3,
          isVerified: false, // Will be approved by admin
          nidStatus: "pending", // Set status to pending for admin review
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        onVerificationComplete(updatedUser)
      } else {
        const errorData = await response.json()
        setError(errorData.error?.message || "Verification submission failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    setError("")
    if (currentStep === 1) {
      // Validate images
      if (!verificationData.identityImages.front || !verificationData.identityImages.back) {
        setError("Please upload both front and back images")
        return
      }
    } else if (currentStep === 2) {
      // Validate phone
      if (!verificationData.phone) {
        setError("Please enter your phone number")
        return
      }
      // Basic phone validation
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(verificationData.phone.replace(/\s/g, ""))) {
        setError("Please enter a valid phone number")
        return
      }
    } else if (currentStep === 3) {
      // Validate address
      if (!verificationData.address.trim()) {
        setError("Please enter your complete address")
        return
      }
      if (verificationData.address.trim().length < 10) {
        setError("Please provide a more detailed address")
        return
      }
    }

    setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setError("")
    setCurrentStep((prev) => prev - 1)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-blue-600">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Identity Document Upload</span>
            </div>

            <div className="space-y-4">
              <Label>Select Identity Document Type</Label>
              <RadioGroup
                value={verificationData.identityType}
                onValueChange={(value: "nid" | "passport") =>
                  setVerificationData((prev) => ({ ...prev, identityType: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nid" id="nid" />
                  <Label htmlFor="nid">National ID (NID)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="passport" id="passport" />
                  <Label htmlFor="passport">Passport</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Front Image */}
              <div className="space-y-2">
                <Label>Front Side</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  {imagePreviews.front ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreviews.front || "/placeholder.svg"}
                        alt="Front side"
                        className="max-w-full h-32 object-cover mx-auto rounded border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("front-upload")?.click()}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500">Upload front side</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("front-upload")?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                  <input
                    id="front-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload("front", file)
                    }}
                  />
                </div>
              </div>

              {/* Back Image */}
              <div className="space-y-2">
                <Label>Back Side</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  {imagePreviews.back ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreviews.back || "/placeholder.svg"}
                        alt="Back side"
                        className="max-w-full h-32 object-cover mx-auto rounded border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("back-upload")?.click()}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500">Upload back side</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("back-upload")?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                  <input
                    id="back-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload("back", file)
                    }}
                  />
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Important:</strong> Please ensure the images are clear and all text is readable. Both sides of
                your {verificationData.identityType.toUpperCase()} are required for verification.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Phone className="w-5 h-5" />
              <span className="font-medium">Phone Number</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={verificationData.phone}
                  onChange={(e) => setVerificationData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="text-lg"
                />
                <p className="text-sm text-gray-500">Include country code (e.g., +1 for US, +44 for UK)</p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                This phone number will be used for account verification and important notifications. Make sure it's a
                number you actively use.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-blue-600">
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Address Information</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Complete Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your complete address including:&#10;• Street address&#10;• City&#10;• State/Province&#10;• Postal/ZIP code&#10;• Country"
                  value={verificationData.address}
                  onChange={(e) => setVerificationData((prev) => ({ ...prev, address: e.target.value }))}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500">
                  Provide your complete residential address. This will be used for verification purposes.
                </p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Important:</strong> This address cannot be changed after submission. Please ensure all details
                are accurate and complete.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-8 h-8" />
              <span className="text-xl font-semibold">Review Your Information</span>
            </div>

            <div className="space-y-4 text-left">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Identity Type</Label>
                      <p className="font-medium">{verificationData.identityType.toUpperCase()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                      <p className="font-medium">{verificationData.phone}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="font-medium whitespace-pre-line">{verificationData.address}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Uploaded Documents</Label>
                    <div className="flex gap-4 mt-2">
                      {imagePreviews.front && (
                        <div className="text-center">
                          <img
                            src={imagePreviews.front || "/placeholder.svg"}
                            alt="Front"
                            className="w-20 h-12 object-cover rounded border"
                          />
                          <p className="text-xs text-gray-500 mt-1">Front</p>
                        </div>
                      )}
                      {imagePreviews.back && (
                        <div className="text-center">
                          <img
                            src={imagePreviews.back || "/placeholder.svg"}
                            alt="Back"
                            className="w-20 h-12 object-cover rounded border"
                          />
                          <p className="text-xs text-gray-500 mt-1">Back</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Final Step:</strong> Once submitted, this information cannot be changed. Your account will be
                reviewed by our team and you'll be notified of the verification status.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Upload Identity Document"
      case 2:
        return "Phone Number"
      case 3:
        return "Address Information"
      case 4:
        return "Review & Submit"
      default:
        return "Verification"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Upload clear images of both sides of your ID"
      case 2:
        return "Provide your active phone number"
      case 3:
        return "Enter your complete residential address"
      case 4:
        return "Review your information before submitting"
      default:
        return "Complete the verification process"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Account Verification</DialogTitle>
          <DialogDescription className="text-base">
            Complete the verification process to unlock all features and secure your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`flex items-center ${step < 4 ? "flex-1" : ""}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    step <= currentStep
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-400 border-gray-300"
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-3 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"} rounded-full`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStepTitle()}
                <span className="text-sm font-normal text-gray-500">({currentStep} of 4)</span>
              </CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep} disabled={loading} className="flex items-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={submitVerification}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {loading ? "Submitting..." : "Submit Verification"}
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
