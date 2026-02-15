"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { FileText, CheckCircle, XCircle, Clock, Loader2, CreditCard, AlertCircle } from "lucide-react"

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
  status: "pending" | "paid" | "cancelled"
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

export default function PaymentPage() {
  const params = useParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      const data = await response.json()

      if (!response.ok || !data.invoice) {
        setError("Invoice not found")
      } else {
        setInvoice(data.invoice)
      }
    } catch (err) {
      setError("Invoice not found")
    }
    setLoading(false)
  }

  const handlePayment = async () => {
    if (!invoice) return

    setProcessing(true)
    setError("")

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.total_amount,
          clientName: invoice.client_name,
          clientEmail: invoice.client_email,
          description: invoice.type === "retainer"
            ? "Scale Exotics Retainer"
            : invoice.booking_description || "Scale Exotics Booking",
        }),
      })

      const result = await response.json()

      if (result.url) {
        window.location.href = result.url
      } else {
        setError(result.error || "Failed to create checkout session")
      }
    } catch (err) {
      setError("Failed to process payment. Please try again.")
    }

    setProcessing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h1>
          <p className="text-white/50">This invoice may have been deleted or the link is invalid.</p>
        </div>
      </div>
    )
  }

  if (!invoice) return null

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://imagedelivery.net/CVEJyzst_6io-ETn1V_PSw/3bdba65e-fb1a-4a3e-ff6f-1aa89b081f00/public"
            alt="Scale Exotics"
            className="h-10 mx-auto"
          />
        </div>

        {/* Invoice Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#375DEE]/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#375DEE]" />
                </div>
                <div>
                  <div className="text-white/50 text-sm">Invoice</div>
                  <div className="font-mono font-medium">{invoice.invoice_number}</div>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  invoice.status === "paid"
                    ? "bg-green-500/20 text-green-400"
                    : invoice.status === "cancelled"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {invoice.status === "paid" && <CheckCircle className="w-4 h-4" />}
                {invoice.status === "cancelled" && <XCircle className="w-4 h-4" />}
                {invoice.status === "pending" && <Clock className="w-4 h-4" />}
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Bill To */}
          <div className="p-6 border-b border-white/10">
            <div className="text-white/50 text-sm mb-1">Bill To</div>
            <div className="font-medium text-lg">{invoice.client_name}</div>
            {invoice.client_email && (
              <div className="text-white/50 text-sm">{invoice.client_email}</div>
            )}
          </div>

          {/* Line Items */}
          <div className="p-6 border-b border-white/10 space-y-4">
            <div className="text-white/50 text-sm mb-3">Details</div>

            {/* Base Amount */}
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {invoice.type === "retainer" ? "Monthly Retainer" : "Booking Fee"}
                </div>
                {invoice.type === "booking" && invoice.booking_description && (
                  <div className="text-white/50 text-sm mt-0.5">{invoice.booking_description}</div>
                )}
              </div>
              <div className="font-medium">{formatCurrency(invoice.base_amount)}</div>
            </div>

            {/* Ad Spend */}
            {invoice.ad_spend_total && invoice.ad_spend_rate && invoice.ad_spend_days && (
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">Ad Spend</div>
                  <div className="text-white/50 text-sm mt-0.5">
                    {formatCurrency(invoice.ad_spend_rate)}/day × {invoice.ad_spend_days} days
                  </div>
                </div>
                <div className="font-medium">{formatCurrency(invoice.ad_spend_total)}</div>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <div className="text-xl font-semibold">Total Due</div>
              <div className="text-3xl font-bold text-[#375DEE]">
                {formatCurrency(invoice.total_amount)}
              </div>
            </div>
            {invoice.due_date && (
              <div className="text-white/50 text-sm mt-2">
                Due by {formatDate(invoice.due_date)}
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="p-6">
            {invoice.status === "paid" ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <div className="text-lg font-medium text-green-400">Payment Complete</div>
                <div className="text-white/50 text-sm mt-1">
                  Paid on {invoice.paid_at ? formatDate(invoice.paid_at) : "N/A"}
                </div>
              </div>
            ) : invoice.status === "cancelled" ? (
              <div className="text-center py-4">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <div className="text-lg font-medium text-red-400">Invoice Cancelled</div>
                <div className="text-white/50 text-sm mt-1">
                  This invoice is no longer valid
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full py-4 bg-[#375DEE] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay {formatCurrency(invoice.total_amount)}
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 mt-4 text-white/40 text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  Secure payment powered by Stripe
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-sm">
          <p>Questions about this invoice?</p>
          <a href="mailto:support@scalexotics.com" className="text-[#375DEE] hover:underline">
            Contact us
          </a>
        </div>
      </div>
    </div>
  )
}
