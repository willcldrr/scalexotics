"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Car,
  Calendar,
  DollarSign,
  User,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"

// Public Supabase client (no auth needed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Agreement {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  vehicle_info: string
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number
  status: string
  signed_at: string | null
}

export default function SignAgreementPage() {
  const params = useParams()
  const token = params.token as string
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    fetchAgreement()
  }, [token])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set up canvas
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Handle touch events
    const getTouchPos = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      setIsDrawing(true)
      const pos = getTouchPos(e)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawing) return
      e.preventDefault()
      const pos = getTouchPos(e)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setHasSignature(true)
    }

    const handleTouchEnd = () => {
      setIsDrawing(false)
    }

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("touchend", handleTouchEnd)

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDrawing])

  const fetchAgreement = async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("agreements")
      .select("*")
      .eq("token", token)
      .single()

    if (fetchError || !data) {
      setError("Agreement not found or has expired.")
    } else if (data.status === "signed") {
      setAgreement(data)
      setSigned(true)
    } else if (data.status === "expired") {
      setError("This agreement has expired. Please contact us for a new one.")
    } else {
      setAgreement(data)
    }

    setLoading(false)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
    setHasSignature(true)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const submitSignature = async () => {
    if (!canvasRef.current || !agreement || !hasSignature || !agreedToTerms) return

    setSigning(true)

    const signatureData = canvasRef.current.toDataURL("image/png")

    const { error: updateError } = await supabase
      .from("agreements")
      .update({
        signature_data: signatureData,
        status: "signed",
        signed_at: new Date().toISOString(),
      })
      .eq("token", token)

    if (!updateError) {
      setSigned(true)
    } else {
      alert("Failed to save signature. Please try again.")
    }

    setSigning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#375DEE]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Agreement Signed!</h1>
          <p className="text-white/60 mb-4">
            Thank you for signing the rental agreement. You will receive a confirmation shortly.
          </p>
          <p className="text-sm text-white/40">
            Signed on {agreement?.signed_at ? format(new Date(agreement.signed_at), "MMMM d, yyyy 'at' h:mm a") : "just now"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#375DEE]" />
            <div>
              <h1 className="text-xl font-bold">Rental Agreement</h1>
              <p className="text-sm text-white/50">Review and sign below</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Agreement Details */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Rental Details</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-[#375DEE] mt-0.5" />
              <div>
                <p className="text-sm text-white/50">Renter</p>
                <p className="font-semibold">{agreement?.customer_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Car className="w-5 h-5 text-[#375DEE] mt-0.5" />
              <div>
                <p className="text-sm text-white/50">Vehicle</p>
                <p className="font-semibold">{agreement?.vehicle_info}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#375DEE] mt-0.5" />
              <div>
                <p className="text-sm text-white/50">Rental Period</p>
                <p className="font-semibold">
                  {agreement && format(new Date(agreement.start_date), "MMM d, yyyy")} -{" "}
                  {agreement && format(new Date(agreement.end_date), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-[#375DEE] mt-0.5" />
              <div>
                <p className="text-sm text-white/50">Total Amount</p>
                <p className="font-semibold">${agreement?.total_amount?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Terms & Conditions</h2>

          <div className="text-sm text-white/70 space-y-3 max-h-64 overflow-y-auto">
            <p>
              <strong>1. Rental Period:</strong> The rental period begins and ends at the times specified above.
              Late returns may incur additional charges.
            </p>
            <p>
              <strong>2. Deposit:</strong> A security deposit of ${agreement?.deposit_amount?.toLocaleString() || 0} is
              required and will be refunded upon return of the vehicle in its original condition.
            </p>
            <p>
              <strong>3. Insurance:</strong> Renter agrees to maintain valid auto insurance for the duration
              of the rental period. Proof of insurance must be provided upon pickup.
            </p>
            <p>
              <strong>4. Driver Requirements:</strong> Driver must be at least 25 years old with a valid
              driver's license. Additional drivers must be approved and added to this agreement.
            </p>
            <p>
              <strong>5. Prohibited Uses:</strong> The vehicle may not be used for racing, towing, off-road
              driving, or any illegal activity.
            </p>
            <p>
              <strong>6. Fuel Policy:</strong> Vehicle must be returned with the same fuel level as at pickup.
            </p>
            <p>
              <strong>7. Damage & Liability:</strong> Renter is responsible for any damage to the vehicle
              during the rental period, including damage caused by accidents, theft, or vandalism.
            </p>
            <p>
              <strong>8. Cancellation:</strong> Cancellations must be made at least 48 hours before the
              rental start date. The deposit is non-refundable for late cancellations.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-[#375DEE] focus:ring-[#375DEE]"
            />
            <span className="text-sm">
              I have read and agree to the terms and conditions above. I understand my responsibilities
              as the renter and agree to be bound by this agreement.
            </span>
          </label>
        </div>

        {/* Signature */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Signature</h2>
            {hasSignature && (
              <button
                onClick={clearSignature}
                className="flex items-center gap-1 text-sm text-white/60 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-48 cursor-crosshair touch-none"
            />
          </div>
          <p className="text-sm text-white/40 text-center">
            Draw your signature above using your mouse or finger
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={submitSignature}
          disabled={!hasSignature || !agreedToTerms || signing}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#375DEE] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg"
        >
          {signing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Sign Agreement
            </>
          )}
        </button>
      </div>
    </div>
  )
}
