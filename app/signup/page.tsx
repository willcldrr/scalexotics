"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Sign up the user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    })

    if (signUpError) {
      console.error("Signup error:", signUpError)
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Create a business record with pending status
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      const { error: businessError } = await supabase.from("businesses").insert({
        name: companyName,
        slug: slug + "-" + Date.now().toString(36), // Ensure unique slug
        owner_user_id: data.user.id,
        email: email,
        phone: phone || null,
        status: "pending", // Pending approval
        domain_status: "pending",
      })

      if (businessError) {
        console.error("Business creation error:", businessError)
        // Don't fail signup, just log it - admin can fix later
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
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Link href="/">
            <Image
              src="/velocity.jpg"
              alt="Velocity Labs"
              width={64}
              height={64}
              className="h-16 w-auto mx-auto mb-8"
              priority
            />
          </Link>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Get Started
          </h1>
          <p className="text-lg text-white/50">Create your business account</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">Your Name</label>
            <input
              type="text"
              placeholder="John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Business Name</label>
            <input
              type="text"
              placeholder="Exotic Rentals LLC"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
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
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
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
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
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
            className="w-full py-4 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-lg font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-8 text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-white/70 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
