"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

type DeletionType = "account" | "instagram" | "leads" | "messages" | "all"

interface FormData {
  email: string
  deletionType: DeletionType
  additionalInfo: string
  confirmEmail: string
  acknowledged: boolean
}

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

  const deletionOptions: { value: DeletionType; label: string; description: string }[] = [
    {
      value: "all",
      label: "All My Data",
      description: "Delete my entire account and all associated data",
    },
    {
      value: "account",
      label: "Account Information",
      description: "Name, email, profile information, and authentication data",
    },
    {
      value: "instagram",
      label: "Instagram Integration Data",
      description: "Instagram connection data, access tokens, and related metadata",
    },
    {
      value: "leads",
      label: "Lead & Customer Data",
      description: "All leads, customer information, and booking history",
    },
    {
      value: "messages",
      label: "Message History",
      description: "AI conversation logs and DM interaction history",
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Request Submitted</h1>
          <p className="text-white/70 mb-6">
            Your data deletion request has been received. We will process your request within 30 days
            as required by applicable privacy laws. You will receive a confirmation email at{" "}
            <span className="text-white font-medium">{formData.email}</span> once the deletion is complete.
          </p>
          <p className="text-white/50 text-sm mb-8">
            Reference ID: {Date.now().toString(36).toUpperCase()}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
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
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Data Deletion Request</h1>
          <p className="text-white/60 mt-2">
            Request deletion of your personal data from Velocity Labs
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Information Section */}
        <div className="bg-white/[0.02] rounded-xl border border-white/10 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Your Privacy Rights</h2>
          <p className="text-white/70 mb-4">
            Under applicable privacy laws including the California Consumer Privacy Act (CCPA/CPRA),
            California residents and other users have the right to request deletion of their personal
            information. We are committed to honoring these rights.
          </p>
          <p className="text-white/70 mb-4">
            <strong className="text-white">What happens when you request deletion:</strong>
          </p>
          <ul className="list-disc list-inside text-white/70 space-y-2 ml-2">
            <li>We will verify your identity using the email address associated with your account</li>
            <li>Your request will be processed within 30 days</li>
            <li>You will receive email confirmation when deletion is complete</li>
            <li>Some data may be retained as required by law or for legitimate business purposes</li>
          </ul>
        </div>

        {/* Meta/Instagram Notice */}
        <div className="bg-purple-500/10 rounded-xl border border-purple-500/20 p-6 mb-8">
          <h3 className="font-semibold text-purple-300 mb-2">Instagram Integration Data</h3>
          <p className="text-white/70 text-sm">
            If you connected your Instagram account to Velocity Labs, we will disconnect the integration
            and delete all associated data including access tokens, conversation history, and metadata.
            This does not affect data stored on Instagram/Meta&apos;s servers. To manage data held by Meta,
            visit your{" "}
            <a
              href="https://www.facebook.com/settings?tab=your_facebook_information"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              Facebook Privacy Settings
            </a>
            .
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter the email associated with your account"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Confirm Email */}
          <div>
            <label htmlFor="confirmEmail" className="block text-sm font-medium mb-2">
              Confirm Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="confirmEmail"
              value={formData.confirmEmail}
              onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
              placeholder="Re-enter your email address"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Deletion Type */}
          <div>
            <label className="block text-sm font-medium mb-3">
              What data would you like deleted? <span className="text-red-400">*</span>
            </label>
            <div className="space-y-3">
              {deletionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.deletionType === option.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="deletionType"
                    value={option.value}
                    checked={formData.deletionType === option.value}
                    onChange={(e) =>
                      setFormData({ ...formData, deletionType: e.target.value as DeletionType })
                    }
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-white/60">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label htmlFor="additionalInfo" className="block text-sm font-medium mb-2">
              Additional Information (Optional)
            </label>
            <textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Provide any additional context or specific data you want deleted..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Acknowledgment */}
          <div className="bg-red-500/10 rounded-xl border border-red-500/20 p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.acknowledged}
                onChange={(e) => setFormData({ ...formData, acknowledged: e.target.checked })}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-red-300">
                  I understand this action is permanent <span className="text-red-400">*</span>
                </p>
                <p className="text-sm text-white/60 mt-1">
                  I acknowledge that once my data is deleted, it cannot be recovered. This may include
                  account information, leads, booking history, conversation logs, and any other data
                  associated with my account. I understand that I may need to create a new account if
                  I wish to use Velocity Labs services in the future.
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-semibold"
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
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="font-semibold mb-4">Questions or Concerns?</h3>
          <p className="text-white/70 text-sm">
            If you have questions about data deletion or need assistance, please contact our privacy team:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <span className="text-white/50">Email:</span>{" "}
              <a href="mailto:privacy@velocitylabs.io" className="text-blue-400 hover:underline">
                privacy@velocitylabs.io
              </a>
            </li>
            <li>
              <span className="text-white/50">Response Time:</span>{" "}
              <span className="text-white/70">Within 2 business days</span>
            </li>
          </ul>
        </div>

        {/* Legal Links */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy-policy" className="text-white/50 hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/tos" className="text-white/50 hover:text-white">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  )
}
