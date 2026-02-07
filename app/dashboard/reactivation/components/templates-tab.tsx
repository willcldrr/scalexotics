"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Search,
  FileText,
  Sparkles,
  Phone,
  Mail,
  Edit,
  Trash2,
  Copy,
  X,
  Check,
  Loader2,
} from "lucide-react"

interface Template {
  id: string
  name: string
  description: string | null
  template_type: string
  channel: string
  subject: string | null
  content: string
  ai_generated: boolean
  ai_tone: string | null
  times_used: number
  created_at: string
}

interface TemplatesTabProps {
  userId: string
}

const templateTypes = [
  { value: "win_back", label: "Win-Back" },
  { value: "holiday", label: "Holiday" },
  { value: "new_vehicle", label: "New Vehicle" },
  { value: "special_offer", label: "Special Offer" },
  { value: "milestone", label: "Milestone" },
  { value: "custom", label: "Custom" },
]

const templateVariables = [
  { variable: "{{name}}", description: "Customer's first name" },
  { variable: "{{full_name}}", description: "Customer's full name" },
  { variable: "{{last_vehicle}}", description: "Last rented vehicle" },
  { variable: "{{days_since_rental}}", description: "Days since last rental" },
  { variable: "{{total_rentals}}", description: "Total rental count" },
  { variable: "{{business_name}}", description: "Your business name" },
  { variable: "{{offer_code}}", description: "Promo code" },
  { variable: "{{offer_amount}}", description: "Discount amount" },
]

