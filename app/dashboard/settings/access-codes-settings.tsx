"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Copy,
  Check,
  Trash2,
  Key,
  Clock,
  User,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react"

interface AccessCode {
  id: string
  code: string
  name: string | null
  created_at: string
  expires_at: string | null
  used_at: string | null
  used_by: string | null
  is_active: boolean
  max_uses: number
  use_count: number
  profile?: {
    full_name: string | null
    email: string | null
    company_name: string | null
  } | null
}

export default function AccessCodesSettings() {
  const supabase = createClient()
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newCode, setNewCode] = useState({
    name: "",
    expiresIn: "never", // "never", "7d", "30d", "90d"
    maxUses: 1,
  })

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("access_codes")
      .select(`
        *,
        profile:used_by (
          full_name,
          email,
          company_name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching codes:", error)
      setMessage({ type: "error", text: "Failed to load access codes" })
    } else {
      setCodes(data || [])
    }
    setLoading(false)
  }

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing chars like 0, O, 1, I
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreateCode = async () => {
    setGenerating(true)
    setMessage(null)

    const code = generateCode()

    let expiresAt: string | null = null
    if (newCode.expiresIn !== "never") {
      const days = parseInt(newCode.expiresIn)
      const date = new Date()
      date.setDate(date.getDate() + days)
      expiresAt = date.toISOString()
    }

    const { error } = await supabase.from("access_codes").insert({
      code,
      name: newCode.name || null,
      expires_at: expiresAt,
      max_uses: newCode.maxUses,
      is_active: true,
    })

    if (error) {
      if (error.code === "23505") {
        // Duplicate code, try again
        handleCreateCode()
        return
      }
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: `Access code ${code} created!` })
      setShowModal(false)
      setNewCode({ name: "", expiresIn: "never", maxUses: 1 })
      fetchCodes()
    }

    setGenerating(false)
  }

  const handleRevokeCode = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this code? It will no longer work.")) return

    const { error } = await supabase
      .from("access_codes")
      .update({ is_active: false })
      .eq("id", id)

    if (!error) {
      setCodes(codes.map((c) => (c.id === id ? { ...c, is_active: false } : c)))
      setMessage({ type: "success", text: "Code revoked" })
    }
  }

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this code?")) return

    const { error } = await supabase.from("access_codes").delete().eq("id", id)

    if (!error) {
      setCodes(codes.filter((c) => c.id !== id))
      setMessage({ type: "success", text: "Code deleted" })
    }
  }

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const getStatusBadge = (code: AccessCode) => {
    if (!code.is_active) {
      return <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">Revoked</span>
    }
    if (isExpired(code.expires_at)) {
      return <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400">Expired</span>
    }
    if (code.use_count >= code.max_uses) {
      return <span className="px-2 py-0.5 text-xs rounded bg-[#375DEE]/20 text-[#375DEE]">Used</span>
    }
    return <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400">Active</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white/50">Generate and manage access codes for new clients</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:opacity-90 text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Generate Code
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/[0.08]">
          <p className="text-white/40 text-xs mb-1">Total Codes</p>
          <p className="text-2xl font-bold">{codes.length}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/[0.08]">
          <p className="text-white/40 text-xs mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">
            {codes.filter((c) => c.is_active && !isExpired(c.expires_at) && c.use_count < c.max_uses).length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/[0.08]">
          <p className="text-white/40 text-xs mb-1">Used</p>
          <p className="text-2xl font-bold text-[#375DEE]">
            {codes.filter((c) => c.use_count > 0).length}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/[0.08]">
          <p className="text-white/40 text-xs mb-1">Revoked</p>
          <p className="text-2xl font-bold text-red-400">
            {codes.filter((c) => !c.is_active).length}
          </p>
        </div>
      </div>

      {/* Codes List */}
      {codes.length === 0 ? (
        <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] p-12 text-center">
          <Key className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">
            No access codes yet
          </h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            Generate your first access code to invite clients to the dashboard.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#375DEE] hover:opacity-90 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Generate Code
          </button>
        </div>
      ) : (
        <div className="bg-black rounded-2xl border border-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left text-xs text-white/40 font-medium px-6 py-4">Code</th>
                  <th className="text-left text-xs text-white/40 font-medium px-6 py-4">Label</th>
                  <th className="text-left text-xs text-white/40 font-medium px-6 py-4">Status</th>
                  <th className="text-left text-xs text-white/40 font-medium px-6 py-4">Used By</th>
                  <th className="text-left text-xs text-white/40 font-medium px-6 py-4">Expires</th>
                  <th className="text-left text-xs text-white/40 font-medium px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-[#375DEE] bg-[#375DEE]/10 px-3 py-1.5 rounded-lg">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(code.code, code.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="Copy code"
                        >
                          {copiedId === code.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/70">
                        {code.name || <span className="text-white/30">—</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(code)}</td>
                    <td className="px-6 py-4">
                      {code.profile ? (
                        <div>
                          <p className="text-sm text-white">
                            {code.profile.full_name || code.profile.email}
                          </p>
                          {code.profile.company_name && (
                            <p className="text-xs text-white/40">{code.profile.company_name}</p>
                          )}
                        </div>
                      ) : code.used_at ? (
                        <span className="text-sm text-white/50">Unknown user</span>
                      ) : (
                        <span className="text-sm text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/70">
                        {code.expires_at ? formatDate(code.expires_at) : "Never"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {code.is_active && code.use_count < code.max_uses && (
                          <button
                            onClick={() => handleRevokeCode(code.id)}
                            className="p-2 rounded-lg hover:bg-orange-500/10 text-orange-400 transition-colors"
                            title="Revoke"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCode(code.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.08] w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Generate Access Code
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">Label (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Miami Exotics, John's Fleet"
                  value={newCode.name}
                  onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] transition-colors"
                />
                <p className="text-xs text-white/40 mt-1">Help you identify who this code is for</p>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Expires</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "never", label: "Never" },
                    { value: "7", label: "7 days" },
                    { value: "30", label: "30 days" },
                    { value: "90", label: "90 days" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setNewCode({ ...newCode, expiresIn: option.value })}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        newCode.expiresIn === option.value
                          ? "bg-[#375DEE] text-white"
                          : "bg-white/5 text-white/60 hover:text-white border border-white/[0.08]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Max Uses</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 999].map((num) => (
                    <button
                      key={num}
                      onClick={() => setNewCode({ ...newCode, maxUses: num })}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        newCode.maxUses === num
                          ? "bg-[#375DEE] text-white"
                          : "bg-white/5 text-white/60 hover:text-white border border-white/[0.08]"
                      }`}
                    >
                      {num === 999 ? "Unlimited" : num === 1 ? "Single use" : `${num} uses`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/[0.08] flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCode}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#375DEE] hover:opacity-90 disabled:opacity-50 font-semibold transition-colors"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {generating ? "Generating..." : "Generate Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
