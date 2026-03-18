"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Sign out after password reset so they log in fresh
      await supabase.auth.signOut()
      router.push("/login?message=password_reset")
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
              width={128}
              height={128}
              className="h-32 w-auto mx-auto mb-8 rounded-xl"
            />
          </Link>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Set New Password
          </h1>
          <p className="text-lg text-white/50">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors"
            />
            <p className="text-xs text-white/40 mt-2">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="text-center mt-8 text-white/50">
          <Link href="/login" className="text-white hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
