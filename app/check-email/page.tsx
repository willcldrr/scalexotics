"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
        <Image
          src="/velocity.jpg"
          alt="Velocity"
          width={128}
          height={128}
          className="h-32 w-auto mx-auto mb-8 rounded-xl"
        />
      </Link>

      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
        <Mail className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
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
          className="text-white hover:underline disabled:opacity-50 disabled:no-underline flex items-center justify-center gap-2 mx-auto"
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
        <Link href={isSignup ? "/signup" : "/forgot-password"} className="text-white hover:underline">
          {isSignup ? "Sign up again" : "Try again"}
        </Link>
      </p>

      <p className="text-white/40 text-sm mt-4">
        <Link href="/login" className="text-white hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
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
