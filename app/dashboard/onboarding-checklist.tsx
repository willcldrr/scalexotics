"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  X,
  Check,
  Car,
  CreditCard,
  Bot,
  ChevronRight,
  Sparkles,
} from "lucide-react"

interface OnboardingChecklistProps {
  hasVehicles: boolean
  hasStripeConnected: boolean
  hasAIConfigured: boolean
}

const ONBOARDING_STORAGE_KEY = "velocity_labs_onboarding_dismissed"

export default function OnboardingChecklist({
  hasVehicles,
  hasStripeConnected,
  hasAIConfigured,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash

  useEffect(() => {
    const isDismissed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true"
    setDismissed(isDismissed)
  }, [])

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")
    setDismissed(true)
  }

  // Check if all steps are complete
  const allComplete = hasVehicles && hasStripeConnected && hasAIConfigured
  const completedCount = [hasVehicles, hasStripeConnected, hasAIConfigured].filter(Boolean).length

  // Don't show if dismissed or all complete
  if (dismissed || allComplete) return null

  const steps = [
    {
      id: "vehicles",
      title: "Add your first vehicle",
      description: "Add a vehicle to your fleet to start accepting bookings",
      href: "/dashboard/vehicles",
      icon: Car,
      complete: hasVehicles,
    },
    {
      id: "stripe",
      title: "Connect Stripe",
      description: "Enable payment collection for deposits and bookings",
      href: "/dashboard/settings?tab=deposit",
      icon: CreditCard,
      complete: hasStripeConnected,
    },
    {
      id: "ai",
      title: "Configure AI Assistant",
      description: "Set up your AI chatbot to handle customer inquiries",
      href: "/dashboard/ai-assistant",
      icon: Bot,
      complete: hasAIConfigured,
    },
  ]

  return (
    <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.08] p-5 mb-4 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Get Started</h2>
              <p className="text-sm text-white/50">{completedCount}/3 complete</p>
            </div>
          </div>
          <button
            onClick={skipOnboarding}
            className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
          >
            Skip
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all group ${
                  step.complete
                    ? "bg-white/5 opacity-60"
                    : "bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.15]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    step.complete ? "bg-emerald-500/20" : "bg-white/10"
                  }`}
                >
                  {step.complete ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className="w-4 h-4 text-white/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${step.complete ? "line-through text-white/40" : ""}`}>
                      {step.title}
                    </p>
                    {!step.complete && (
                      <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{step.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
