"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Copy,
  Check,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Settings,
  Palette,
  FileText,
  Car,
  X,
  Save,
  AlertCircle,
} from "lucide-react"

interface SurveyConfig {
  id: string
  slug: string
  business_name: string
  logo_url: string | null
  primary_color: string
  background_color: string
  collect_name: boolean
  collect_email: boolean
  collect_phone: boolean
  collect_age: boolean
  collect_dates: boolean
  collect_vehicle: boolean
  minimum_age: number
  require_email: boolean
  welcome_title: string
  welcome_subtitle: string
  success_title: string
  success_subtitle: string
  vehicle_ids: string[] | null
  is_active: boolean
  created_at: string
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
}

const defaultConfig: Partial<SurveyConfig> = {
  business_name: "",
  logo_url: null,
  primary_color: "#375DEE",
  background_color: "#0a0a0a",
  collect_name: true,
  collect_email: false,
  collect_phone: true,
  collect_age: true,
  collect_dates: true,
  collect_vehicle: true,
  minimum_age: 25,
  require_email: false,
  welcome_title: "Find Your Dream Ride",
  welcome_subtitle: "Answer a few questions to get started",
  success_title: "Thanks! We'll be in touch soon.",
  success_subtitle: "Check your phone for a text from us.",
  vehicle_ids: null,
  is_active: true,
}

