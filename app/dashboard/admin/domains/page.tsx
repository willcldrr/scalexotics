"use client"

import { useState, useEffect, useCallback } from "react"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { createClient } from "@/lib/supabase/client"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import {
  Globe,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
  User,
  Building,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import { format } from "date-fns"

interface CustomDomain {
  id: string
  user_id: string
  domain: string
  verified: boolean
  verification_token: string
  ssl_status: string
  created_at: string
  profiles?: {
    company_name: string | null
    email: string | null
  }
}

interface UserProfile {
  id: string
  company_name: string | null
  email: string | null
  full_name: string | null
}

export default function AdminDomainsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null)
  const [newDomain, setNewDomain] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    domainId: string
    domainName: string
  }>({ open: false, domainId: "", domainName: "" })

  const showConfirm = (domainId: string, domainName: string) => {
    setConfirmModal({ open: true, domainId, domainName })
  }

  // Real-time subscription handlers
  const handleDomainInsert = useCallback((payload: { new: CustomDomain }) => {
    setDomains((prev) => {
      // Check if domain already exists to prevent duplicates
      if (prev.some((d) => d.id === payload.new.id)) {
        return prev
      }
      return [payload.new, ...prev]
    })
  }, [])

  const handleDomainUpdate = useCallback((payload: { new: CustomDomain }) => {
    setDomains((prev) =>
      prev.map((d) => (d.id === payload.new.id ? { ...d, ...payload.new } : d))
    )
    // Update selected domain if it's currently being viewed
    setSelectedDomain((prev) =>
      prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev
    )
  }, [])

  const handleDomainDelete = useCallback((payload: { old: { id: string } }) => {
    setDomains((prev) => prev.filter((d) => d.id !== payload.old.id))
    // Close modal if the deleted domain was selected
    setSelectedDomain((prev) => (prev?.id === payload.old.id ? null : prev))
  }, [])

  // Subscribe to real-time updates for custom_domains table
  useRealtimeSubscription<CustomDomain>({
    table: "custom_domains",
    enabled: isAdmin,
    onInsert: handleDomainInsert as any,
    onUpdate: handleDomainUpdate as any,
    onDelete: handleDomainDelete as any,
  })

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    try {
      // Use the auth status API which uses service role (bypasses RLS)
      const authStatusRes = await fetch("/api/auth/status")

      if (!authStatusRes.ok) {
        setLoading(false)
        return
      }

      const authStatus = await authStatusRes.json()

      if (!authStatus.authenticated || !authStatus.isAdmin) {
        setLoading(false)
        return
      }

      setIsAdmin(true)
      await Promise.all([fetchDomains(), fetchUsers()])
      setLoading(false)
    } catch (err) {
      console.error("[Domains] Error checking admin status:", err)
      setLoading(false)
    }
  }

  const fetchDomains = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) return

    const response = await fetch("/api/admin/domains", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      setDomains(data.domains || [])
    }
  }

  const fetchUsers = async () => {
    // Fetch all users with company names for the dropdown
    const { data } = await supabase
      .from("profiles")
      .select("id, company_name, email, full_name")
      .order("company_name", { ascending: true })

    if (data) {
      setUsers(data)
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim() || !selectedUserId) {
      setError("Please enter a domain and select a user")
      return
    }

    setSaving(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setError("Not authenticated")
      setSaving(false)
      return
    }

    const response = await fetch("/api/admin/domains", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: newDomain.trim(),
        userId: selectedUserId,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      await fetchDomains()
      setShowAddModal(false)
      setNewDomain("")
      setSelectedUserId("")
    } else {
      setError(data.error || "Failed to add domain")
    }

    setSaving(false)
  }

  const deleteDomain = async (domainId: string, domainName: string) => {
    setDeleting(domainId)

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setDeleting(null)
      return
    }

    const response = await fetch(`/api/admin/domains?id=${domainId}&domain=${domainName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (response.ok) {
      setDomains(domains.filter(d => d.id !== domainId))
    }

    setDeleting(null)
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const getStatusBadge = (domain: CustomDomain) => {
    if (domain.verified && domain.ssl_status === "active") {
      return {
        icon: CheckCircle,
        label: "Active",
        color: "bg-green-500/20 text-green-400",
      }
    }
    if (domain.ssl_status === "added_to_vercel") {
      return {
        icon: Clock,
        label: "Pending DNS",
        color: "bg-yellow-500/20 text-yellow-400",
      }
    }
    return {
      icon: AlertCircle,
      label: "Pending",
      color: "bg-orange-500/20 text-orange-400",
    }
  }

  const filteredDomains = domains.filter(domain =>
    domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Domain Management
          </h1>
          <p className="text-white/50 mt-1">Loading...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Access Denied
          </h1>
          <p className="text-white/50 mt-1">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Domain Management
          </h1>
          <p className="text-white/50 mt-1">{domains.length} custom domains configured</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] rounded-xl text-white font-medium hover:bg-[#375DEE]/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Domain
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#375DEE]" />
            </div>
            <div>
              <p className="text-sm text-white/50">Total Domains</p>
              <p className="text-2xl font-bold">{domains.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Active</p>
              <p className="text-2xl font-bold">
                {domains.filter(d => d.verified && d.ssl_status === "active").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Pending Setup</p>
              <p className="text-2xl font-bold">
                {domains.filter(d => !d.verified || d.ssl_status !== "active").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search domains or companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
        />
      </div>

      {/* Domain List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {filteredDomains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40">
            <Globe className="w-12 h-12 mb-3" />
            <p>No domains configured</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-[#375DEE] hover:underline"
            >
              Add your first domain
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredDomains.map((domain) => {
              const status = getStatusBadge(domain)
              return (
                <div
                  key={domain.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#375DEE]/20 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-[#375DEE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{domain.domain}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-white/50 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {domain.profiles?.company_name || "No company"}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {domain.profiles?.email || "No email"}
                        </span>
                        <span>Added {format(new Date(domain.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDomain(domain)}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => showConfirm(domain.id, domain.domain)}
                        disabled={deleting === domain.id}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                        title="Delete Domain"
                      >
                        {deleting === domain.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Custom Domain</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewDomain("")
                  setSelectedUserId("")
                  setError(null)
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-white/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  placeholder="rentals.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                />
                <p className="text-xs text-white/40 mt-1">
                  Enter the full domain (e.g., book.yourcompany.com)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Assign to Client
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE]"
                >
                  <option value="">Select a client...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.company_name || user.full_name || user.email || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-white/70 font-medium mb-2">Next Steps:</p>
                <ol className="text-sm text-white/50 space-y-1 list-decimal list-inside">
                  <li>Add the domain to Vercel (automatic if API configured)</li>
                  <li>Client configures DNS CNAME to cname.vercel-dns.com</li>
                  <li>SSL certificate will be provisioned automatically</li>
                </ol>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewDomain("")
                  setSelectedUserId("")
                  setError(null)
                }}
                className="px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addDomain}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#375DEE] rounded-xl text-white font-medium hover:bg-[#375DEE]/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Domain
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, domainId: "", domainName: "" })}
        onConfirm={() => {
          deleteDomain(confirmModal.domainId, confirmModal.domainName)
          setConfirmModal({ open: false, domainId: "", domainName: "" })
        }}
        title="Delete Domain"
        description={`Are you sure you want to delete ${confirmModal.domainName}? This will also remove it from Vercel.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon="delete"
      />

      {/* Domain Details Modal */}
      {selectedDomain && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedDomain.domain}</h2>
                <p className="text-sm text-white/50">
                  {selectedDomain.profiles?.company_name || "Unassigned"}
                </p>
              </div>
              <button
                onClick={() => setSelectedDomain(null)}
                className="p-2 rounded-lg hover:bg-white/5 text-white/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Status */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Status</span>
                  {(() => {
                    const status = getStatusBadge(selectedDomain)
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
                        <status.icon className="w-4 h-4" />
                        {status.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* DNS Instructions */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="font-bold mb-3">DNS Configuration</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                    <span className="text-white/50">Type</span>
                    <span className="font-mono">CNAME</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                    <span className="text-white/50">Name</span>
                    <span className="font-mono">{selectedDomain.domain.split(".")[0]}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                    <span className="text-white/50">Value</span>
                    <span className="font-mono">cname.vercel-dns.com</span>
                  </div>
                </div>
              </div>

              {/* Verification Token */}
              {selectedDomain.verification_token && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">Verification Token</h3>
                    <button
                      onClick={() => copyToken(selectedDomain.verification_token)}
                      className="text-sm text-[#375DEE] hover:underline flex items-center gap-1"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-white/50 break-all">
                    {selectedDomain.verification_token}
                  </p>
                </div>
              )}

              {/* Meta Info */}
              <div className="text-sm text-white/40 space-y-1">
                <p>Added: {format(new Date(selectedDomain.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
                <p>SSL Status: {selectedDomain.ssl_status}</p>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-between">
              <button
                onClick={() => showConfirm(selectedDomain.id, selectedDomain.domain)}
                disabled={deleting === selectedDomain.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
              >
                {deleting === selectedDomain.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Domain
              </button>
              <button
                onClick={() => setSelectedDomain(null)}
                className="px-6 py-2 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
