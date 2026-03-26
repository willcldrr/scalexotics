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
    // Poll for approval every 3 seconds for instant feedback
    const interval = setInterval(checkApprovalStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const checkApprovalStatus = async () => {
    try {
      // Use API endpoint with service role to bypass RLS
      const response = await fetch("/api/business/status")

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        setChecking(false)
        return
      }

      const data = await response.json()

      if (!data.business) {
        // No business found, might need to complete signup
        setChecking(false)
        return
      }

      setUserEmail(data.email || "")
      setBusinessName(data.business.name)

      if (data.business.status === "active") {
        setApproved(true)
        // Redirect to dashboard after a short delay to show success message
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (err) {
      // Silent fail, will retry on next poll
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
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 ring-2 ring-white/20">
            <CheckCircle className="w-10 h-10 text-white" />
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
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/velocity.jpg"
            alt="Velocity Labs"
            width={64}
            height={64}
            className="h-16 w-auto mx-auto"
            priority
          />
        </Link>

        {/* Clock icon with gradient ring */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-white/5" />
          <div className="absolute inset-[2px] rounded-full bg-black flex items-center justify-center">
            <Clock className="w-10 h-10 text-white/80" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-display)' }}>
          Pending Approval
        </h1>

        <p className="text-lg text-white/50 mb-8">
          Your account is being reviewed by our team. You'll receive access once approved.
        </p>

        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8 text-left backdrop-blur-sm">
          <h2 className="font-semibold mb-4 text-white/90">Account Details</h2>
          <div className="space-y-3">
            {businessName && (
              <div className="flex justify-between">
                <span className="text-white/40">Business</span>
                <span className="text-white/80">{businessName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/40">Email</span>
              <span className="text-white/80">{userEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Status</span>
              <span className="text-white/70 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
                Pending Review
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/[0.06] to-transparent border border-white/10 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-white/70" />
            </div>
            <div className="text-left">
              <p className="text-sm text-white/80 font-medium">What happens next?</p>
              <p className="text-sm text-white/40 mt-1">
                Our team typically reviews accounts within 24 hours. You'll be notified by email once your account is approved.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/30 mb-6">
          This page will automatically update when your account is approved.
        </p>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 mx-auto text-white/40 hover:text-white/80 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
