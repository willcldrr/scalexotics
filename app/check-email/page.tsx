"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Mail, CheckCircle, Loader2 } from "lucide-react"

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "signup"
  const email = searchParams.get("email") || ""
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const supabase = createClient()

  const isSignup = type === "signup"

  const handleResend = async () => {
    if (!email) return

    setResending(true)

    if (!isSignup) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
    } else {
      await supabase.auth.resend({
        type: "signup",
        email,
      })
    }

    setResending(false)
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  return (
    <div className="w-full max-w-md text-center">
      <Link href="/">
        <img
          src="https://imagedelivery.net/CVEJyzst_6io-ETn1V_PSw/3bdba65e-fb1a-4a3e-ff6f-1aa89b081f00/public"
          alt="Scale Exotics"
          className="h-12 w-auto mx-auto mb-8"
        />
      </Link>

      <div className="w-20 h-20 rounded-full bg-[#375DEE]/20 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-10 h-10 text-[#375DEE]" />
      </div>

      <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        Check Your Email
      </h1>

      <p className="text-lg text-white/50 mb-2">
        {isSignup
          ? "We've sent you a verification link."
          : "We've sent you a password reset link."}
      </p>

      {email && (
        <p className="text-white/70 mb-8">
          Sent to <span className="text-white font-medium">{email}</span>
        </p>
      )}

      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8 text-left">
        <p className="text-white/70 text-sm mb-4">
          {isSignup
            ? "Click the link in your email to verify your account and continue setting up your dashboard."
            : "Click the link in your email to reset your password."}
        </p>
        <ul className="text-white/50 text-sm space-y-2">
          <li>• Check your spam folder if you don't see it</li>
          <li>• The link will expire in 24 hours</li>
          <li>• Make sure you clicked the most recent email</li>
        </ul>
      </div>

      {email && (
        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="text-[#375DEE] hover:underline disabled:opacity-50 disabled:no-underline flex items-center justify-center gap-2 mx-auto"
        >
          {resent ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Email sent!
            </>
          ) : resending ? (
            "Sending..."
          ) : (
            "Resend email"
          )}
        </button>
      )}

      <p className="text-white/40 text-sm mt-8">
        Wrong email?{" "}
        <Link href={isSignup ? "/signup" : "/forgot-password"} className="text-[#375DEE] hover:underline">
          {isSignup ? "Sign up again" : "Try again"}
        </Link>
      </p>

      <p className="text-white/40 text-sm mt-4">
        <Link href="/login" className="text-[#375DEE] hover:underline">
          Back to sign in
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

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <Suspense fallback={<LoadingFallback />}>
        <CheckEmailContent />
      </Suspense>
    </div>
  )
}
