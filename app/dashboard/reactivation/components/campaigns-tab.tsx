"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  Play,
  Pause,
  Trash2,
  MoreVertical,
  Calendar,
  Users,
  MessageSquare,
  Target,
  Clock,
  ChevronRight,
  X,
  Sparkles,
  Mail,
  Phone,
  Gift,
  Repeat,
  Car,
  PartyPopper,
  Star,
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  description: string | null
  campaign_type: string
  status: string
  channels: string[]
  start_date: string | null
  end_date: string | null
  total_contacts: number
  messages_sent: number
  responses: number
  conversions: number
  ai_enabled: boolean
  ai_tone: string
  created_at: string
}

interface CampaignsTabProps {
  userId: string
}

const campaignTypeIcons: Record<string, any> = {
  win_back: Repeat,
  holiday: PartyPopper,
  new_vehicle: Car,
  special_offer: Gift,
  milestone: Star,
  custom: Target,
}

const campaignTypeColors: Record<string, string> = {
  win_back: "bg-[#375DEE]/15 text-[#375DEE]",
  holiday: "bg-white/[0.08] text-white/70",
  new_vehicle: "bg-[#375DEE]/15 text-[#375DEE]",
  special_offer: "bg-[#375DEE]/15 text-[#375DEE]",
  milestone: "bg-white/[0.08] text-white/70",
  custom: "bg-white/[0.06] text-white/50",
}

const statusColors: Record<string, string> = {
  draft: "bg-white/[0.06] text-white/50 border border-white/[0.08]",
  scheduled: "bg-white/[0.08] text-white/70 border border-white/10",
  active: "bg-[#375DEE]/15 text-[#375DEE] border border-[#375DEE]/20",
  paused: "bg-white/[0.08] text-white/60 border border-white/10",
  completed: "bg-white/[0.06] text-white/50 border border-white/[0.08]",
  cancelled: "bg-white/[0.04] text-white/40 border border-white/[0.06]",
}

