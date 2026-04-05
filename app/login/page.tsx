"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

const SESSION_TOKEN_KEY = 'velocity_labs_session_token'

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const message = searchParams.get("message")
  const showPasswordResetSuccess = message === "password_reset"

  // Clear any stale session token when visiting login page
  useEffect(() => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
  }, [])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // If no error, the browser will redirect to Google
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Clear any old session token before logging in
    sessionStorage.removeItem(SESSION_TOKEN_KEY)

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
          sessionStorage.setItem(SESSION_TOKEN_KEY, data.session_token)
        }
      } catch (e) {
        // Silently fail - session tracking is not critical
      }

      // Check user status via server API (bypasses RLS issues)
      try {
        const statusResponse = await fetch('/api/auth/status')
        const status = await statusResponse.json()

        if (status.canAccessDashboard) {
          router.push("/dashboard")
          router.refresh()
          return
        } else if (status.authenticated) {
          // User is authenticated but doesn't have access yet
          router.push("/pending-approval")
          return
        }
      } catch (e) {
        console.error("Status check error:", e)
      }

      // Fallback to dashboard (middleware will handle redirect if needed)
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-12">
        <Link href="/">
          <Image
            src="/velocity.jpg"
            alt="Velocity Labs"
            width={128}
            height={128}
            className="h-32 w-auto mx-auto mb-8 rounded-xl"
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

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full py-4 mb-6 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-medium rounded-xl border border-white/20 transition-all flex items-center justify-center gap-3"
      >
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-black text-white/40">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm text-white/60 mb-2">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-white/60">Password</label>
            <Link href="/forgot-password" className="text-sm text-white/70 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
          disabled={loading || googleLoading}
          className="w-full py-4 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-lg font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center mt-8 text-white/50">
        Don't have an account?{" "}
        <Link href="/signup" className="text-white/70 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
          Sign up
        </Link>
      </p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
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
