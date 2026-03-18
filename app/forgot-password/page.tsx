"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/check-email?type=reset&email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/">
            <Image
              src="/velocity.jpg"
              alt="Velocity"
              width={80}
              height={80}
              className="h-16 w-16 mx-auto mb-8 rounded-xl object-contain"
            />
          </Link>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Reset Password
          </h1>
          <p className="text-lg text-white/50">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/20 text-white/70 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-lg font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center mt-8 text-white/50">
          Remember your password?{" "}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
