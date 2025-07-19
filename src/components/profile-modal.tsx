"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import ProfilePage from "./profile-page"
import type { User } from "@/types/user"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onUserUpdate: (user: User) => void
}

export default function ProfileModal({ isOpen, onClose, user, onUserUpdate }: ProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Profile Settings</DialogTitle>
        <div className="p-6">
          <ProfilePage user={user} onLogout={() => {}} onUserUpdate={onUserUpdate} hideHeader />
        </div>
      </DialogContent>
    </Dialog>
  )
}
