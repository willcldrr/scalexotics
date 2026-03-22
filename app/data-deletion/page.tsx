"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Trash2, CheckCircle, AlertCircle, Loader2, Shield, Instagram, Database, MessageSquare, Users, Lock, ChevronUp } from "lucide-react"

type DeletionType = "account" | "instagram" | "leads" | "messages" | "all"

interface FormData {
  email: string
  deletionType: DeletionType
  additionalInfo: string
  confirmEmail: string
  acknowledged: boolean
}

const deletionOptions = [
  {
    value: "all" as DeletionType,
    label: "All My Data",
    description: "Delete my entire account and all associated data",
    icon: Database,
    color: "red",
  },
  {
    value: "account" as DeletionType,
    label: "Account Information",
    description: "Name, email, profile info, and auth data",
    icon: Shield,
    color: "blue",
  },
  {
    value: "instagram" as DeletionType,
    label: "Instagram Integration",
    description: "Instagram connection data and access tokens",
    icon: Instagram,
    color: "purple",
  },
  {
    value: "leads" as DeletionType,
    label: "Lead & Customer Data",
    description: "All leads, customer info, and booking history",
    icon: Users,
    color: "emerald",
  },
  {
    value: "messages" as DeletionType,
    label: "Message History",
    description: "AI conversation logs and DM interaction history",
    icon: MessageSquare,
    color: "amber",
  },
]

