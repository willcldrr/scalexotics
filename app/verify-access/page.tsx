"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Shield, Loader2, AlertCircle, CheckCircle } from "lucide-react"

export default function VerifyAccessPage() {
  const router = useRouter()
  const supabase = createClient()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Check if user already has access
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_verified")
      .eq("id", user.id)
      .single()

    if (profile?.access_verified) {
      router.push("/dashboard")
      return
    }

    setChecking(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("Please log in first")
      setLoading(false)
      return
    }

    // Verify the code via API
    const response = await fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase(), userId: user.id }),
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || "Invalid access code")
      setLoading(false)
      return
    }

    // Update profile to mark access as verified
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ access_verified: true })
      .eq("id", user.id)

    if (updateError) {
      setError("Failed to verify access. Please try again.")
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://imagedelivery.net/CVEJyzst_6io-ETn1V_PSw/3bdba65e-fb1a-4a3e-ff6f-1aa89b081f00/public"
            alt="Scale Exotics"
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Enter Access Code
          </h1>
          <p className="text-white/50 mt-2">
            Enter the access code provided to you to activate your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#375DEE]/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#375DEE]" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 mb-6">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Access verified! Redirecting to dashboard...</span>
              </div>
            )}

            <div>
              <label className="block text-sm text-white/60 mb-2">Access Code</label>
              <input
                type="text"
                placeholder="Enter your code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl font-mono tracking-widest placeholder:text-white/30 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-[#375DEE] transition-colors"
                maxLength={20}
                autoFocus
                disabled={loading || success}
              />
            </div>

            <button
              type="submit"
              disabled={!code.trim() || loading || success}
              className="w-full mt-6 py-4 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verified!
                </>
              ) : (
                "Verify Access"
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Don't have an access code?{" "}
          <a href="mailto:support@scalexotics.com" className="text-[#375DEE] hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  )
}
