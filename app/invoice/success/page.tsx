"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, FileText, Loader2, ArrowLeft, Building } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  total: number
  paid_at: string | null
  user_id: string
}

interface BusinessBranding {
  company_name: string
  logo_url: string | null
  primary_color: string
  background_color: string
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("invoice_id")
  const supabase = createClient()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [branding, setBranding] = useState<BusinessBranding | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    } else {
      setLoading(false)
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, customer_name, total, paid_at, user_id")
      .eq("id", invoiceId)
      .single()

    if (data) {
      setInvoice(data)

      // Fetch business branding
      const { data: brandingData } = await supabase
        .from("business_branding")
        .select("company_name, logo_url, primary_color, background_color")
        .eq("user_id", data.user_id)
        .single()

      if (brandingData) {
        setBranding(brandingData)
      } else {
        // Fallback
        const { data: profileData } = await supabase
          .from("profiles")
          .select("company_name")
          .eq("id", data.user_id)
          .single()

        setBranding({
          company_name: profileData?.company_name || "Your Business",
          logo_url: null,
          primary_color: "#375DEE",
          background_color: "#000000",
        })
      }
    }
    setLoading(false)
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Building className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
            )}
          </div>

          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-white/60 mb-6">
            Thank you for your payment. Your transaction has been completed.
          </p>

          {invoice && (
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                <FileText className="w-4 h-4" />
                Invoice Details
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Invoice</span>
                  <span className="text-white font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Customer</span>
                  <span className="text-white font-medium">{invoice.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Amount Paid</span>
                  <span className="text-green-400 font-bold font-numbers">
                    ${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {invoice.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Date</span>
                    <span className="text-white/80 text-sm">
                      {format(new Date(invoice.paid_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-white/40 text-sm mb-6">
            A confirmation email will be sent to you shortly.
          </p>

          {invoice && (
            <Link
              href={`/invoice/${invoice.id}`}
              className="inline-flex items-center gap-2 transition-colors hover:opacity-80"
              style={{ color: primaryColor }}
            >
              <ArrowLeft className="w-4 h-4" />
              View Invoice
            </Link>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm mt-6">
          {branding?.company_name}
        </p>
      </div>
    </div>
  )
}