export default function DataDeletionPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    deletionType: "all",
    additionalInfo: "",
    confirmEmail: "",
    acknowledged: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.confirmEmail) {
      setError("Please provide your email address in both fields.")
      return
    }

    if (formData.email !== formData.confirmEmail) {
      setError("Email addresses do not match.")
      return
    }

    if (!formData.acknowledged) {
      setError("Please acknowledge that you understand data deletion is permanent.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/data-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit request")
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-20" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)", top: "-20%", left: "20%" }} />
        </div>

        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/[0.08]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/velocity.jpg" alt="Velocity Labs" width={120} height={36} className="h-9 w-auto" priority />
              </Link>
              <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Request Submitted</h1>
          <p className="text-white/60 mb-8">
            Your data deletion request has been received. We will process your request within 30 days
            as required by applicable privacy laws. You will receive a confirmation email at{" "}
            <span className="text-white font-medium">{formData.email}</span> once the deletion is complete.
          </p>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] mb-8">
            <p className="text-sm text-white/40">Reference ID</p>
            <p className="text-lg font-mono text-white">{Date.now().toString(36).toUpperCase()}</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-20" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)", top: "-20%", right: "-10%" }} />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-15" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)", bottom: "-10%", left: "-5%" }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/velocity.jpg" alt="Velocity Labs" width={120} height={36} className="h-9 w-auto" priority />
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
            <Trash2 className="w-4 h-4" />
            Data Deletion Request
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
            Delete Your Data
          </h1>
          <p className="text-white/50">
            Request deletion of your personal data from Velocity Labs
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold">Your Privacy Rights</h3>
            </div>
            <p className="text-sm text-white/60">
              Under CCPA/CPRA and other privacy laws, you have the right to request deletion of your personal information.
            </p>
          </div>
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold">What Happens Next</h3>
            </div>
            <p className="text-sm text-white/60">
              We will verify your identity and process your request within 30 days. You&apos;ll receive email confirmation when complete.
            </p>
          </div>
        </div>

        {/* Instagram Notice */}
        <div className="bg-gradient-to-br from-purple-500/[0.08] to-pink-500/[0.08] rounded-2xl border border-purple-500/20 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-300 mb-2">Instagram Integration Data</h3>
              <p className="text-sm text-white/60">
                If you connected your Instagram account, we will disconnect the integration and delete all associated data.
                This does not affect data stored on Instagram/Meta&apos;s servers. Visit your{" "}
                <a
                  href="https://www.facebook.com/settings?tab=your_facebook_information"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  Facebook Privacy Settings
                </a>
                {" "}to manage data held by Meta.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
            <label htmlFor="email" className="block text-sm font-medium mb-3">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter the email associated with your account"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
              required
            />
          </div>

          {/* Confirm Email */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
            <label htmlFor="confirmEmail" className="block text-sm font-medium mb-3">
              Confirm Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="confirmEmail"
              value={formData.confirmEmail}
              onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
              placeholder="Re-enter your email address"
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
              required
            />
          </div>

          {/* Deletion Type */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
            <label className="block text-sm font-medium mb-4">
              What data would you like deleted? <span className="text-red-400">*</span>
            </label>
            <div className="space-y-3">
              {deletionOptions.map((option) => {
                const Icon = option.icon
                const isSelected = formData.deletionType === option.value
                const colorClasses = {
                  red: isSelected ? "border-red-500/50 bg-red-500/10" : "border-white/[0.08] hover:border-white/20",
                  blue: isSelected ? "border-blue-500/50 bg-blue-500/10" : "border-white/[0.08] hover:border-white/20",
                  purple: isSelected ? "border-purple-500/50 bg-purple-500/10" : "border-white/[0.08] hover:border-white/20",
                  emerald: isSelected ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/[0.08] hover:border-white/20",
                  amber: isSelected ? "border-amber-500/50 bg-amber-500/10" : "border-white/[0.08] hover:border-white/20",
                }
                const iconColorClasses = {
                  red: "text-red-400",
                  blue: "text-blue-400",
                  purple: "text-purple-400",
                  emerald: "text-emerald-400",
                  amber: "text-amber-400",
                }
                return (
                  <label
                    key={option.value}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${colorClasses[option.color as keyof typeof colorClasses]}`}
                  >
                    <input
                      type="radio"
                      name="deletionType"
                      value={option.value}
                      checked={isSelected}
                      onChange={(e) =>
                        setFormData({ ...formData, deletionType: e.target.value as DeletionType })
                      }
                      className="mt-1 accent-white"
                    />
                    <div className={`w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${iconColorClasses[option.color as keyof typeof iconColorClasses]}`} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-sm text-white/50">{option.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
            <label htmlFor="additionalInfo" className="block text-sm font-medium mb-3">
              Additional Information <span className="text-white/40">(Optional)</span>
            </label>
            <textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Provide any additional context or specific data you want deleted..."
              rows={4}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all resize-none"
            />
          </div>

          {/* Acknowledgment */}
          <div className="bg-red-500/[0.08] rounded-2xl border border-red-500/20 p-6">
            <label className="flex items-start gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acknowledged}
                onChange={(e) => setFormData({ ...formData, acknowledged: e.target.checked })}
                className="mt-1 accent-red-500"
              />
              <div>
                <p className="font-medium text-red-300">
                  I understand this action is permanent <span className="text-red-400">*</span>
                </p>
                <p className="text-sm text-white/50 mt-1">
                  I acknowledge that once my data is deleted, it cannot be recovered. This may include
                  account information, leads, booking history, conversation logs, and any other data
                  associated with my account.
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Submit Deletion Request
              </>
            )}
          </button>
        </form>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-white/[0.08]">
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6">
            <h3 className="font-semibold mb-4">Questions or Concerns?</h3>
            <p className="text-sm text-white/60 mb-4">
              If you have questions about data deletion or need assistance, please contact our privacy team:
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-white/40">Email:</span>{" "}
                <a href="mailto:privacy@managevelocity.com" className="text-blue-400 hover:underline">
                  privacy@managevelocity.com
                </a>
              </p>
              <p>
                <span className="text-white/40">Response Time:</span>{" "}
                <span className="text-white/70">Within 2 business days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/40">
          <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/tos" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/sms-terms" className="hover:text-white transition">SMS Terms</Link>
        </div>
        <p className="mt-4 text-sm text-white/30">© 2026 Velocity Labs, LLC. All rights reserved.</p>
      </div>
    </div>
  )
}
