"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    })

    if (signUpError) {
      console.error("Signup error details:", {
        message: signUpError.message,
        status: signUpError.status,
        name: signUpError.name,
        cause: signUpError.cause,
      })
      setError(`${signUpError.message}${signUpError.status ? ` (Status: ${signUpError.status})` : ""}`)
      setLoading(false)
      return
    }

    if (data.user) {
      // Profile is automatically created by database trigger
      // Redirect to check-email page for email verification
      router.push(`/check-email?type=signup&email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/">
            <img
              src="https://imagedelivery.net/CVEJyzst_6io-ETn1V_PSw/3bdba65e-fb1a-4a3e-ff6f-1aa89b081f00/public"
              alt="Scale Exotics"
              className="h-12 w-auto mx-auto mb-8"
            />
          </Link>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Get Started
          </h1>
          <p className="text-lg text-white/50">Create your dashboard account</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">Full Name</label>
            <input
              type="text"
              placeholder="John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Company Name</label>
            <input
              type="text"
              placeholder="Exotic Rentals LLC"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Password</label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
            />
            <p className="text-xs text-white/40 mt-2">Minimum 6 characters</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-8 text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-[#375DEE] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
