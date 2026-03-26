"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import { toast } from "sonner"
import {
  Building2,
  Globe,
  CreditCard,
  Search,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface Business {
  id: string
  name: string
  slug: string
  owner_user_id: string | null
  payment_domain: string | null
  domain_status: "pending" | "active" | "suspended"
  stripe_publishable_key: string | null
  stripe_secret_key: string | null
  stripe_connected: boolean
  logo_url: string | null
  primary_color: string
  secondary_color: string
  phone: string | null
  email: string | null
  address: string | null
  business_hours: string | null
  deposit_percentage: number
  created_at: string
  updated_at: string
  status: "active" | "inactive" | "suspended" | "pending"
}

const emptyBusiness: Partial<Business> = {
  name: "",
  slug: "",
  payment_domain: "",
  domain_status: "pending",
  stripe_publishable_key: "",
  stripe_secret_key: "",
  stripe_connected: false,
  logo_url: "",
  primary_color: "#FFFFFF",
  secondary_color: "#000000",
  phone: "",
  email: "",
  address: "",
  business_hours: "9 AM - 8 PM, 7 days a week",
  deposit_percentage: 25,
  status: "active",
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Business>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBusiness, setNewBusiness] = useState<Partial<Business>>(emptyBusiness)
  const [saving, setSaving] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description: string
    confirmText: string
    variant: "danger" | "warning" | "info"
    icon: "delete" | "suspend" | "warning" | "logout" | "info"
    onConfirm: () => void
    loading: boolean
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "danger",
    icon: "warning",
    onConfirm: () => {},
    loading: false,
  })

  const showConfirm = (config: Omit<typeof confirmModal, "open" | "loading">) => {
    setConfirmModal({ ...config, open: true, loading: false })
  }

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, open: false, loading: false }))
  }

  const handleConfirm = async () => {
    setConfirmModal(prev => ({ ...prev, loading: true }))
    await confirmModal.onConfirm()
    closeConfirm()
  }

  const supabase = createClient()

  useEffect(() => {
    fetchBusinesses()
  }, [])

  // Real-time subscription for instant updates
  const handleInsert = useCallback((payload: { new: Business }) => {
    console.log("[Realtime] Business inserted")
    setBusinesses(prev => [payload.new, ...prev])
  }, [])

  const handleUpdate = useCallback((payload: { new: Business }) => {
    console.log("[Realtime] Business updated")
    setBusinesses(prev =>
      prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b)
    )
  }, [])

  const handleRealtimeDelete = useCallback((payload: { old: { id: string } }) => {
    console.log("[Realtime] Business deleted")
    setBusinesses(prev => prev.filter(b => b.id !== payload.old.id))
  }, [])

  useRealtimeSubscription<Business>({
    table: "businesses",
    onInsert: handleInsert as any,
    onUpdate: handleUpdate as any,
    onDelete: handleRealtimeDelete as any,
  })

  const fetchBusinesses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching businesses:", error)
    } else {
      setBusinesses(data || [])
    }
    setLoading(false)
  }

  const handleSave = async (business: Partial<Business>) => {
    setSaving(true)
    const { error } = await supabase
      .from("businesses")
      .update({
        name: business.name,
        slug: business.slug,
        payment_domain: business.payment_domain || null,
        domain_status: business.domain_status,
        stripe_publishable_key: business.stripe_publishable_key || null,
        stripe_secret_key: business.stripe_secret_key || null,
        stripe_connected: !!(business.stripe_publishable_key && business.stripe_secret_key),
        logo_url: business.logo_url || null,
        primary_color: business.primary_color,
        secondary_color: business.secondary_color,
        phone: business.phone || null,
        email: business.email || null,
        address: business.address || null,
        business_hours: business.business_hours || null,
        deposit_percentage: business.deposit_percentage,
        status: business.status,
      })
      .eq("id", business.id)

    if (error) {
      console.error("Error updating business:", error)
      toast.error("Failed to save", { description: error.message })
    } else {
      toast.success("Business updated successfully")
      setEditingId(null)
      fetchBusinesses()
    }
    setSaving(false)
  }

  const handleAdd = async () => {
    if (!newBusiness.name || !newBusiness.slug) {
      toast.error("Missing required fields", { description: "Name and slug are required" })
      return
    }

    setSaving(true)
    const { error } = await supabase.from("businesses").insert({
      name: newBusiness.name,
      slug: newBusiness.slug,
      payment_domain: newBusiness.payment_domain || null,
      domain_status: newBusiness.domain_status || "pending",
      stripe_publishable_key: newBusiness.stripe_publishable_key || null,
      stripe_secret_key: newBusiness.stripe_secret_key || null,
      stripe_connected: !!(newBusiness.stripe_publishable_key && newBusiness.stripe_secret_key),
      logo_url: newBusiness.logo_url || null,
      primary_color: newBusiness.primary_color || "#FFFFFF",
      secondary_color: newBusiness.secondary_color || "#000000",
      phone: newBusiness.phone || null,
      email: newBusiness.email || null,
      address: newBusiness.address || null,
      business_hours: newBusiness.business_hours || null,
      deposit_percentage: newBusiness.deposit_percentage || 25,
      status: "active",
    })

    if (error) {
      console.error("Error adding business:", error)
      toast.error("Failed to add business", { description: error.message })
    } else {
      toast.success("Business added successfully")
      setShowAddForm(false)
      setNewBusiness(emptyBusiness)
      fetchBusinesses()
    }
    setSaving(false)
  }

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("businesses")
      .update({ status: "active" })
      .eq("id", id)

    if (error) {
      console.error("Error approving business:", error)
      toast.error("Failed to approve", { description: error.message })
    } else {
      toast.success("Business approved")
      fetchBusinesses()
    }
  }

  const handleDeny = (id: string) => {
    showConfirm({
      title: "Deny Application",
      description: "Are you sure you want to deny this application? The user will not be able to access the dashboard.",
      confirmText: "Deny",
      variant: "danger",
      icon: "suspend",
      onConfirm: async () => {
        const { error } = await supabase
          .from("businesses")
          .update({ status: "suspended" })
          .eq("id", id)

        if (error) {
          console.error("Error denying business:", error)
          toast.error("Failed to deny", { description: error.message })
        } else {
          toast.success("Application denied")
          fetchBusinesses()
        }
      },
    })
  }

  const handleDelete = (id: string) => {
    showConfirm({
      title: "Delete Business",
      description: "Are you sure you want to delete this business? This cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
      icon: "delete",
      onConfirm: async () => {
        const { error } = await supabase.from("businesses").delete().eq("id", id)

        if (error) {
          console.error("Error deleting business:", error)
          toast.error("Failed to delete", { description: error.message })
        } else {
          toast.success("Business deleted")
          fetchBusinesses()
        }
      },
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.payment_domain?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDomainStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        )
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )
      case "suspended":
        return (
          <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Suspended
          </span>
        )
      default:
        return null
    }
  }

  const BusinessForm = ({
    business,
    onChange,
    onSave,
    onCancel,
    isNew = false,
  }: {
    business: Partial<Business>
    onChange: (b: Partial<Business>) => void
    onSave: () => void
    onCancel: () => void
    isNew?: boolean
  }) => (
    <div className="space-y-4 p-4 bg-white/[0.02] rounded-xl border border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white/60 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Business Info
          </h4>
          <div>
            <label className="block text-xs text-white/40 mb-1">Business Name *</label>
            <input
              type="text"
              value={business.name || ""}
              onChange={(e) => onChange({ ...business, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none"
              placeholder="Exotic Car Rentals"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Slug * (URL identifier)</label>
            <input
              type="text"
              value={business.slug || ""}
              onChange={(e) =>
                onChange({ ...business, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:border-white/30 focus:outline-none"
              placeholder="exotic-car-rentals"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Email</label>
            <input
              type="email"
              value={business.email || ""}
              onChange={(e) => onChange({ ...business, email: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none"
              placeholder="contact@exoticrentals.com"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Phone</label>
            <input
              type="text"
              value={business.phone || ""}
              onChange={(e) => onChange({ ...business, phone: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Domain & Stripe */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white/60 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Domain & Payments
          </h4>
          <div>
            <label className="block text-xs text-white/40 mb-1">Payment Domain</label>
            <input
              type="text"
              value={business.payment_domain || ""}
              onChange={(e) => onChange({ ...business, payment_domain: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none"
              placeholder="exoticrentalspayments.com"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Domain Status</label>
            <select
              value={business.domain_status || "pending"}
              onChange={(e) => onChange({ ...business, domain_status: e.target.value as any })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Stripe Publishable Key</label>
            <input
              type="text"
              value={business.stripe_publishable_key || ""}
              onChange={(e) => onChange({ ...business, stripe_publishable_key: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:border-white/30 focus:outline-none"
              placeholder="pk_live_..."
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Stripe Secret Key</label>
            <div className="relative">
              <input
                type={showSecrets[business.id || "new"] ? "text" : "password"}
                value={business.stripe_secret_key || ""}
                onChange={(e) => onChange({ ...business, stripe_secret_key: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:border-white/30 focus:outline-none"
                placeholder="sk_live_..."
              />
              <button
                type="button"
                onClick={() =>
                  setShowSecrets((prev) => ({ ...prev, [business.id || "new"]: !prev[business.id || "new"] }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showSecrets[business.id || "new"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Branding & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <div>
          <label className="block text-xs text-white/40 mb-1">Logo URL</label>
          <input
            type="text"
            value={business.logo_url || ""}
            onChange={(e) => onChange({ ...business, logo_url: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Primary Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={business.primary_color || "#FFFFFF"}
              onChange={(e) => onChange({ ...business, primary_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={business.primary_color || "#FFFFFF"}
              onChange={(e) => onChange({ ...business, primary_color: e.target.value })}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-mono focus:border-white/30 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Deposit %</label>
          <input
            type="number"
            value={business.deposit_percentage || 25}
            onChange={(e) => onChange({ ...business, deposit_percentage: parseInt(e.target.value) || 25 })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none"
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Status */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs text-white/40 mb-1">Business Status</label>
            <select
              value={business.status || "active"}
              onChange={(e) => onChange({ ...business, status: e.target.value as any })}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-white/30 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg text-sm hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : isNew ? "Add Business" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Businesses</h1>
          <p className="text-sm text-white/40">Configure domains, Stripe keys, and branding for each client</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg text-sm hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Business
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search businesses..."
          className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm focus:border-white/20 focus:outline-none"
        />
      </div>

      {/* Add New Form */}
      {showAddForm && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add New Business
          </h3>
          <BusinessForm
            business={newBusiness}
            onChange={setNewBusiness}
            onSave={handleAdd}
            onCancel={() => {
              setShowAddForm(false)
              setNewBusiness(emptyBusiness)
            }}
            isNew
          />
        </div>
      )}

      {/* Pending Approvals Section */}
      {businesses.filter((b) => b.status === "pending").length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-400">Pending Approvals</h2>
              <p className="text-sm text-white/50">
                {businesses.filter((b) => b.status === "pending").length} new account{businesses.filter((b) => b.status === "pending").length !== 1 ? "s" : ""} awaiting review
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {businesses
              .filter((b) => b.status === "pending")
              .map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between bg-black/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: business.primary_color + "20", color: business.primary_color }}
                    >
                      {business.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{business.name}</h3>
                      <p className="text-sm text-white/50">{business.email}</p>
                      <p className="text-xs text-white/30">
                        Applied {new Date(business.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(business.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-500/30"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(business.id)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400 rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Deny
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-2xl font-bold">{businesses.filter((b) => b.status !== "pending").length}</p>
          <p className="text-xs text-white/40">Active Businesses</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">
            {businesses.filter((b) => b.status === "pending").length}
          </p>
          <p className="text-xs text-white/40">Pending Approval</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {businesses.filter((b) => b.domain_status === "active").length}
          </p>
          <p className="text-xs text-white/40">Active Domains</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">
            {businesses.filter((b) => b.stripe_connected).length}
          </p>
          <p className="text-xs text-white/40">Stripe Connected</p>
        </div>
      </div>

      {/* Business List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-white/40">Loading businesses...</div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">
              {searchQuery ? "No businesses match your search" : "No businesses yet"}
            </p>
          </div>
        ) : (
          filteredBusinesses.map((business) => (
            <div
              key={business.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
            >
              {/* Header Row */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedId(expandedId === business.id ? null : business.id)}
              >
                <div className="flex items-center gap-4">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: business.primary_color + "20", color: business.primary_color }}
                    >
                      {business.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{business.name}</h3>
                    <p className="text-xs text-white/40 font-mono">{business.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Domain */}
                  <div className="hidden md:flex items-center gap-2">
                    <Globe className="w-4 h-4 text-white/40" />
                    {business.payment_domain ? (
                      <span className="text-sm">{business.payment_domain}</span>
                    ) : (
                      <span className="text-sm text-white/30">No domain</span>
                    )}
                    {getDomainStatusBadge(business.domain_status)}
                  </div>

                  {/* Stripe Status */}
                  <div className="hidden md:flex items-center gap-2">
                    <CreditCard className={`w-4 h-4 ${business.stripe_connected ? "text-green-400" : "text-white/40"}`} />
                    {business.stripe_connected ? (
                      <span className="text-xs text-green-400">Connected</span>
                    ) : (
                      <span className="text-xs text-white/40">Not connected</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(business.id)
                        setEditForm(business)
                        setExpandedId(business.id)
                      }}
                      className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(business.id)
                      }}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedId === business.id ? (
                      <ChevronUp className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === business.id && (
                <div className="border-t border-white/[0.06] p-4">
                  {editingId === business.id ? (
                    <BusinessForm
                      business={editForm}
                      onChange={setEditForm}
                      onSave={() => handleSave(editForm)}
                      onCancel={() => {
                        setEditingId(null)
                        setEditForm({})
                      }}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Domain Info */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-white/60 flex items-center gap-2">
                          <Globe className="w-4 h-4" /> Domain
                        </h4>
                        {business.payment_domain ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://${business.payment_domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1"
                              >
                                {business.payment_domain}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                onClick={() => copyToClipboard(business.payment_domain!)}
                                className="p-1 text-white/40 hover:text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            {getDomainStatusBadge(business.domain_status)}
                          </div>
                        ) : (
                          <p className="text-white/40 text-sm">No domain configured</p>
                        )}
                      </div>

                      {/* Stripe Info */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-white/60 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Stripe
                        </h4>
                        {business.stripe_connected ? (
                          <div className="space-y-2">
                            <p className="text-green-400 text-sm flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Connected
                            </p>
                            <p className="text-xs text-white/40 font-mono">
                              {business.stripe_publishable_key?.slice(0, 20)}...
                            </p>
                          </div>
                        ) : (
                          <p className="text-white/40 text-sm">Not connected</p>
                        )}
                      </div>

                      {/* Settings */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-white/60">Settings</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-white/40">Deposit:</span> {business.deposit_percentage}%
                          </p>
                          <p>
                            <span className="text-white/40">Status:</span>{" "}
                            <span
                              className={
                                business.status === "active"
                                  ? "text-green-400"
                                  : business.status === "suspended"
                                  ? "text-red-400"
                                  : "text-white/60"
                              }
                            >
                              {business.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        onClose={closeConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        icon={confirmModal.icon}
        onConfirm={handleConfirm}
        loading={confirmModal.loading}
      />
    </div>
  )
}
