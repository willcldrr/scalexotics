"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function SetupBusinessPage() {
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const router = useRouter()
  const supabase = createClient()

  // Check if user is authenticated and doesn't already have a business
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not logged in, redirect to login
        router.push('/login')
        return
      }

      setUserEmail(user.email || "")
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || "")

      // Check if user already has a business
      const { data: business } = await supabase
        .from('businesses')
        .select('id, status')
        .eq('owner_user_id', user.id)
        .single()

      if (business) {
        // Already has a business, redirect appropriately
        if (business.status === 'active') {
          router.push('/dashboard')
        } else {
          router.push('/pending-approval')
        }
        return
      }

      setCheckingAuth(false)
    }

    checkAuth()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Session expired. Please sign in again.")
      setLoading(false)
      return
    }

    // Create business using server-side API
    try {
      const businessResponse = await fetch('/api/signup/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          companyName,
          fullName: userName || user.user_metadata?.name || "Google User",
          email: user.email,
          phone: null, // Google users don't require phone
        }),
      })

      if (!businessResponse.ok) {
        const errorData = await businessResponse.json()
        setError(errorData.error || "Failed to create business")
        setLoading(false)
        return
      }
    } catch (e) {
      setError("Failed to create business. Please try again.")
      setLoading(false)
      return
    }

    // Record the session
    try {
      await fetch('/api/sessions', { method: 'POST' })
    } catch (e) {
      // Silently fail - session tracking is not critical
    }

    // Redirect to pending approval page
    router.push('/pending-approval')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/velocity.jpg"
              alt="Velocity Labs"
              width={64}
              height={64}
              className="h-16 w-auto mx-auto mb-6"
              priority
            />
          </Link>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome!
          </h1>
          <p className="text-lg text-white/50">
            One more step to set up your account
          </p>
        </div>

        {userEmail && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
            <p className="text-sm text-white/60">Signed in as</p>
            <p className="text-white font-medium">{userEmail}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">Business Name</label>
            <input
              type="text"
              placeholder="Exotic Rentals LLC"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoFocus
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-lg font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
