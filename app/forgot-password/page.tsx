"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2 } from "lucide-react"

type Step = "email" | "verify" | "password"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  // Step 1: Send reset code
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || "Something went wrong")
        setLoading(false)
        return
      }

      setStep("verify")
      setLoading(false)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otpCode]
    newOtp[index] = value.slice(-1)
    setOtpCode(newOtp)
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = [...otpCode]
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtpCode(newOtp)
    const focusIndex = Math.min(pastedData.length, 5)
    otpInputRefs.current[focusIndex]?.focus()
  }

  // Step 2: Verify code → move to password step
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = otpCode.join("")
    if (token.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }
    setError("")
    setStep("password")
  }

  // Resend code
  const handleResendOtp = async () => {
    setResending(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || "Failed to resend code")
      } else {
        setOtpCode(["", "", "", "", "", ""])
      }
    } catch {
      setError("Failed to resend code. Please try again.")
    }
    setResending(false)
  }

  // Step 3: Submit new password with OTP
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: otpCode.join(""),
          password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || "Something went wrong")
        setLoading(false)
        return
      }

      router.push("/login?message=password_reset")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  const steps = [
    { key: "email", label: "Email" },
    { key: "verify", label: "Verify" },
    { key: "password", label: "Reset" },
  ]
  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/velocity.jpg"
              alt="Velocity"
              width={80}
              height={80}
              className="h-16 w-16 mx-auto mb-8 rounded-xl object-contain"
            />
          </Link>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
            {step === "email" && "Reset Password"}
            {step === "verify" && "Check Your Email"}
            {step === "password" && "New Password"}
          </h1>
          <p className="text-lg text-white/50">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "verify" && `Enter the code sent to ${email}`}
            {step === "password" && "Enter your new password"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i < currentStepIndex
                    ? "bg-green-500 text-white"
                    : i === currentStepIndex
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {i < currentStepIndex ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < currentStepIndex ? "bg-green-500" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
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

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-lg font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Send Reset Code"
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm text-white/60 mb-4 text-center">
                Enter the 6-digit code from your email
              </label>
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={otpCode.join("").length !== 6}
              className="w-full py-4 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-lg font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Continue
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("email")
                  setError("")
                  setOtpCode(["", "", "", "", "", ""])
                }}
                className="text-white/50 hover:text-white flex items-center gap-1 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-white/50 hover:text-white transition-all disabled:opacity-50"
              >
                {resending ? "Sending..." : "Didn't get the code? Resend"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-2">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all"
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
              style={{ fontFamily: "var(--font-display)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("verify")
                setError("")
              }}
              className="w-full text-center text-white/50 hover:text-white text-sm flex items-center justify-center gap-1 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to code
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-white/50">
          Remember your password?{" "}
          <Link href="/login" className="text-white/70 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