export default function CampaignsTab({ userId }: CampaignsTabProps) {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [userId])

  const fetchCampaigns = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("reactivation_campaigns")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (data) {
      setCampaigns(data)
    }
    setLoading(false)
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    const { error } = await supabase
      .from("reactivation_campaigns")
      .update({ status: newStatus })
      .eq("id", campaignId)

    if (!error) {
      fetchCampaigns()
    }
  }

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return

    const { error } = await supabase
      .from("reactivation_campaigns")
      .delete()
      .eq("id", campaignId)

    if (!error) {
      fetchCampaigns()
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] text-sm font-medium hover:bg-[#375DEE]/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-white/20" />
          </div>
          <h3 className="text-lg font-bold mb-2">No campaigns yet</h3>
          <p className="text-white/50 mb-6">
            Create your first reactivation campaign to re-engage past customers
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] font-medium hover:bg-[#375DEE]/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => {
            const TypeIcon = campaignTypeIcons[campaign.campaign_type] || Target
            return (
              <div
                key={campaign.id}
                className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6 hover:border-white/[0.12] transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        campaignTypeColors[campaign.campaign_type] || campaignTypeColors.custom
                      }`}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">{campaign.name}</h3>
                      <p className="text-sm text-white/50 capitalize">
                        {campaign.campaign_type?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                      statusColors[campaign.status] || statusColors.draft
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>

                {campaign.description && (
                  <p className="text-sm text-white/60 mb-4 line-clamp-2">{campaign.description}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div>
                    <p className="text-xs text-white/40">Contacts</p>
                    <p className="font-semibold">{campaign.total_contacts || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Sent</p>
                    <p className="font-semibold">{campaign.messages_sent || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Responses</p>
                    <p className="font-semibold">{campaign.responses || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Conversions</p>
                    <p className="font-semibold">{campaign.conversions || 0}</p>
                  </div>
                </div>

                {/* Channels & AI */}
                <div className="flex items-center gap-2 mb-4">
                  {campaign.channels?.includes("sms") && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-[#375DEE]/15 text-[#375DEE] rounded-lg text-xs border border-[#375DEE]/20">
                      <Phone className="w-3 h-3" />
                      SMS
                    </span>
                  )}
                  {campaign.channels?.includes("email") && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-white/[0.06] text-white/60 rounded-lg text-xs border border-white/[0.08]">
                      <Mail className="w-3 h-3" />
                      Email
                    </span>
                  )}
                  {campaign.ai_enabled && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-white/[0.06] text-white/60 rounded-lg text-xs border border-white/[0.08]">
                      <Sparkles className="w-3 h-3" />
                      AI {campaign.ai_tone}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    {campaign.status === "active" ? (
                      <button
                        onClick={() => handleStatusChange(campaign.id, "paused")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.06] text-white/70 rounded-lg text-sm hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                    ) : campaign.status === "draft" || campaign.status === "paused" ? (
                      <button
                        onClick={() => handleStatusChange(campaign.id, "active")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#375DEE]/15 text-[#375DEE] rounded-lg text-sm hover:bg-[#375DEE]/25 border border-[#375DEE]/20 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        {campaign.status === "draft" ? "Launch" : "Resume"}
                      </button>
                    ) : null}
                  </div>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 text-white/40 hover:text-white/70 hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Campaign Wizard Modal */}
      {showWizard && (
        <CampaignWizard
          userId={userId}
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false)
            fetchCampaigns()
          }}
        />
      )}
    </div>
  )
}

// Campaign Wizard Component
function CampaignWizard({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaign_type: "win_back",
    channels: ["sms"],
    ai_enabled: true,
    ai_tone: "friendly",
    ai_instructions: "",
    target_segments: {} as Record<string, any>,
    start_date: "",
    end_date: "",
    max_messages_per_contact: 3,
    min_days_between_messages: 7,
    template_id: "",
    custom_message: "",
  })

  useEffect(() => {
    // Fetch contacts for audience selection
    const fetchData = async () => {
      const { data: contactsData } = await supabase
        .from("reactivation_contacts")
        .select("id, name, status")
        .eq("user_id", userId)
        .eq("status", "active")

      const { data: templatesData } = await supabase
        .from("reactivation_templates")
        .select("*")
        .eq("user_id", userId)

      if (contactsData) setContacts(contactsData)
      if (templatesData) setTemplates(templatesData)
    }
    fetchData()
  }, [userId])

  const campaignTypes = [
    {
      value: "win_back",
      label: "Win-Back",
      description: "Re-engage customers who haven't rented in a while",
      icon: Repeat,
    },
    {
      value: "holiday",
      label: "Holiday",
      description: "Special promotions for holidays and events",
      icon: PartyPopper,
    },
    {
      value: "new_vehicle",
      label: "New Vehicle",
      description: "Announce new additions to your fleet",
      icon: Car,
    },
    {
      value: "special_offer",
      label: "Special Offer",
      description: "Limited-time discounts and deals",
      icon: Gift,
    },
    {
      value: "milestone",
      label: "Milestone",
      description: "Birthday or customer anniversary campaigns",
      icon: Star,
    },
  ]

  const tones = [
    { value: "friendly", label: "Friendly", description: "Warm and casual" },
    { value: "professional", label: "Professional", description: "Polished and business-like" },
    { value: "luxury", label: "Luxury", description: "Premium and sophisticated" },
    { value: "energetic", label: "Energetic", description: "Enthusiastic and exciting" },
  ]

  const handleSave = async () => {
    if (!formData.name) {
      alert("Campaign name is required")
      return
    }

    setSaving(true)

    const { error } = await supabase.from("reactivation_campaigns").insert({
      user_id: userId,
      name: formData.name,
      description: formData.description || null,
      campaign_type: formData.campaign_type,
      channels: formData.channels,
      ai_enabled: formData.ai_enabled,
      ai_tone: formData.ai_tone,
      ai_instructions: formData.ai_instructions || null,
      target_segments: formData.target_segments,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      max_messages_per_contact: formData.max_messages_per_contact,
      min_days_between_messages: formData.min_days_between_messages,
      template_id: formData.template_id || null,
      status: "draft",
      total_contacts: contacts.length,
    })

    if (error) {
      console.error("Error creating campaign:", error)
      alert("Failed to create campaign")
    } else {
      onSuccess()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-bold">
              Create Campaign
            </h2>
            <p className="text-sm text-white/50">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? "bg-[#375DEE]" : "bg-white/[0.08]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/50 mb-2">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Summer Win-Back Campaign"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this campaign..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 resize-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-3">Campaign Type</label>
                <div className="grid grid-cols-1 gap-3">
                  {campaignTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        formData.campaign_type === type.value
                          ? "bg-[#375DEE]/15 border-[#375DEE]/30"
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="campaign_type"
                        value={type.value}
                        checked={formData.campaign_type === type.value}
                        onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.campaign_type === type.value ? "bg-[#375DEE]/20 text-[#375DEE]" : "bg-white/[0.06] text-white/60"
                        }`}
                      >
                        <type.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-white/50">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/50 mb-3">Communication Channels</label>
                <div className="flex gap-3">
                  <label
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.channels.includes("sms")
                        ? "bg-[#375DEE]/15 border-[#375DEE]/30"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.channels.includes("sms")}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...formData.channels, "sms"]
                          : formData.channels.filter((c) => c !== "sms")
                        setFormData({ ...formData, channels })
                      }}
                      className="sr-only"
                    />
                    <Phone className={`w-5 h-5 ${formData.channels.includes("sms") ? "text-[#375DEE]" : "text-white/40"}`} />
                    <div>
                      <p className="font-medium">SMS</p>
                      <p className="text-xs text-white/50">Text messages via Twilio</p>
                    </div>
                  </label>
                  <label
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.channels.includes("email")
                        ? "bg-[#375DEE]/15 border-[#375DEE]/30"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.channels.includes("email")}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...formData.channels, "email"]
                          : formData.channels.filter((c) => c !== "email")
                        setFormData({ ...formData, channels })
                      }}
                      className="sr-only"
                    />
                    <Mail className={`w-5 h-5 ${formData.channels.includes("email") ? "text-[#375DEE]" : "text-white/40"}`} />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-xs text-white/50">Email campaigns</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#375DEE]" />
                    <div>
                      <p className="font-medium">AI-Powered Messages</p>
                      <p className="text-sm text-white/50">Let AI personalize messages for each contact</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.ai_enabled}
                      onChange={(e) => setFormData({ ...formData, ai_enabled: e.target.checked })}
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                        formData.ai_enabled ? "bg-[#375DEE]" : "bg-white/20"
                      }`}
                      onClick={() => setFormData({ ...formData, ai_enabled: !formData.ai_enabled })}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          formData.ai_enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </label>
              </div>

              {formData.ai_enabled && (
                <div>
                  <label className="block text-sm text-white/50 mb-3">AI Tone</label>
                  <div className="grid grid-cols-2 gap-3">
                    {tones.map((tone) => (
                      <label
                        key={tone.value}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.ai_tone === tone.value
                            ? "bg-[#375DEE]/15 border-[#375DEE]/30"
                            : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ai_tone"
                          value={tone.value}
                          checked={formData.ai_tone === tone.value}
                          onChange={(e) => setFormData({ ...formData, ai_tone: e.target.value })}
                          className="sr-only"
                        />
                        <p className="font-medium">{tone.label}</p>
                        <p className="text-xs text-white/50">{tone.description}</p>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.ai_enabled && (
                <div>
                  <label className="block text-sm text-white/50 mb-2">AI Instructions (Optional)</label>
                  <textarea
                    value={formData.ai_instructions}
                    onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
                    placeholder="e.g., Mention our new Lamborghini Revuelto, offer 15% discount..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 resize-none transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/50 mb-2">Target Audience</label>
                <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#375DEE]/15 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#375DEE]" />
                    </div>
                    <div>
                      <p className="font-medium"><span>{contacts.length}</span> Active Contacts</p>
                      <p className="text-sm text-white/50">All contacts with opted-in status</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg cursor-pointer border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                      <input
                        type="radio"
                        name="audience"
                        defaultChecked
                        className="w-4 h-4 accent-[#375DEE]"
                      />
                      <div>
                        <p className="font-medium">All Active Contacts</p>
                        <p className="text-xs text-white/50">Send to everyone who hasn't opted out</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg cursor-not-allowed opacity-50 border border-white/[0.04]">
                      <input type="radio" name="audience" disabled className="w-4 h-4" />
                      <div>
                        <p className="font-medium">Custom Segment</p>
                        <p className="text-xs text-white/50">Filter by spend, rental date, etc. (Coming soon)</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/50 mb-3">Frequency Limits</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Max messages per contact</label>
                    <input
                      type="number"
                      value={formData.max_messages_per_contact}
                      onChange={(e) =>
                        setFormData({ ...formData, max_messages_per_contact: parseInt(e.target.value) || 3 })
                      }
                      min={1}
                      max={10}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Min days between messages</label>
                    <input
                      type="number"
                      value={formData.min_days_between_messages}
                      onChange={(e) =>
                        setFormData({ ...formData, min_days_between_messages: parseInt(e.target.value) || 7 })
                      }
                      min={1}
                      max={30}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-6">
                <h3 className="font-bold mb-4">Campaign Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-white/50">Name</span>
                    <span className="font-medium">{formData.name || "-"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-white/50">Type</span>
                    <span className="capitalize font-medium">{formData.campaign_type.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-white/50">Channels</span>
                    <span className="font-medium">{formData.channels.join(", ").toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-white/50">AI Enabled</span>
                    <span className="font-medium">{formData.ai_enabled ? `Yes (${formData.ai_tone})` : "No"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-white/50">Target Contacts</span>
                    <span className="font-medium">{contacts.length}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-white/50">Start Date</span>
                    <span className="font-medium">{formData.start_date || "Immediately"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/[0.06]">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all"
          >
            {step > 1 ? "Back" : "Cancel"}
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !formData.name}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] font-medium hover:bg-[#375DEE]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] font-medium hover:bg-[#375DEE]/25 transition-all disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
