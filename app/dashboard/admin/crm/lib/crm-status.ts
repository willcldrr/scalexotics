// CRM Lead Status Configuration
// Used for B2B leads (potential Scale Exotics customers)

export type CRMLeadStatus =
  | "not_contacted"
  | "contacted"
  | "interested"
  | "not_interested"
  | "demo_scheduled"
  | "closed_won"
  | "closed_lost"

export interface CRMStatusOption {
  value: CRMLeadStatus
  label: string
  color: string
  bgColor: string
  description: string
}

// CRM status progression (in order of sales funnel)
export const crmStatusOptions: CRMStatusOption[] = [
  {
    value: "not_contacted",
    label: "Not Contacted",
    color: "text-white/60",
    bgColor: "bg-white/10",
    description: "New lead, no outreach yet",
  },
  {
    value: "contacted",
    label: "Contacted",
    color: "text-[#375DEE]",
    bgColor: "bg-[#375DEE]/15",
    description: "Initial contact made",
  },
  {
    value: "interested",
    label: "Interested",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    description: "Showed interest in Scale Exotics",
  },
  {
    value: "not_interested",
    label: "Not Interested",
    color: "text-white/40",
    bgColor: "bg-white/5",
    description: "Declined to proceed",
  },
  {
    value: "demo_scheduled",
    label: "Demo Scheduled",
    color: "text-purple-400",
    bgColor: "bg-purple-500/15",
    description: "Demo or call scheduled",
  },
  {
    value: "closed_won",
    label: "Closed Won",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    description: "Signed up as customer",
  },
  {
    value: "closed_lost",
    label: "Closed Lost",
    color: "text-red-400",
    bgColor: "bg-red-500/15",
    description: "Deal lost",
  },
]

// Pipeline columns (excludes not_interested for pipeline view)
export const pipelineStatuses: CRMLeadStatus[] = [
  "not_contacted",
  "contacted",
  "interested",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]

// Helper functions
export const getStatusOption = (status: string): CRMStatusOption | undefined => {
  return crmStatusOptions.find((s) => s.value === status)
}

export const getStatusColor = (status: string): string => {
  const option = getStatusOption(status)
  return option ? `${option.bgColor} ${option.color}` : "bg-white/5 text-white/40"
}

export const getStatusLabel = (status: string): string => {
  return getStatusOption(status)?.label || status
}

// Status groups
export const activeStatuses: CRMLeadStatus[] = [
  "not_contacted",
  "contacted",
  "interested",
  "demo_scheduled",
]

export const closedStatuses: CRMLeadStatus[] = ["closed_won", "closed_lost", "not_interested"]

export const wonStatuses: CRMLeadStatus[] = ["closed_won"]

// Event types for calendar
export type CRMEventType = "meeting" | "demo" | "call" | "follow_up" | "other"

export const eventTypeOptions: { value: CRMEventType; label: string; color: string }[] = [
  { value: "demo", label: "Demo", color: "bg-purple-500" },
  { value: "call", label: "Call", color: "bg-[#375DEE]" },
  { value: "meeting", label: "Meeting", color: "bg-emerald-500" },
  { value: "follow_up", label: "Follow Up", color: "bg-amber-500" },
  { value: "other", label: "Other", color: "bg-white/20" },
]

export const getEventTypeColor = (type: string): string => {
  return eventTypeOptions.find((t) => t.value === type)?.color || "bg-white/20"
}

// Note types
export type CRMNoteType = "note" | "call" | "email" | "meeting" | "status_change"

export const noteTypeOptions: { value: CRMNoteType; label: string; icon: string }[] = [
  { value: "note", label: "Note", icon: "FileText" },
  { value: "call", label: "Call", icon: "Phone" },
  { value: "email", label: "Email", icon: "Mail" },
  { value: "meeting", label: "Meeting", icon: "Calendar" },
  { value: "status_change", label: "Status Change", icon: "RefreshCw" },
]

// Lead sources
export const leadSourceOptions = [
  "Referral",
  "Cold Outreach",
  "LinkedIn",
  "Website",
  "Conference",
  "Social Media",
  "Partner",
  "Other",
]