export default function LeadCapturePage() {
  const supabase = createClient()
  const [surveys, setSurveys] = useState<SurveyConfig[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState<SurveyConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"general" | "fields" | "branding" | "messages">("general")

  const [formData, setFormData] = useState<Partial<SurveyConfig>>(defaultConfig)

  useEffect(() => {
    fetchSurveys()
    fetchVehicles()
  }, [])

  const fetchSurveys = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("survey_config")
      .select("*")
      .order("created_at", { ascending: false })

    setSurveys(data || [])
    setLoading(false)
  }

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("id, name, make, model, year")
      .eq("status", "available")
      .order("make", { ascending: true })

    setVehicles(data || [])
  }

  const openCreateModal = () => {
    setEditingSurvey(null)
    setFormData({ ...defaultConfig, slug: "" })
    setActiveTab("general")
    setShowModal(true)
  }

  const openEditModal = (survey: SurveyConfig) => {
    setEditingSurvey(survey)
    setFormData(survey)
    setActiveTab("general")
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.slug || !formData.business_name) {
      setMessage({ type: "error", text: "Slug and business name are required" })
      return
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(formData.slug)) {
      setMessage({ type: "error", text: "Slug can only contain lowercase letters, numbers, and hyphens" })
      return
    }

    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage({ type: "error", text: "Not authenticated" })
      setSaving(false)
      return
    }

    const surveyData = {
      user_id: user.id,
      slug: formData.slug,
      business_name: formData.business_name,
      logo_url: formData.logo_url || null,
      primary_color: formData.primary_color,
      background_color: formData.background_color,
      collect_name: formData.collect_name,
      collect_email: formData.collect_email,
      collect_phone: formData.collect_phone,
      collect_age: formData.collect_age,
      collect_dates: formData.collect_dates,
      collect_vehicle: formData.collect_vehicle,
      minimum_age: formData.minimum_age,
      require_email: formData.require_email,
      welcome_title: formData.welcome_title,
      welcome_subtitle: formData.welcome_subtitle,
      success_title: formData.success_title,
      success_subtitle: formData.success_subtitle,
      vehicle_ids: formData.vehicle_ids,
      is_active: formData.is_active,
    }

    if (editingSurvey) {
      const { error } = await supabase
        .from("survey_config")
        .update(surveyData)
        .eq("id", editingSurvey.id)

      if (error) {
        setMessage({ type: "error", text: error.message })
      } else {
        setMessage({ type: "success", text: "Survey updated successfully" })
        setShowModal(false)
        fetchSurveys()
      }
    } else {
      const { error } = await supabase
        .from("survey_config")
        .insert(surveyData)

      if (error) {
        if (error.code === "23505") {
          setMessage({ type: "error", text: "This slug is already in use" })
        } else {
          setMessage({ type: "error", text: error.message })
        }
      } else {
        setMessage({ type: "success", text: "Survey created successfully" })
        setShowModal(false)
        fetchSurveys()
      }
    }

    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this survey? This cannot be undone.")) return

    const { error } = await supabase.from("survey_config").delete().eq("id", id)

    if (!error) {
      setSurveys(surveys.filter((s) => s.id !== id))
      setMessage({ type: "success", text: "Survey deleted" })
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("survey_config")
      .update({ is_active: !isActive })
      .eq("id", id)

    if (!error) {
      setSurveys(surveys.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s)))
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getSurveyUrl = (slug: string) => {
    // This should be the rental survey domain
    return `https://rentalsurvey.xyz/${slug}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Lead Capture
          </h1>
          <p className="text-white/50 mt-1">Loading your surveys...</p>
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-48 mb-4" />
              <div className="h-4 bg-white/10 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Lead Capture
          </h1>
          <p className="text-white/50 mt-1">Configure surveys for your ad campaigns</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Survey
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Surveys List */}
      {surveys.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            No surveys yet
          </h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            Create your first lead capture survey to start collecting leads from your ad campaigns.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Survey
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className={`bg-white/5 rounded-2xl border p-6 ${
                survey.is_active ? "border-white/10" : "border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                      {survey.business_name}
                    </h3>
                    {!survey.is_active && (
                      <span className="px-2 py-0.5 text-xs rounded bg-white/10 text-white/50">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <code className="text-sm font-mono text-[#375DEE] bg-black/30 px-3 py-1.5 rounded-lg">
                      /{survey.slug}
                    </code>
                    <button
                      onClick={() => copyToClipboard(getSurveyUrl(survey.slug), survey.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === survey.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/50" />
                      )}
                    </button>
                    <a
                      href={getSurveyUrl(survey.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      title="Open survey"
                    >
                      <ExternalLink className="w-4 h-4 text-white/50" />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-white/10 text-white/60">
                      Min age: {survey.minimum_age}
                    </span>
                    {survey.collect_email && (
                      <span className="px-2 py-1 rounded bg-white/10 text-white/60">
                        Collects email
                      </span>
                    )}
                    {survey.collect_dates && (
                      <span className="px-2 py-1 rounded bg-white/10 text-white/60">
                        Collects dates
                      </span>
                    )}
                    {survey.vehicle_ids && survey.vehicle_ids.length > 0 && (
                      <span className="px-2 py-1 rounded bg-white/10 text-white/60">
                        {survey.vehicle_ids.length} vehicle{survey.vehicle_ids.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(survey.id, survey.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      survey.is_active
                        ? "hover:bg-white/10"
                        : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    }`}
                    title={survey.is_active ? "Deactivate" : "Activate"}
                  >
                    {survey.is_active ? (
                      <EyeOff className="w-4 h-4 text-white/50" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(survey)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4 text-white/50" />
                  </button>
                  <button
                    onClick={() => handleDelete(survey.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {editingSurvey ? "Edit Survey" : "Create Survey"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10 px-6">
              <div className="flex gap-1">
                {[
                  { id: "general", label: "General", icon: Settings },
                  { id: "fields", label: "Fields", icon: FileText },
                  { id: "branding", label: "Branding", icon: Palette },
                  { id: "messages", label: "Messages", icon: FileText },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-[#375DEE] text-white"
                        : "border-transparent text-white/50 hover:text-white"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* General Tab */}
              {activeTab === "general" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Survey URL Slug *</label>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">rentalsurvey.xyz/</span>
                      <input
                        type="text"
                        placeholder="miami-exotics"
                        value={formData.slug || ""}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                        disabled={!!editingSurvey}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors disabled:opacity-50"
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-2">Lowercase letters, numbers, and hyphens only</p>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Business Name *</label>
                    <input
                      type="text"
                      placeholder="Miami Exotic Rentals"
                      value={formData.business_name || ""}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Minimum Age</label>
                    <input
                      type="number"
                      min="18"
                      max="99"
                      value={formData.minimum_age || 25}
                      onChange={(e) => setFormData({ ...formData, minimum_age: parseInt(e.target.value) || 25 })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                    <p className="text-xs text-white/40 mt-2">Leads under this age will see a message they don't qualify</p>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Available Vehicles</label>
                    <p className="text-xs text-white/40 mb-3">Select which vehicles to show. Leave empty to show all.</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {vehicles.map((vehicle) => (
                        <label key={vehicle.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.vehicle_ids?.includes(vehicle.id) || false}
                            onChange={(e) => {
                              const currentIds = formData.vehicle_ids || []
                              if (e.target.checked) {
                                setFormData({ ...formData, vehicle_ids: [...currentIds, vehicle.id] })
                              } else {
                                setFormData({ ...formData, vehicle_ids: currentIds.filter((id) => id !== vehicle.id) })
                              }
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#375DEE] focus:ring-[#375DEE]"
                          />
                          <span>{vehicle.year} {vehicle.make} {vehicle.model}</span>
                        </label>
                      ))}
                      {vehicles.length === 0 && (
                        <p className="text-white/40 text-sm">No vehicles added yet. Add vehicles in the Vehicles section.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fields Tab */}
              {activeTab === "fields" && (
                <div className="space-y-4">
                  <p className="text-white/50 text-sm mb-4">Choose which fields to collect from leads</p>

                  {[
                    { key: "collect_name", label: "Name", description: "Lead's full name", required: true },
                    { key: "collect_phone", label: "Phone", description: "Phone number for SMS follow-up", required: true },
                    { key: "collect_email", label: "Email", description: "Email address" },
                    { key: "collect_age", label: "Age", description: "Verify they meet minimum age" },
                    { key: "collect_vehicle", label: "Vehicle Selection", description: "Which car they're interested in" },
                    { key: "collect_dates", label: "Rental Dates", description: "When they want to rent" },
                  ].map((field) => (
                    <label
                      key={field.key}
                      className={`flex items-center justify-between p-4 rounded-xl bg-white/5 transition-colors ${
                        field.required ? "opacity-70 cursor-not-allowed" : "hover:bg-white/10 cursor-pointer"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{field.label}</p>
                        <p className="text-sm text-white/40">{field.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={(formData as any)[field.key] || false}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })}
                        disabled={field.required}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#375DEE] focus:ring-[#375DEE]"
                      />
                    </label>
                  ))}

                  {formData.collect_email && (
                    <label className="flex items-center justify-between p-4 rounded-xl bg-[#375DEE]/10 border border-[#375DEE]/30 cursor-pointer">
                      <div>
                        <p className="font-medium">Require Email</p>
                        <p className="text-sm text-white/40">Make email a required field</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.require_email || false}
                        onChange={(e) => setFormData({ ...formData, require_email: e.target.checked })}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#375DEE] focus:ring-[#375DEE]"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Branding Tab */}
              {activeTab === "branding" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Logo URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.logo_url || ""}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Primary Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.primary_color || "#375DEE"}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={formData.primary_color || "#375DEE"}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#375DEE] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-2">Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.background_color || "#0a0a0a"}
                          onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={formData.background_color || "#0a0a0a"}
                          onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#375DEE] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-6">
                    <label className="block text-sm text-white/60 mb-2">Preview</label>
                    <div
                      className="rounded-xl p-6 border border-white/10"
                      style={{ backgroundColor: formData.background_color }}
                    >
                      {formData.logo_url && (
                        <img src={formData.logo_url} alt="Logo" className="h-8 mb-4" />
                      )}
                      <h3 className="text-xl font-bold mb-2" style={{ color: formData.primary_color }}>
                        {formData.business_name || "Your Business"}
                      </h3>
                      <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        Sample Button
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === "messages" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Welcome Title</label>
                    <input
                      type="text"
                      placeholder="Find Your Dream Ride"
                      value={formData.welcome_title || ""}
                      onChange={(e) => setFormData({ ...formData, welcome_title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Welcome Subtitle</label>
                    <input
                      type="text"
                      placeholder="Answer a few questions to get started"
                      value={formData.welcome_subtitle || ""}
                      onChange={(e) => setFormData({ ...formData, welcome_subtitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Success Title</label>
                    <input
                      type="text"
                      placeholder="Thanks! We'll be in touch soon."
                      value={formData.success_title || ""}
                      onChange={(e) => setFormData({ ...formData, success_title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Success Subtitle</label>
                    <input
                      type="text"
                      placeholder="Check your phone for a text from us."
                      value={formData.success_subtitle || ""}
                      onChange={(e) => setFormData({ ...formData, success_subtitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : editingSurvey ? "Update Survey" : "Create Survey"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
