"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  X,
  Check,
  Car,
  CreditCard,
  Bot,
  Phone,
  Instagram,
  Building2,
  ChevronRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface OnboardingChecklistProps {
  settings: {
    business_name?: string
    business_phone?: string
    tone?: string
  } | null
  vehicleCount: number
  hasStripe: boolean
  hasInstagram: boolean
}

const ONBOARDING_STORAGE_KEY = "velocity_labs_onboarding_dismissed"

interface ChecklistStep {
  id: string
  title: string
  description: string
  href: string
  icon: typeof Check
  complete: boolean
}

export default function OnboardingChecklist({
  settings,
  vehicleCount,
  hasStripe,
  hasInstagram,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true"
    setDismissed(isDismissed)
    // Trigger entrance animation
    const timer = setTimeout(() => setAnimateIn(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")
    setDismissed(true)
  }

  const hasBusinessName = !!(settings?.business_name && settings.business_name.trim().length > 0)
  const hasBusinessPhone = !!(settings?.business_phone && settings.business_phone.trim().length > 0)
  const hasTone = !!(settings?.tone && settings.tone.trim().length > 0)
  const hasVehicles = vehicleCount > 0

  const steps: ChecklistStep[] = [
    {
      id: "business-name",
      title: "Set your business name",
      description: "Give your rental business an identity",
      href: "/dashboard/ai-assistant",
      icon: Building2,
      complete: hasBusinessName,
    },
    {
      id: "vehicles",
      title: "Add your first vehicle",
      description: "List at least one vehicle in your fleet",
      href: "/dashboard/vehicles",
      icon: Car,
      complete: hasVehicles,
    },
    {
      id: "business-phone",
      title: "Configure business phone",
      description: "Set a phone number for customer contact",
      href: "/dashboard/ai-assistant",
      icon: Phone,
      complete: hasBusinessPhone,
    },
    {
      id: "ai-tone",
      title: "Select AI tone",
      description: "Choose how your AI assistant communicates",
      href: "/dashboard/ai-assistant",
      icon: Bot,
      complete: hasTone,
    },
    {
      id: "stripe",
      title: "Configure Stripe payments",
      description: "Accept deposits and payments online",
      href: "/dashboard/ai-assistant",
      icon: CreditCard,
      complete: hasStripe,
    },
    {
      id: "instagram",
      title: "Connect Instagram",
      description: "Capture leads from Instagram DMs",
      href: "/dashboard/settings",
      icon: Instagram,
      complete: hasInstagram,
    },
  ]

  const completedCount = steps.filter((s) => s.complete).length
  const totalSteps = steps.length
  const allComplete = completedCount === totalSteps
  const progressPercent = (completedCount / totalSteps) * 100

  // Don't show if dismissed or all complete
  if (dismissed || allComplete) return null

  return (
    <div
      className={`mb-4 transition-all duration-500 ease-out ${
        animateIn ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden relative bg-[#0a0a12]">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[500px] h-[300px] rounded-full blur-[120px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
              top: "-40%",
              left: "10%",
            }}
          />
          <div
            className="absolute w-[300px] h-[200px] rounded-full blur-[100px] opacity-15"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
              bottom: "-30%",
              right: "15%",
            }}
          />
        </div>

        <div className="relative z-10 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/[0.06] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white/80" />
              </div>
              <div>
                <h2 className="font-semibold text-[15px] tracking-tight">
                  Complete your setup
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {completedCount} of {totalSteps} steps completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                aria-label={isCollapsed ? "Expand checklist" : "Collapse checklist"}
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
                aria-label="Dismiss checklist"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background:
                  progressPercent === 100
                    ? "linear-gradient(90deg, #34d399, #10b981)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
                boxShadow:
                  progressPercent > 0
                    ? "0 0 12px rgba(255,255,255,0.2)"
                    : "none",
              }}
            />
          </div>

          {/* Steps (collapsible) */}
          <div
            className={`transition-all duration-400 ease-out overflow-hidden ${
              isCollapsed ? "max-h-0 opacity-0 mt-0" : "max-h-[600px] opacity-100 mt-4"
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <Link
                    key={step.id}
                    href={step.complete ? "#" : step.href}
                    onClick={step.complete ? (e) => e.preventDefault() : undefined}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                      step.complete
                        ? "bg-white/[0.02] cursor-default"
                        : "bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/[0.12]"
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Status indicator */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        step.complete
                          ? "bg-emerald-500/15 border border-emerald-500/20"
                          : "bg-white/[0.06] border border-white/[0.06] group-hover:border-white/[0.12]"
                      }`}
                    >
                      {step.complete ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-white/50 group-hover:text-white/70 transition-colors" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-sm font-medium truncate transition-colors ${
                            step.complete
                              ? "text-white/30 line-through decoration-white/20"
                              : "text-white/80 group-hover:text-white"
                          }`}
                        >
                          {step.title}
                        </p>
                        {!step.complete && (
                          <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-all group-hover:translate-x-0.5 flex-shrink-0" />
                        )}
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 truncate ${
                          step.complete ? "text-white/20" : "text-white/35"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
