"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  FileText,
  CheckCircle,
  CreditCard,
  Loader2,
  Calendar,
  Building,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue"
  due_date: string
  paid_at: string | null
  notes: string | null
  created_at: string
  user_id: string
}

interface BusinessBranding {
  company_name: string
  logo_url: string | null
  primary_color: string
  background_color: string
  support_email: string | null
  support_phone: string | null
  website_url: string | null
}

export default function InvoicePaymentPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const supabase = createClient()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [branding, setBranding] = useState<BusinessBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    setLoading(true)
    setError(null)

    // Fetch invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single()

    if (invoiceError || !invoiceData) {
      setError("Invoice not found")
      setLoading(false)
      return
    }

    setInvoice(invoiceData)

    // Fetch business branding
    const { data: brandingData } = await supabase
      .from("business_branding")
      .select("*")
      .eq("user_id", invoiceData.user_id)
      .single()

    if (brandingData) {
      setBranding(brandingData)
    } else {
      // Fallback to profile/ai_settings if no branding configured
      const [profileRes, aiRes] = await Promise.all([
        supabase.from("profiles").select("company_name, email").eq("id", invoiceData.user_id).single(),
        supabase.from("ai_settings").select("business_name, business_phone").eq("user_id", invoiceData.user_id).single(),
      ])

      setBranding({
        company_name: aiRes.data?.business_name || profileRes.data?.company_name || "Your Business",
        logo_url: null,
        primary_color: "#375DEE",
        background_color: "#000000",
        support_email: profileRes.data?.email || null,
        support_phone: aiRes.data?.business_phone || null,
        website_url: null,
      })
    }

    setLoading(false)
  }

  const handlePayment = async () => {
    if (!invoice) return

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/invoices/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setProcessing(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError("Failed to initiate payment. Please try again.")
      setProcessing(false)
    }
  }

  const primaryColor = branding?.primary_color || "#375DEE"
  const backgroundColor = branding?.background_color || "#000000"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h1>
          <p className="text-white/50">The invoice you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  if (!invoice) return null

  const isPaid = invoice.status === "paid"
  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== "paid"

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Header */}
      <header className="border-b border-white/10 p-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Building className="w-4 h-4" style={{ color: primaryColor }} />
              </div>
            )}
            <span className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {branding?.company_name}
            </span>
          </div>
          {isPaid ? (
            <span className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Paid
            </span>
          ) : isOverdue ? (
            <span className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Overdue
            </span>
          ) : (
            <span
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <FileText className="w-4 h-4" />
              {invoice.invoice_number}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Invoice Header */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-white/50 text-sm mb-1">Invoice</p>
              <h1 className="text-2xl font-bold text-white">{invoice.invoice_number}</h1>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-sm mb-1">Amount Due</p>
              <p className="text-3xl font-bold text-white font-numbers">
                ${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-white/50 text-sm mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Bill To
              </p>
              <p className="font-medium text-white">{invoice.customer_name}</p>
              {invoice.customer_email && (
                <p className="text-white/60 text-sm flex items-center gap-2 mt-1">
                  <Mail className="w-3 h-3" />
                  {invoice.customer_email}
                </p>
              )}
              {invoice.customer_phone && (
                <p className="text-white/60 text-sm flex items-center gap-2 mt-1">
                  <Phone className="w-3 h-3" />
                  {invoice.customer_phone}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-white/50 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Due Date
              </div>
              <p className={`font-medium ${isOverdue ? "text-red-400" : "text-white"}`}>
                {format(new Date(invoice.due_date), "MMMM d, yyyy")}
              </p>
              <p className="text-white/40 text-sm mt-1">
                Issued: {format(new Date(invoice.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-white">Items</h2>
          </div>
          <div className="divide-y divide-white/5">
            {invoice.items.map((item, index) => (
              <div key={index} className="p-4 flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-white">{item.description}</p>
                  <p className="text-sm text-white/50">
                    {item.quantity} × ${Math.abs(item.unit_price).toLocaleString()}
                  </p>
                </div>
                <p className={`font-medium font-numbers ${item.total < 0 ? "text-green-400" : "text-white"}`}>
                  {item.total < 0 ? "-" : ""}${Math.abs(item.total).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-white/10 p-4 space-y-2">
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span className="font-numbers">${invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div className="flex justify-between text-white/60">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span className="font-numbers">${invoice.tax_amount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="font-numbers">${invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
            <p className="text-white/50 text-sm mb-2">Notes</p>
            <p className="text-white/80">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Button */}
        {!isPaid && (
          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay ${invoice.total.toLocaleString()} Now
                </>
              )}
            </button>

            <p className="text-center text-white/40 text-sm">
              Secure payment powered by Stripe
            </p>
          </div>
        )}

        {/* Paid Confirmation */}
        {isPaid && invoice.paid_at && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-green-400 mb-1">Payment Complete</h2>
            <p className="text-white/60">
              Paid on {format(new Date(invoice.paid_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 p-6 mt-12">
        <div className="max-w-3xl mx-auto text-center text-white/40 text-sm">
          <p>Questions? Contact {branding?.company_name}</p>
          {branding?.support_email && <p>{branding.support_email}</p>}
          {branding?.support_phone && <p>{branding.support_phone}</p>}
          {branding?.website_url && (
            <p className="mt-2">
              <a href={branding.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-white/60" style={{ color: primaryColor }}>
                {branding.website_url.replace(/^https?:\/\//, "")}
              </a>
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}
