"use client"

import { BarChart3 } from "lucide-react"

export default function AnalyticsTab() {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
      <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">Analytics Dashboard</h3>
      <p className="text-white/50 max-w-md mx-auto">
        Pipeline funnel, conversion rates, and activity metrics.
        Coming in Phase 7.
      </p>
    </div>
  )
}
