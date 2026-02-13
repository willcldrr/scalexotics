"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { FileText, Receipt, Loader2 } from "lucide-react"

// Loading fallback
const ContentLoading = () => (
  <div className="flex items-center justify-center h-48">
    <Loader2 className="w-6 h-6 animate-spin text-[#375DEE]" />
  </div>
)

// Lazy load content components
const AgreementsContent = dynamic(() => import("./agreements-content"), {
  loading: ContentLoading,
  ssr: false,
})
const InvoicesContent = dynamic(() => import("./invoices-content"), {
  loading: ContentLoading,
  ssr: false,
})

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "agreements">("invoices")

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Hidden on mobile */}
      <div className="hidden sm:block">
        <h1 className="text-3xl font-bold dashboard-heading">
          Billing
        </h1>
        <p className="text-white/50 mt-1">Manage invoices and rental agreements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "invoices"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("agreements")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "agreements"
              ? "bg-[#375DEE] text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="w-4 h-4" />
          Agreements
        </button>
      </div>

      {/* Content */}
      {activeTab === "invoices" ? <InvoicesContent /> : <AgreementsContent />}
    </div>
  )
}
