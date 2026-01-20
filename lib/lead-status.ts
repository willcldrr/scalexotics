// Centralized lead status configuration
// Used across the entire application for consistent lead state management

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost"

export interface LeadStatusOption {
  value: LeadStatus
  label: string
  color: string
  description: string
}

// Lead status progression (in order of sales funnel)
export const leadStatusOptions: LeadStatusOption[] = [
  {
    value: "new",
    label: "New",
    color: "bg-[#375DEE]/15 text-[#375DEE]",
    description: "New lead, not yet contacted",
  },
  {
    value: "contacted",
    label: "Contacted",
    color: "bg-purple-500/15 text-purple-400",
    description: "Initial outreach made",
  },
  {
    value: "qualified",
    label: "Qualified",
    color: "bg-amber-500/15 text-amber-400",
    description: "Verified and ready to book",
  },
  {
    value: "converted",
    label: "Converted",
    color: "bg-emerald-500/15 text-emerald-400",
    description: "Booking deposit paid, calendar slot reserved",
  },
  {
    value: "lost",
    label: "Lost",
    color: "bg-white/5 text-white/40",
    description: "Lead not converted within 1 month",
  },
]

// Helper functions
export const getStatusOption = (status: string): LeadStatusOption | undefined => {
  return leadStatusOptions.find((s) => s.value === status)
}

export const getStatusColor = (status: string): string => {
  return getStatusOption(status)?.color || "bg-white/5 text-white/40"
}

export const getStatusLabel = (status: string): string => {
  return getStatusOption(status)?.label || status
}

// Status groups for filtering
export const activeStatuses: LeadStatus[] = ["new", "contacted", "qualified"]
export const customerStatuses: LeadStatus[] = ["converted"]
export const closedStatuses: LeadStatus[] = ["converted", "lost"]

// Default status for new leads
export const defaultLeadStatus: LeadStatus = "new"

// Status after initial contact (SMS/call)
export const contactedStatus: LeadStatus = "contacted"

// Status after qualification (docs verified)
export const qualifiedStatus: LeadStatus = "qualified"

// Status after conversion (payment/booking)
export const convertedStatus: LeadStatus = "converted"

// Status for leads that didn't convert
export const lostStatus: LeadStatus = "lost"
