// Centralized lead status configuration
// Used across the entire application for consistent lead state management

export type LeadStatus = "new" | "qualified" | "pending" | "booked" | "lost" | "cancelled" | "followup"

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
    color: "bg-white/15 text-white",
    description: "Fresh lead, message received within 12hrs, chatbot hasn't collected info yet",
  },
  {
    value: "qualified",
    label: "Qualified",
    color: "bg-white/10 text-white/80",
    description: "Bot has collected basic info (vehicle interest, dates)",
  },
  {
    value: "pending",
    label: "Pending",
    color: "bg-white/10 text-white/60",
    description: "Deposit link sent, waiting for payment",
  },
  {
    value: "booked",
    label: "Booked",
    color: "bg-white text-black font-semibold",
    description: "Deposit paid, fully booked on calendar",
  },
  {
    value: "lost",
    label: "Lost",
    color: "bg-white/5 text-white/30",
    description: "Lead went cold, didn't convert",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-white/5 text-white/25 line-through",
    description: "Customer cancelled after booking",
  },
  {
    value: "followup",
    label: "Follow Up",
    color: "bg-white/10 text-white/70",
    description: "Needs manual follow-up from fleet owner",
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
export const activeStatuses: LeadStatus[] = ["new", "qualified", "pending", "followup"]
export const closedStatuses: LeadStatus[] = ["booked", "lost", "cancelled"]

// Default status for new leads
export const defaultLeadStatus: LeadStatus = "new"

// Status after qualification (info collected by bot)
export const qualifiedStatus: LeadStatus = "qualified"

// Status after payment link sent
export const pendingStatus: LeadStatus = "pending"

// Status after deposit paid
export const bookedStatus: LeadStatus = "booked"

// Status for leads that didn't convert
export const lostStatus: LeadStatus = "lost"

// Status for cancelled bookings
export const cancelledStatus: LeadStatus = "cancelled"

// Status for manual follow-up needed
export const followupStatus: LeadStatus = "followup"
