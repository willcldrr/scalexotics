"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Loader2, FileText } from "lucide-react"
import Link from "next/link"

interface Invoice {
  invoice_number: string
  total_amount: number
  client_name: string
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("invoice_id")
  const supabase = createClient()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
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
      .from("client_invoices")
      .select("invoice_number, total_amount, client_name")
      .eq("id", invoiceId)
      .single()

    if (data) {
      setInvoice(data)
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="https://imagedelivery.net/CVEJyzst_6io-ETn1V_PSw/3bdba65e-fb1a-4a3e-ff6f-1aa89b081f00/public"
            alt="Scale Exotics"
            className="h-10 mx-auto"
          />
        </div>

        {/* Success Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Payment Successful
          </h1>
          <p className="text-white/50 mb-6">
            Thank you for your payment. Your transaction has been completed.
          </p>

          {invoice && (
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-[#375DEE]" />
                <span className="font-mono text-sm">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Amount Paid</span>
                <span className="font-medium text-green-400">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          )}

          <p className="text-white/40 text-sm">
            A confirmation email will be sent to you shortly.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-[#375DEE] hover:underline text-sm"
          >
            Return to Scale Exotics
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
