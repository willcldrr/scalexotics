"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Clock, CheckCircle, Mail, LogOut } from "lucide-react"

export default function PendingApprovalPage() {
  const [checking, setChecking] = useState(true)
  const [approved, setApproved] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkApprovalStatus()
    // Poll for approval every 10 seconds
    const interval = setInterval(checkApprovalStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const checkApprovalStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    setUserEmail(user.email || "")

    // Check if user has an approved business
    const { data: business } = await supabase
      .from("businesses")
      .select("name, status")
      .eq("owner_user_id", user.id)
      .single()

    if (business) {
      setBusinessName(business.name)
      if (business.status === "active") {
        setApproved(true)
        // Redirect to dashboard after a short delay to show success message
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    }

    setChecking(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    )
  }

  if (approved) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            You're Approved!
          </h1>
          <p className="text-white/60 mb-6">
            Your account has been approved. Redirecting to your dashboard...
          </p>
          <div className="animate-pulse text-white/40">
            Loading dashboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/velocitylogo.png"
            alt="Velocity Labs"
            width={64}
            height={64}
            className="h-16 w-auto mx-auto"
            priority
          />
        </Link>

        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-400" />
        </div>

        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Pending Approval
        </h1>

        <p className="text-lg text-white/60 mb-8">
          Your account is being reviewed by our team. You'll receive access once approved.
        </p>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-semibold mb-4">Account Details</h2>
          <div className="space-y-3">
            {businessName && (
              <div className="flex justify-between">
                <span className="text-white/50">Business</span>
                <span>{businessName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/50">Email</span>
              <span>{userEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Status</span>
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Pending Review
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm text-blue-400 font-medium">What happens next?</p>
              <p className="text-sm text-white/60 mt-1">
                Our team typically reviews accounts within 24 hours. You'll be notified by email once your account is approved.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/40 mb-6">
          This page will automatically update when your account is approved.
        </p>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 mx-auto text-white/50 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