export default function TemplatesTab({ userId }: TemplatesTabProps) {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState<string>("all")
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [userId])

  const fetchTemplates = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("reactivation_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (data) {
      setTemplates(data)
    }
    setLoading(false)
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel = channelFilter === "all" || template.channel === channelFilter
    return matchesSearch && matchesChannel
  })

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    const { error } = await supabase
      .from("reactivation_templates")
      .delete()
      .eq("id", templateId)

    if (!error) {
      fetchTemplates()
    }
  }

  const handleDuplicate = async (template: Template) => {
    const { error } = await supabase.from("reactivation_templates").insert({
      user_id: userId,
      name: `${template.name} (Copy)`,
      description: template.description,
      template_type: template.template_type,
      channel: template.channel,
      subject: template.subject,
      content: template.content,
      ai_generated: false,
      ai_tone: template.ai_tone,
    })

    if (!error) {
      fetchTemplates()
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
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
            />
          </div>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
          >
            <option value="all">All Channels</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null)
            setShowEditor(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] text-sm font-medium hover:bg-[#375DEE]/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white/[0.02] rounded-2xl border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-white/20" />
          </div>
          <h3 className="text-lg font-bold mb-2">No templates yet</h3>
          <p className="text-white/50 mb-6">
            Create message templates for your reactivation campaigns
          </p>
          <button
            onClick={() => {
              setEditingTemplate(null)
              setShowEditor(true)
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] font-medium hover:bg-[#375DEE]/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6 hover:border-white/[0.12] transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      template.channel === "sms"
                        ? "bg-[#375DEE]/15 text-[#375DEE]"
                        : "bg-white/[0.06] text-white/60"
                    }`}
                  >
                    {template.channel === "sms" ? (
                      <Phone className="w-5 h-5" />
                    ) : (
                      <Mail className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">{template.name}</h3>
                    <p className="text-xs text-white/50 capitalize">
                      {template.template_type?.replace("_", " ")} • {template.channel.toUpperCase()}
                    </p>
                  </div>
                </div>
                {template.ai_generated && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-[#375DEE]/15 text-[#375DEE] rounded-lg text-xs border border-[#375DEE]/20">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                )}
              </div>

              {template.subject && (
                <p className="text-sm text-white/70 mb-2">
                  <span className="text-white/40">Subject:</span> {template.subject}
                </p>
              )}

              <p className="text-sm text-white/60 line-clamp-3 mb-4">{template.content}</p>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/40">Used <span>{template.times_used || 0}</span> times</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowEditor(true)
                    }}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-white/40 hover:text-white/70 hover:bg-white/[0.06] rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          userId={userId}
          template={editingTemplate}
          onClose={() => {
            setShowEditor(false)
            setEditingTemplate(null)
          }}
          onSuccess={() => {
            setShowEditor(false)
            setEditingTemplate(null)
            fetchTemplates()
          }}
        />
      )}
    </div>
  )
}

// Template Editor Component
function TemplateEditor({
  userId,
  template,
  onClose,
  onSuccess,
}: {
  userId: string
  template: Template | null
  onClose: () => void
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    template_type: template?.template_type || "win_back",
    channel: template?.channel || "sms",
    subject: template?.subject || "",
    content: template?.content || "",
    ai_tone: template?.ai_tone || "friendly",
  })

  const tones = [
    { value: "friendly", label: "Friendly" },
    { value: "professional", label: "Professional" },
    { value: "luxury", label: "Luxury" },
    { value: "energetic", label: "Energetic" },
  ]

  const handleGenerateWithAI = async () => {
    setGenerating(true)
    try {
      // Use the existing OpenRouter API for AI generation
      const response = await fetch("/api/reactivation/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_type: formData.template_type,
          tone: formData.ai_tone,
          channel: formData.channel,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, content: data.content })
      } else {
        // Fallback: generate a sample template
        const sampleTemplates: Record<string, Record<string, string>> = {
          win_back: {
            sms: `Hey {{name}}! It's been {{days_since_rental}} days since you drove the {{last_vehicle}} with us. We miss you! Come back and enjoy 15% off your next rental. Reply BOOK to get started!`,
            email: `Hi {{name}},\n\nWe noticed it's been a while since your last adventure with {{business_name}}. We'd love to have you back!\n\nAs a valued past customer, we're offering you an exclusive 15% discount on your next rental.\n\nYour last ride was the {{last_vehicle}} - ready for another unforgettable experience?\n\nUse code: {{offer_code}}\n\nBest,\n{{business_name}} Team`,
          },
          special_offer: {
            sms: `{{name}}, exclusive deal just for you! {{offer_amount}} off any exotic rental this weekend. Limited spots available. Reply YES to claim your spot!`,
            email: `Hi {{name}},\n\nWe have an exclusive offer just for you!\n\nGet {{offer_amount}} off any vehicle in our fleet. This weekend only.\n\nDon't miss out on this limited-time opportunity.\n\nUse code: {{offer_code}}\n\nBest,\n{{business_name}}`,
          },
          new_vehicle: {
            sms: `{{name}}! Big news - we just added a brand new ride to our fleet. You've got to see this one. Book a viewing today!`,
            email: `Hi {{name}},\n\nExciting news! We've just expanded our fleet with an incredible new addition.\n\nAs one of our valued customers, we wanted you to be among the first to know.\n\nBook now and be one of the first to experience it!\n\nBest,\n{{business_name}} Team`,
          },
          holiday: {
            sms: `Happy Holidays {{name}}! Celebrate in style with {{offer_amount}} off any rental. Make this season unforgettable. Book now!`,
            email: `Hi {{name}},\n\nHappy Holidays from {{business_name}}!\n\nCelebrate this special season in style with {{offer_amount}} off any rental in our fleet.\n\nMake memories that last a lifetime.\n\nUse code: {{offer_code}}\n\nWarm wishes,\n{{business_name}} Team`,
          },
          milestone: {
            sms: `{{name}}, happy anniversary! It's been amazing having you as a customer. Here's {{offer_amount}} off your next rental as our thank you!`,
            email: `Dear {{name}},\n\nHappy Anniversary!\n\nWe're celebrating another year of having you as part of the {{business_name}} family.\n\nTo show our appreciation, enjoy {{offer_amount}} off your next rental.\n\nThank you for choosing us!\n\nBest,\n{{business_name}} Team`,
          },
        }

        const templateContent =
          sampleTemplates[formData.template_type]?.[formData.channel] ||
          sampleTemplates.win_back[formData.channel]
        setFormData({ ...formData, content: templateContent })
      }
    } catch (error) {
      console.error("Error generating template:", error)
      alert("Failed to generate template. Please try again.")
    }
    setGenerating(false)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.content) {
      alert("Name and content are required")
      return
    }

    setSaving(true)

    const templateData = {
      user_id: userId,
      name: formData.name,
      description: formData.description || null,
      template_type: formData.template_type,
      channel: formData.channel,
      subject: formData.channel === "email" ? formData.subject : null,
      content: formData.content,
      ai_tone: formData.ai_tone,
      ai_generated: false,
    }

    let error
    if (template) {
      const result = await supabase
        .from("reactivation_templates")
        .update(templateData)
        .eq("id", template.id)
      error = result.error
    } else {
      const result = await supabase.from("reactivation_templates").insert(templateData)
      error = result.error
    }

    if (error) {
      console.error("Error saving template:", error)
      alert("Failed to save template")
    } else {
      onSuccess()
    }
    setSaving(false)
  }

  const insertVariable = (variable: string) => {
    setFormData({ ...formData, content: formData.content + variable })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-bold">
            {template ? "Edit Template" : "Create Template"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Win-Back SMS"
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">Template Type</label>
              <select
                value={formData.template_type}
                onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              >
                {templateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">AI Tone</label>
              <select
                value={formData.ai_tone}
                onChange={(e) => setFormData({ ...formData, ai_tone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              >
                {tones.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.channel === "email" && (
            <div>
              <label className="block text-sm text-white/50 mb-2">Email Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., {{name}}, we miss you!"
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 transition-colors"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white/50">Message Content *</label>
              <button
                onClick={handleGenerateWithAI}
                disabled={generating}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#375DEE]/15 text-[#375DEE] rounded-lg text-sm hover:bg-[#375DEE]/25 border border-[#375DEE]/20 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate with AI
              </button>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your message here... Use variables like {{name}} for personalization."
              rows={6}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]/50 resize-none font-mono text-sm transition-colors"
            />
            <p className="text-xs text-white/40 mt-1">
              {formData.channel === "sms"
                ? <><span>{formData.content.length}</span> characters (SMS limit: 160 per segment)</>
                : <><span>{formData.content.length}</span> characters</>}
            </p>
          </div>

          {/* Variables */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Available Variables</label>
            <div className="flex flex-wrap gap-2">
              {templateVariables.map((v) => (
                <button
                  key={v.variable}
                  onClick={() => insertVariable(v.variable)}
                  className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm hover:bg-white/[0.06] hover:border-[#375DEE]/30 transition-all group"
                  title={v.description}
                >
                  <code className="text-[#375DEE]">{v.variable}</code>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.content}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#375DEE]/15 border border-[#375DEE]/25 rounded-xl text-[#375DEE] font-medium hover:bg-[#375DEE]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
