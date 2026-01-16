"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Copy,
  Check,
  Trash2,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface Invoice {
  id: string
  invoice_number: string
  type: "retainer" | "booking"
  base_amount: number
  ad_spend_rate: number | null
  ad_spend_days: number | null
  ad_spend_total: number | null
  total_amount: number
  booking_description: string | null
  client_name: string
  client_email: string | null
  client_phone: string | null
  status: "pending" | "paid" | "cancelled"
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

const AD_SPEND_OPTIONS = [
  { value: 0, label: "No Ad Spend" },
  { value: 20, label: "$20/day" },
  { value: 35, label: "$35/day" },
  { value: 50, label: "$50/day" },
]

export default function AdminInvoicesPage() {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showModal, setShowModal] = useState(false)

  const [newInvoice, setNewInvoice] = useState({
    type: "retainer" as "retainer" | "booking",
    bookingDescription: "",
    bookingAmount: "",
    adSpendRate: 0,
    adSpendDays: 30,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
    dueDate: "",
  })

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      setLoading(false)
      return
    }

    setIsAdmin(true)
    await fetchInvoices()
    setLoading(false)
  }

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("client_invoices")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error)
      setMessage({ type: "error", text: "Failed to load invoices" })
    } else {
      setInvoices(data || [])
    }
  }

  const calculateTotal = () => {
    let base = newInvoice.type === "retainer" ? 1500 : parseFloat(newInvoice.bookingAmount) || 0
    let adSpendTotal = newInvoice.adSpendRate * newInvoice.adSpendDays
    return base + adSpendTotal
  }

  const handleCreateInvoice = async () => {
    if (!newInvoice.clientName.trim()) {
      setMessage({ type: "error", text: "Client name is required" })
      return
    }

    if (newInvoice.type === "booking" && !newInvoice.bookingAmount) {
      setMessage({ type: "error", text: "Booking amount is required" })
      return
    }

    setCreating(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()

    const baseAmount = newInvoice.type === "retainer" ? 1500 : parseFloat(newInvoice.bookingAmount)
    const adSpendTotal = newInvoice.adSpendRate > 0 ? newInvoice.adSpendRate * newInvoice.adSpendDays : null

    const { data, error } = await supabase
      .from("client_invoices")
      .insert({
        type: newInvoice.type,
        base_amount: baseAmount,
        ad_spend_rate: newInvoice.adSpendRate > 0 ? newInvoice.adSpendRate : null,
        ad_spend_days: newInvoice.adSpendRate > 0 ? newInvoice.adSpendDays : null,
        ad_spend_total: adSpendTotal,
        total_amount: baseAmount + (adSpendTotal || 0),
        booking_description: newInvoice.type === "booking" ? newInvoice.bookingDescription : null,
        client_name: newInvoice.clientName,
        client_email: newInvoice.clientEmail || null,
        client_phone: newInvoice.clientPhone || null,
        notes: newInvoice.notes || null,
        due_date: newInvoice.dueDate || null,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating invoice:", error)
      setMessage({ type: "error", text: "Failed to create invoice" })
    } else {
      setMessage({ type: "success", text: "Invoice created successfully!" })
      setShowModal(false)
      setNewInvoice({
        type: "retainer",
        bookingDescription: "",
        bookingAmount: "",
        adSpendRate: 0,
        adSpendDays: 30,
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        notes: "",
        dueDate: "",
      })
      fetchInvoices()
    }

    setCreating(false)
  }

  const copyPaymentLink = async (invoiceId: string) => {
    const link = `${window.location.origin}/pay/${invoiceId}`
    await navigator.clipboard.writeText(link)
    setCopiedId(invoiceId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const updateStatus = async (invoiceId: string, status: "pending" | "paid" | "cancelled") => {
    const updates: any = { status }
    if (status === "paid") {
      updates.paid_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("client_invoices")
      .update(updates)
      .eq("id", invoiceId)

    if (error) {
      setMessage({ type: "error", text: "Failed to update invoice" })
    } else {
      fetchInvoices()
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return

    const { error } = await supabase
      .from("client_invoices")
      .delete()
      .eq("id", invoiceId)

    if (error) {
      setMessage({ type: "error", text: "Failed to delete invoice" })
    } else {
      setMessage({ type: "success", text: "Invoice deleted" })
      fetchInvoices()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Stats
  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "pending").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    revenue: invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total_amount, 0),
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Client Invoices
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
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
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
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Client Invoices
          </h1>
          <p className="text-white/50 mt-1">Create and manage client invoices</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-white/50 text-sm">Total Invoices</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-white/50 text-sm">Pending</div>
          <div className="text-2xl font-bold mt-1 text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-white/50 text-sm">Paid</div>
          <div className="text-2xl font-bold mt-1 text-green-400">{stats.paid}</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="text-white/50 text-sm">Total Revenue</div>
          <div className="text-2xl font-bold mt-1 text-[#375DEE]">{formatCurrency(stats.revenue)}</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet</p>
            <p className="text-sm mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Invoice</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Client</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Type</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Amount</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-white/50 px-4 py-3">Created</th>
                  <th className="text-right text-sm font-medium text-white/50 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{invoice.client_name}</div>
                      {invoice.client_email && (
                        <div className="text-sm text-white/50">{invoice.client_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.type === "retainer"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {invoice.type === "retainer" ? "Retainer" : "Booking"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{formatCurrency(invoice.total_amount)}</div>
                      {invoice.ad_spend_total && (
                        <div className="text-xs text-white/50">
                          (incl. {formatCurrency(invoice.ad_spend_total)} ad spend)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : invoice.status === "cancelled"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {invoice.status === "paid" && <CheckCircle className="w-3 h-3" />}
                        {invoice.status === "cancelled" && <XCircle className="w-3 h-3" />}
                        {invoice.status === "pending" && <Clock className="w-3 h-3" />}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyPaymentLink(invoice.id)}
                          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy payment link"
                        >
                          {copiedId === invoice.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={`/pay/${invoice.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="View payment page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {invoice.status === "pending" && (
                          <button
                            onClick={() => updateStatus(invoice.id, "paid")}
                            className="p-2 text-white/50 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Mark as paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteInvoice(invoice.id)}
                          className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete invoice"
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
        )}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold">Create Invoice</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Type */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Invoice Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewInvoice({ ...newInvoice, type: "retainer" })}
                    className={`p-4 rounded-xl border transition-colors text-left ${
                      newInvoice.type === "retainer"
                        ? "border-[#375DEE] bg-[#375DEE]/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="font-medium">Retainer</div>
                    <div className="text-sm text-white/50 mt-1">$1,500 flat fee</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewInvoice({ ...newInvoice, type: "booking" })}
                    className={`p-4 rounded-xl border transition-colors text-left ${
                      newInvoice.type === "booking"
                        ? "border-[#375DEE] bg-[#375DEE]/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="font-medium">Pay Per Booking</div>
                    <div className="text-sm text-white/50 mt-1">Custom amount</div>
                  </button>
                </div>
              </div>

              {/* Booking Details (if booking type) */}
              {newInvoice.type === "booking" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Booking Amount ($)</label>
                    <input
                      type="number"
                      value={newInvoice.bookingAmount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, bookingAmount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Description (optional)</label>
                    <input
                      type="text"
                      value={newInvoice.bookingDescription}
                      onChange={(e) => setNewInvoice({ ...newInvoice, bookingDescription: e.target.value })}
                      placeholder="e.g., Lamborghini Huracan - 3 day rental"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                  </div>
                </div>
              )}

              {/* Ad Spend */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Ad Spend Rate</label>
                <div className="grid grid-cols-2 gap-3">
                  {AD_SPEND_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewInvoice({ ...newInvoice, adSpendRate: option.value })}
                      className={`p-3 rounded-xl border transition-colors ${
                        newInvoice.adSpendRate === option.value
                          ? "border-[#375DEE] bg-[#375DEE]/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ad Spend Days */}
              {newInvoice.adSpendRate > 0 && (
                <div>
                  <label className="block text-sm text-white/60 mb-2">Ad Spend Duration (days)</label>
                  <input
                    type="number"
                    value={newInvoice.adSpendDays}
                    onChange={(e) => setNewInvoice({ ...newInvoice, adSpendDays: parseInt(e.target.value) || 0 })}
                    min="1"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                  />
                  <div className="text-sm text-white/50 mt-2">
                    Ad spend total: {formatCurrency(newInvoice.adSpendRate * newInvoice.adSpendDays)}
                  </div>
                </div>
              )}

              {/* Client Info */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-white/60">Client Information</div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={newInvoice.clientName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <input
                      type="email"
                      value={newInvoice.clientEmail}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newInvoice.clientPhone}
                      onChange={(e) => setNewInvoice({ ...newInvoice, clientPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Notes (optional)</label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE] resize-none"
                />
              </div>

              {/* Total */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Amount</span>
                  <span className="text-2xl font-bold">{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="text-sm text-white/50 mt-2">
                  {newInvoice.type === "retainer" ? "$1,500 retainer" : `$${newInvoice.bookingAmount || 0} booking`}
                  {newInvoice.adSpendRate > 0 && (
                    <> + ${newInvoice.adSpendRate}/day x {newInvoice.adSpendDays} days</>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={creating}
                className="flex-1 px-4 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
