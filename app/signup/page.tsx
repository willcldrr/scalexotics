"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Loader2 } from "lucide-react"

// Phone validation - E.164 format or common US formats
const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/(?!^\+)[^\d]/g, '')
  // E.164 format: +[country code][number] - 8 to 15 digits total after +
  // Or US format: 10-11 digits
  const e164Regex = /^\+?[1-9]\d{7,14}$/
  return e164Regex.test(cleaned)
}

const formatPhoneForDisplay = (phone: string): string => {
  // Remove non-digits except leading +
  const cleaned = phone.replace(/(?!^\+)[^\d]/g, '')

  // If it starts with +1 (US/Canada), format as (XXX) XXX-XXXX
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`
  }
  // If it's 10 digits (US without country code), format as (XXX) XXX-XXXX
  if (/^\d{10}$/.test(cleaned)) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

type Step = 'credentials' | 'verify' | 'business'

export default function SignUpPage() {
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Step 1: Handle credentials submission and send OTP
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setPhoneError("")

    // Validate phone format
    if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid phone number (e.g., +1 555-123-4567)")
      setLoading(false)
      return
    }

    // Sign up the user - this will send a verification email with OTP
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone.replace(/(?!^\+)[^\d]/g, ''), // Store cleaned phone
        },
      },
    })

    // Handle "User already registered" - resend OTP if unconfirmed
    if (signUpError?.message?.includes("already registered")) {
      // Try to resend verification email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (resendError) {
        // User might be confirmed already - direct them to login
        setError("This email is already registered. Please sign in instead.")
        setLoading(false)
        return
      }

      // OTP resent successfully
      setStep('verify')
      setLoading(false)
      return
    }

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Check if user was created but needs confirmation
    if (data?.user && !data.user.confirmed_at) {
      setStep('verify')
      setLoading(false)
      return
    }

    // If user is already confirmed (shouldn't happen normally)
    if (data?.user?.confirmed_at) {
      setError("This email is already registered. Please sign in instead.")
      setLoading(false)
      return
    }

    // Move to OTP verification step
    setStep('verify')
    setLoading(false)
  }

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otpCode]
    newOtp[index] = value.slice(-1) // Only take last digit
    setOtpCode(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otpCode]
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtpCode(newOtp)
    // Focus the last filled input or the next empty one
    const focusIndex = Math.min(pastedData.length, 5)
    otpInputRefs.current[focusIndex]?.focus()
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const token = otpCode.join('')
    if (token.length !== 6) {
      setError("Please enter the complete 6-digit code")
      setLoading(false)
      return
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }

    // Move to business name step
    setStep('business')
    setLoading(false)
  }

  // Resend OTP
  const handleResendOtp = async () => {
    setResending(true)
    setError("")

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (resendError) {
      setError(resendError.message)
    } else {
      setError("") // Clear any errors
      setOtpCode(["", "", "", "", "", ""]) // Clear OTP inputs
    }
    setResending(false)
  }

  // Step 3: Complete signup with business name
  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Get the current user (should be verified now)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Session expired. Please start over.")
      setLoading(false)
      return
    }

    // Create business using server-side API
    try {
      const businessResponse = await fetch('/api/signup/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          companyName,
          fullName,
          email,
          phone: phone.replace(/(?!^\+)[^\d]/g, '') || null,
        }),
      })

      if (!businessResponse.ok) {
        const errorData = await businessResponse.json()
        setError(errorData.error || "Failed to create business")
        setLoading(false)
        return
      }
    } catch (e) {
      setError("Failed to create business. Please try again.")
      setLoading(false)
      return
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

  // Step indicators
  const steps = [
    { key: 'credentials', label: 'Account' },
    { key: 'verify', label: 'Verify' },
    { key: 'business', label: 'Business' },
  ]
  const currentStepIndex = steps.findIndex(s => s.key === step)

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/velocity.jpg"
              alt="Velocity Labs"
              width={64}
              height={64}
              className="h-16 w-auto mx-auto mb-6"
              priority
            />
          </Link>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            {step === 'credentials' && 'Get Started'}
            {step === 'verify' && 'Verify Email'}
            {step === 'business' && 'Almost Done'}
          </h1>
          <p className="text-lg text-white/50">
            {step === 'credentials' && 'Create your business account'}
            {step === 'verify' && `Enter the code sent to ${email}`}
            {step === 'business' && 'Tell us about your business'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                i < currentStepIndex ? 'bg-green-500 text-white' :
                i === currentStepIndex ? 'bg-white text-black' :
                'bg-white/10 text-white/40'
              }`}>
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-green-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
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
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setPhoneError("")
                }}
                required
                className={`w-full px-5 py-4 rounded-xl bg-white/5 border text-white text-lg placeholder:text-white/30 focus:outline-none focus:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all ${
                  phoneError ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/20 focus:border-white/50'
                }`}
              />
              {phoneError && (
                <p className="text-xs text-red-400 mt-2">{phoneError}</p>
              )}
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
              className="w-full py-4 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-lg font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending verification code...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm text-white/60 mb-4 text-center">Enter the 6-digit code from your email</label>
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el }}
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
              disabled={loading || otpCode.join('').length !== 6}
              className="w-full py-4 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-lg font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials')
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
                {resending ? 'Sending...' : "Didn't get the code? Resend"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Business Name */}
        {step === 'business' && (
          <form onSubmit={handleBusinessSubmit} className="space-y-5">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm mb-2">
              Email verified successfully!
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Business Name</label>
              <input
                type="text"
                placeholder="Exotic Rentals LLC"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                autoFocus
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
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          </form>
        )}

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
