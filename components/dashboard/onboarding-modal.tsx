"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  X,
  Check,
  Car,
  Users,
  CalendarCheck,
  MessageSquare,
  Settings,
  Rocket,
  ChevronRight,
  Sparkles,
} from "lucide-react"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: any
  href: string
  checkKey: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "add_vehicle",
    title: "Add your first vehicle",
    description: "List your exotic cars so customers can book them",
    icon: Car,
    href: "/dashboard/vehicles",
    checkKey: "has_vehicles",
  },
  {
    id: "add_customer",
    title: "Add or import customers",
    description: "Build your customer database for bookings",
    icon: Users,
    href: "/dashboard/customers",
    checkKey: "has_customers",
  },
  {
    id: "create_booking",
    title: "Create your first booking",
    description: "Schedule a rental for a customer",
    icon: CalendarCheck,
    href: "/dashboard/bookings",
    checkKey: "has_bookings",
  },
  {
    id: "setup_sms",
    title: "Set up lead capture",
    description: "Configure surveys to collect leads from ads",
    icon: MessageSquare,
    href: "/dashboard/settings",
    checkKey: "has_survey",
  },
  {
    id: "explore_settings",
    title: "Explore your settings",
    description: "Customize your dashboard and integrations",
    icon: Settings,
    href: "/dashboard/settings",
    checkKey: "viewed_settings",
  },
]

export default function OnboardingModal() {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    // Check if onboarding is already completed
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, onboarding_progress")
      .eq("id", user.id)
      .single()

    if (profile?.onboarding_completed) {
      setLoading(false)
      return
    }

    // Load saved progress
    const savedProgress = profile?.onboarding_progress || {}

    // Check actual progress from database
    const [vehiclesResult, customersResult, bookingsResult, surveysResult] = await Promise.all([
      supabase.from("vehicles").select("id").eq("user_id", user.id).limit(1),
      supabase.from("customers").select("id").eq("user_id", user.id).limit(1),
      supabase.from("bookings").select("id").eq("user_id", user.id).limit(1),
      supabase.from("survey_config").select("id").eq("user_id", user.id).limit(1),
    ])

    const currentProgress: Record<string, boolean> = {
      has_vehicles: (vehiclesResult.data?.length || 0) > 0,
      has_customers: (customersResult.data?.length || 0) > 0,
      has_bookings: (bookingsResult.data?.length || 0) > 0,
      has_survey: (surveysResult.data?.length || 0) > 0,
      viewed_settings: savedProgress.viewed_settings || false,
    }

    setProgress(currentProgress)

    // Check if all steps are complete
    const allComplete = onboardingSteps.every(step => currentProgress[step.checkKey])
    if (allComplete) {
      await completeOnboarding()
    } else {
      setIsOpen(true)
    }

    setLoading(false)
  }

  const completeOnboarding = async () => {
    if (!userId) return

    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", userId)

    setIsOpen(false)
  }

  const updateProgress = async (key: string) => {
    if (!userId) return

    const newProgress = { ...progress, [key]: true }
    setProgress(newProgress)

    await supabase
      .from("profiles")
      .update({ onboarding_progress: newProgress })
      .eq("id", userId)

    // Check if all steps are complete
    const allComplete = onboardingSteps.every(step => newProgress[step.checkKey])
    if (allComplete) {
      await completeOnboarding()
    }
  }

  const handleStepClick = (step: OnboardingStep) => {
    // Mark settings as viewed if that's the step
    if (step.checkKey === "viewed_settings") {
      updateProgress("viewed_settings")
    }

    router.push(step.href)
    setIsMinimized(true)
  }

  const handleDismiss = () => {
    setIsOpen(false)
  }

  const handleSkip = async () => {
    await completeOnboarding()
  }

  const completedCount = onboardingSteps.filter(step => progress[step.checkKey]).length
  const progressPercent = (completedCount / onboardingSteps.length) * 100

  if (loading || !isOpen) return null

  // Minimized floating button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white rounded-full shadow-lg transition-all hover:scale-105"
      >
        <Rocket className="w-5 h-5" />
        <span className="font-medium">Setup Guide</span>
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
          {completedCount}/{onboardingSteps.length}
        </span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#375DEE]" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Welcome to Scale Exotics!
                </h2>
                <p className="text-white/50 text-sm">Let's get your dashboard set up</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Your progress</span>
              <span className="text-[#375DEE] font-medium">{completedCount} of {onboardingSteps.length} complete</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#375DEE] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="space-y-2">
            {onboardingSteps.map((step, index) => {
              const isComplete = progress[step.checkKey]
              const Icon = step.icon

              return (
                <button
                  key={step.id}
                  onClick={() => !isComplete && handleStepClick(step)}
                  disabled={isComplete}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                    isComplete
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isComplete
                        ? "bg-green-500/20 text-green-400"
                        : "bg-[#375DEE]/20 text-[#375DEE]"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isComplete ? "text-green-400" : "text-white"}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-white/50 truncate">{step.description}</p>
                  </div>
                  {!isComplete && (
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            Minimize
          </button>
        </div>
      </div>
    </div>
  )
}
