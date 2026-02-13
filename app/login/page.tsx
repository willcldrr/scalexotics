"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

const SESSION_TOKEN_KEY = 'scale_exotics_session_token'

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const message = searchParams.get("message")
  const showPasswordResetSuccess = message === "password_reset"

  // Clear any stale session token when visiting login page
  useEffect(() => {
    localStorage.removeItem(SESSION_TOKEN_KEY)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Clear any old session token before logging in
    localStorage.removeItem(SESSION_TOKEN_KEY)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Create a new session for this device
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const data = await response.json()
        if (data.session_token) {
          localStorage.setItem(SESSION_TOKEN_KEY, data.session_token)
        }
      } catch (e) {
        // Silently fail - session tracking is not critical
      }
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-12">
        <Link href="/">
          <Image
            src="https://imagedelivery.net/CVEJyzst_6io-ETn1V_PSw/3bdba65e-fb1a-4a3e-ff6f-1aa89b081f00/public"
            alt="Scale Exotics"
            width={180}
            height={48}
            className="h-12 w-auto mx-auto mb-8"
            priority
          />
        </Link>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome Back
        </h1>
        <p className="text-lg text-white/50">Sign in to your dashboard</p>
      </div>

      {showPasswordResetSuccess && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm mb-6">
          Your password has been reset successfully. Please sign in with your new password.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
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
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-white/60">Password</label>
            <Link href="/forgot-password" className="text-sm text-[#375DEE] hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
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
          className="w-full py-4 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center mt-8 text-white/50">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[#375DEE] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <Suspense fallback={<LoadingFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
