"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  X,
  Building2,
  User,
  Loader2,
} from "lucide-react"
import { crmStatusOptions, leadSourceOptions, type CRMLeadStatus } from "../lib/crm-status"
import type { CRMLead } from "./leads-tab"

interface LeadFormModalProps {
  lead: CRMLead | null
  onClose: () => void
  onSave: () => void
}

export default function LeadFormModal({ lead, onClose, onSave }: LeadFormModalProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    company_name: lead?.company_name || "",
    website: lead?.website || "",
    fleet_size: lead?.fleet_size?.toString() || "",
    location: lead?.location || "",
    contact_name: lead?.contact_name || "",
    contact_email: lead?.contact_email || "",
    contact_phone: lead?.contact_phone || "",
    contact_title: lead?.contact_title || "",
    source: lead?.source || "Referral",
    status: (lead?.status || "not_contacted") as CRMLeadStatus,
    lead_score: lead?.lead_score?.toString() || "0",
    estimated_value: lead?.estimated_value?.toString() || "",
    next_follow_up: lead?.next_follow_up ? lead.next_follow_up.split("T")[0] : "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const leadData = {
      user_id: user?.id,
      company_name: formData.company_name,
      website: formData.website || null,
      fleet_size: formData.fleet_size ? parseInt(formData.fleet_size) : null,
      location: formData.location || null,
      contact_name: formData.contact_name,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      contact_title: formData.contact_title || null,
      source: formData.source || null,
      status: formData.status,
      lead_score: formData.lead_score ? parseInt(formData.lead_score) : 0,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
      next_follow_up: formData.next_follow_up ? new Date(formData.next_follow_up).toISOString() : null,
    }

    let result
    if (lead) {
      result = await supabase
        .from("crm_leads")
        .update(leadData)
        .eq("id", lead.id)
    } else {
      result = await supabase
        .from("crm_leads")
        .insert(leadData)
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#375DEE]" />
            </div>
            <h2 className="text-xl font-bold">
              {lead ? "Edit Lead" : "Add New Lead"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/20 text-white/70 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Company Information */}
            <div>
              <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-white/60 mb-2">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Miami Exotic Rentals"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Website</label>
                  <input
                    type="text"
                    placeholder="www.example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Miami, FL"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Fleet Size</label>
                  <input
                    type="number"
                    placeholder="Number of vehicles"
                    value={formData.fleet_size}
                    onChange={(e) => setFormData({ ...formData, fleet_size: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Lead Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  >
                    {leadSourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-bold text-white/60 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Smith"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Owner, Fleet Manager, etc."
                    value={formData.contact_title}
                    onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Deal Information */}
            <div>
              <h3 className="text-sm font-bold text-white/60 mb-4">Deal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CRMLeadStatus })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  >
                    {crmStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={formData.lead_score}
                    onChange={(e) => setFormData({ ...formData, lead_score: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Estimated Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Next Follow-up</label>
                  <input
                    type="date"
                    value={formData.next_follow_up}
                    onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 font-semibold transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>{lead ? "Save Changes" : "Add Lead"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
