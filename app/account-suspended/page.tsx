"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { X, Mail, LogOut, AlertTriangle } from "lucide-react"

export default function AccountSuspendedPage() {
  const [checking, setChecking] = useState(true)
  const [businessName, setBusinessName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [showInfoModal, setShowInfoModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkStatus()
    // Poll for status changes every 10 seconds
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    setUserEmail(user.email || "")

    // Check business status
    const { data: business } = await supabase
      .from("businesses")
      .select("name, status")
      .eq("owner_user_id", user.id)
      .single()

    if (business) {
      setBusinessName(business.name)
      // If no longer suspended, redirect appropriately
      if (business.status === "active") {
        router.push("/dashboard")
        return
      } else if (business.status === "pending") {
        router.push("/pending-approval")
        return
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/velocity.jpg"
            alt="Velocity Labs"
            width={64}
            height={64}
            className="h-16 w-auto mx-auto opacity-50"
            priority
          />
        </Link>

        {/* Large red X icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/30 to-red-900/10 animate-pulse" />
          <div className="absolute inset-[3px] rounded-full bg-black flex items-center justify-center">
            <X className="w-16 h-16 text-red-500 stroke-[3]" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-3 text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Account Suspended
        </h1>

        <p className="text-lg text-white/50 mb-8">
          Your access has been revoked.
        </p>

        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-6 mb-6 text-left backdrop-blur-sm">
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
            <div className="flex justify-between items-center">
              <span className="text-white/40">Status</span>
              <span className="text-red-400 flex items-center gap-1.5 font-medium">
                <X className="w-4 h-4" />
                Suspended
              </span>
            </div>
          </div>
        </div>

        {/* Why suspended button */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="w-full bg-gradient-to-br from-white/[0.06] to-transparent border border-white/10 rounded-xl p-4 mb-6 hover:border-white/20 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-white/70" />
            </div>
            <div>
              <p className="text-sm text-white/80 font-medium">Why was my account suspended?</p>
              <p className="text-sm text-white/40">Tap to learn more</p>
            </div>
          </div>
        </button>

        {/* Contact support */}
        <div className="bg-gradient-to-br from-white/[0.06] to-transparent border border-white/10 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-white/70" />
            </div>
            <div className="text-left">
              <p className="text-sm text-white/80 font-medium">Need help?</p>
              <p className="text-sm text-white/40 mt-1">
                Contact us at <a href="mailto:support@velocitylabs.ai" className="text-white/60 hover:text-white underline">support@velocitylabs.ai</a>
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/30 mb-6">
          This page will automatically update if your account status changes.
        </p>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 mx-auto text-white/40 hover:text-white/80 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          />
          <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>

            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>

            <h3 className="text-xl font-bold text-center mb-2">Account Suspension</h3>

            <p className="text-white/60 text-center mb-6">
              Your account has been suspended by an administrator.
            </p>

            <div className="space-y-4 text-sm">
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <h4 className="font-medium text-white/90 mb-2">Common reasons for suspension:</h4>
                <ul className="space-y-2 text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Violation of terms of service
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Suspicious or fraudulent activity
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Non-payment or billing issues
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Policy violations or complaints
                  </li>
                </ul>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4">
                <h4 className="font-medium text-white/90 mb-2">What you can do:</h4>
                <p className="text-white/50">
                  If you believe this suspension was made in error, please contact our support team at{" "}
                  <a href="mailto:support@velocitylabs.ai" className="text-white/70 underline">
                    support@velocitylabs.ai
                  </a>{" "}
                  with your account details and we will review your case.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
