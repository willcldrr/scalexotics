"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  FileText,
  Search,
  Plus,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Copy,
  Loader2,
  X,
  Calendar,
  Car,
  User,
  DollarSign,
  ExternalLink,
} from "lucide-react"
import { format } from "date-fns"

interface Agreement {
  id: string
  booking_id: string | null
  lead_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string
  vehicle_info: string
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number
  status: "pending" | "sent" | "signed" | "expired"
  signature_data: string | null
  signed_at: string | null
  created_at: string
  token: string
}

interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number
  vehicle_id: string
  vehicles?: { make: string; model: string; year: number }
}

export default function AgreementsContent() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch agreements
      const { data: agreementsData } = await supabase
        .from("agreements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setAgreements(agreementsData || [])

      // Fetch confirmed bookings without agreements
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          id,
          customer_name,
          customer_phone,
          customer_email,
          start_date,
          end_date,
          total_amount,
          deposit_amount,
          vehicle_id,
          vehicles (make, model, year)
        `)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .order("start_date", { ascending: true })

      setBookings(bookingsData?.map(b => ({
        ...b,
        vehicles: Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles
      })) || [])
    }

    setLoading(false)
  }

  const createAgreement = async () => {
    if (!selectedBooking) return
    setCreating(true)

    const booking = bookings.find(b => b.id === selectedBooking)
    if (!booking) {
      setCreating(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Generate a unique token for the signing link
    const token = crypto.randomUUID()

    const vehicleInfo = booking.vehicles
      ? `${booking.vehicles.year} ${booking.vehicles.make} ${booking.vehicles.model}`
      : "Vehicle"

    const { data, error } = await supabase
      .from("agreements")
      .insert({
        user_id: user.id,
        booking_id: booking.id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        vehicle_info: vehicleInfo,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: booking.total_amount,
        deposit_amount: booking.deposit_amount || 0,
        status: "pending",
        token,
      })
      .select()
      .single()

    if (!error && data) {
      setAgreements([data, ...agreements])
      setShowCreateModal(false)
      setSelectedBooking("")
    }

    setCreating(false)
  }

  const sendAgreement = async (agreement: Agreement) => {
    setSending(true)

    // In production, this would send an SMS/email with the signing link
    const signingLink = `${window.location.origin}/sign/${agreement.token}`

    // For now, just update status to sent
    const { error } = await supabase
      .from("agreements")
      .update({ status: "sent" })
      .eq("id", agreement.id)

    if (!error) {
      setAgreements(agreements.map(a =>
        a.id === agreement.id ? { ...a, status: "sent" } : a
      ))

      // Copy link to clipboard
      navigator.clipboard.writeText(signingLink)
      alert(`Agreement link copied to clipboard!\n\n${signingLink}`)
    }

    setSending(false)
  }

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/sign/${token}`
    navigator.clipboard.writeText(link)
    alert("Signing link copied to clipboard!")
  }

  const filteredAgreements = agreements.filter(agreement => {
    const matchesSearch = agreement.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.vehicle_info.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || agreement.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: "bg-gray-500/20", text: "text-gray-400", icon: Clock },
      sent: { bg: "bg-blue-500/20", text: "text-blue-400", icon: Send },
      signed: { bg: "bg-green-500/20", text: "text-green-400", icon: CheckCircle },
      expired: { bg: "bg-red-500/20", text: "text-red-400", icon: XCircle },
    }
    const style = styles[status] || styles.pending
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
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
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] text-white font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Agreement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: agreements.length, color: "text-white" },
          { label: "Pending", value: agreements.filter(a => a.status === "pending").length, color: "text-gray-400" },
          { label: "Sent", value: agreements.filter(a => a.status === "sent").length, color: "text-blue-400" },
          { label: "Signed", value: agreements.filter(a => a.status === "signed").length, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search agreements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#375DEE]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "sent", "signed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-[#375DEE] text-white"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agreements List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {filteredAgreements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40">
            <FileText className="w-12 h-12 mb-3" />
            <p>No agreements found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-[#375DEE] hover:underline"
            >
              Create your first agreement
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredAgreements.map((agreement) => (
              <div key={agreement.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#375DEE]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{agreement.customer_name}</span>
                        {getStatusBadge(agreement.status)}
                      </div>
                      <p className="text-sm text-white/50">{agreement.vehicle_info}</p>
                      <p className="text-sm text-white/40">
                        {format(new Date(agreement.start_date), "MMM d")} - {format(new Date(agreement.end_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(agreement.token)}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Copy signing link"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAgreement(agreement)
                        setShowViewModal(true)
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="View agreement"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {agreement.status === "pending" && (
                      <button
                        onClick={() => sendAgreement(agreement)}
                        disabled={sending}
                        className="flex items-center gap-2 px-4 py-2 bg-[#375DEE] hover:bg-[#4169E1] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Agreement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Agreement</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Select Booking</label>
                <select
                  value={selectedBooking}
                  onChange={(e) => setSelectedBooking(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#375DEE]"
                >
                  <option value="">Choose a confirmed booking...</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.customer_name} - {booking.vehicles?.make} {booking.vehicles?.model} ({format(new Date(booking.start_date), "MMM d")})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBooking && (
                <div className="p-4 bg-white/5 rounded-xl space-y-2">
                  {(() => {
                    const booking = bookings.find(b => b.id === selectedBooking)
                    if (!booking) return null
                    return (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-white/40" />
                          <span>{booking.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="w-4 h-4 text-white/40" />
                          <span>{booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-white/40" />
                          <span>{format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-white/40" />
                          <span>${booking.total_amount?.toLocaleString()} total</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              <button
                onClick={createAgreement}
                disabled={!selectedBooking || creating}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#375DEE] hover:bg-[#4169E1] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Create Agreement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Agreement Modal */}
      {showViewModal && selectedAgreement && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Rental Agreement</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Agreement Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Customer</p>
                  <p className="font-semibold">{selectedAgreement.customer_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Vehicle</p>
                  <p className="font-semibold">{selectedAgreement.vehicle_info}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Rental Period</p>
                  <p className="font-semibold">
                    {format(new Date(selectedAgreement.start_date), "MMM d")} - {format(new Date(selectedAgreement.end_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/50">Total Amount</p>
                  <p className="font-semibold">${selectedAgreement.total_amount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/50">Status:</span>
                {getStatusBadge(selectedAgreement.status)}
              </div>

              {/* Signature */}
              {selectedAgreement.signature_data && (
                <div className="space-y-2">
                  <p className="text-sm text-white/50">Signature</p>
                  <div className="bg-white rounded-xl p-4">
                    <img
                      src={selectedAgreement.signature_data}
                      alt="Customer signature"
                      className="max-h-24"
                    />
                  </div>
                  {selectedAgreement.signed_at && (
                    <p className="text-sm text-white/40">
                      Signed on {format(new Date(selectedAgreement.signed_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              )}

              {/* Signing Link */}
              <div className="space-y-2">
                <p className="text-sm text-white/50">Signing Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/sign/${selectedAgreement.token}`}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70"
                  />
                  <button
                    onClick={() => copyLink(selectedAgreement.token)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <a
                    href={`/sign/${selectedAgreement.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
