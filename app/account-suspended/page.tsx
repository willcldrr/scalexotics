"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { ShieldX, Mail, LogOut, AlertTriangle } from "lucide-react"

export default function AccountSuspendedPage() {
  const [checking, setChecking] = useState(true)
  const [businessName, setBusinessName] = useState("")
  const [userEmail, setUserEmail] = useState("")
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
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

        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Account Suspended
        </h1>

        <p className="text-lg text-white/60 mb-8">
          Your account has been suspended. Please contact support if you believe this is an error.
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
              <span className="text-red-400 flex items-center gap-1">
                <ShieldX className="w-4 h-4" />
                Suspended
              </span>
            </div>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm text-red-400 font-medium">Why was my account suspended?</p>
              <p className="text-sm text-white/60 mt-1">
                Accounts may be suspended for violations of our terms of service, suspicious activity, or other policy concerns. Contact support for more information.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm text-blue-400 font-medium">Need help?</p>
              <p className="text-sm text-white/60 mt-1">
                Contact us at <a href="mailto:support@velocitylabs.ai" className="text-blue-400 hover:underline">support@velocitylabs.ai</a> to discuss your account status.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/40 mb-6">
          This page will automatically update if your account status changes.
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
