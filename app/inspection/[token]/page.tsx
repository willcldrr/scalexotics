"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { useParams } from "next/navigation"
import {
  ClipboardCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Car,
  Gauge,
  Fuel,
  AlertTriangle,
  Trash2,
  Building,
} from "lucide-react"
import { format } from "date-fns"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Inspection {
  id: string
  type: "pickup" | "return"
  customer_name: string
  mileage: number
  fuel_level: number
  exterior_condition: string
  interior_condition: string
  notes: string | null
  damage_notes: string | null
  customer_signature: string | null
  customer_signed_at: string | null
  status: string
  created_at: string
  user_id: string
  vehicles?: {
    make: string
    model: string
    year: number
    image_url: string | null
  }
}

interface BusinessBranding {
  company_name: string
  logo_url: string | null
  primary_color: string
  background_color: string
}

export default function InspectionSignPage() {
  const params = useParams()
  const token = params.token as string
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [branding, setBranding] = useState<BusinessBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [agreedToCondition, setAgreedToCondition] = useState(false)

  const primaryColor = branding?.primary_color || "#375DEE"
  const backgroundColor = branding?.background_color || "#000000"

  useEffect(() => {
    fetchInspection()
  }, [token])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

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

  const fetchInspection = async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("inspections")
      .select(`
        *,
        vehicles (make, model, year, image_url)
      `)
      .eq("token", token)
      .single()

    if (fetchError || !data) {
      setError("Inspection report not found.")
      setLoading(false)
      return
    }

    const inspectionData = {
      ...data,
      vehicles: Array.isArray(data.vehicles) ? data.vehicles[0] : data.vehicles
    }
    setInspection(inspectionData)

    if (data.status === "completed") {
      setSigned(true)
    }

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
        company_name: profileData?.company_name || "Vehicle Rentals",
        logo_url: null,
        primary_color: "#375DEE",
        background_color: "#000000",
      })
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
    if (!canvasRef.current || !inspection || !hasSignature || !agreedToCondition) return

    setSigning(true)

    const signatureData = canvasRef.current.toDataURL("image/png")

    const { error: updateError } = await supabase
      .from("inspections")
      .update({
        customer_signature: signatureData,
        status: "completed",
        customer_signed_at: new Date().toISOString(),
      })
      .eq("token", token)

    if (!updateError) {
      setSigned(true)
    } else {
      alert("Failed to save signature. Please try again.")
    }

    setSigning(false)
  }

  const getConditionBadge = (condition: string) => {
    const styles: Record<string, string> = {
      excellent: "bg-green-500/20 text-green-400",
      good: "bg-blue-500/20 text-blue-400",
      fair: "bg-yellow-500/20 text-yellow-400",
      poor: "bg-red-500/20 text-red-400",
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[condition] || styles.good}`}>
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor }}>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 max-w-md text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Building className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
            )}
          </div>
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Inspection Confirmed!</h1>
          <p className="text-white/60 mb-4">
            Thank you for confirming the vehicle inspection report.
          </p>
          <p className="text-sm text-white/40">
            Signed on {inspection?.customer_signed_at ? format(new Date(inspection.customer_signed_at), "MMMM d, yyyy 'at' h:mm a") : "just now"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor }}>
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <ClipboardCheck className="w-8 h-8" style={{ color: primaryColor }} />
            )}
            <div>
              <h1 className="text-xl font-bold">Vehicle Inspection Report</h1>
              <p className="text-sm text-white/50">
                {inspection?.type === "pickup" ? "Pickup" : "Return"} Inspection
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Vehicle Info */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-14 rounded-xl bg-white/5 overflow-hidden">
              {inspection?.vehicles?.image_url ? (
                <img
                  src={inspection.vehicles.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-8 h-8 text-white/20" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {inspection?.vehicles?.year} {inspection?.vehicles?.make} {inspection?.vehicles?.model}
              </h2>
              <p className="text-white/50">Customer: {inspection?.customer_name}</p>
            </div>
          </div>
        </div>

        {/* Condition Report */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
          <h3 className="text-lg font-semibold">Condition Report</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <Gauge className="w-6 h-6 mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="text-2xl font-bold font-numbers">{inspection?.mileage?.toLocaleString()}</p>
              <p className="text-xs text-white/50">Mileage</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <Fuel className="w-6 h-6 mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="text-2xl font-bold font-numbers">{inspection?.fuel_level}%</p>
              <p className="text-xs text-white/50">Fuel Level</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/50 mb-2">Exterior</p>
              {getConditionBadge(inspection?.exterior_condition || "good")}
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-white/50 mb-2">Interior</p>
              {getConditionBadge(inspection?.interior_condition || "good")}
            </div>
          </div>

          {/* Damage Notes */}
          {inspection?.damage_notes && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-sm text-yellow-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Existing Damage / Notes
              </p>
              <p className="text-white/80">{inspection.damage_notes}</p>
            </div>
          )}

          {/* General Notes */}
          {inspection?.notes && (
            <div className="space-y-2">
              <p className="text-sm text-white/50">Additional Notes</p>
              <p className="text-white/80">{inspection.notes}</p>
            </div>
          )}
        </div>

        {/* Agreement & Signature */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Confirm & Sign</h3>

          <div className="text-sm text-white/70 p-4 bg-white/5 rounded-xl">
            <p className="mb-3">By signing below, I acknowledge that:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>I have inspected the vehicle condition noted above</li>
              <li>The mileage and fuel level readings are accurate</li>
              <li>Any existing damage has been documented</li>
              {inspection?.type === "pickup" ? (
                <li>I accept responsibility for the vehicle in this condition</li>
              ) : (
                <li>I am returning the vehicle in the condition described</li>
              )}
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToCondition}
              onChange={(e) => setAgreedToCondition(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10"
              style={{ accentColor: primaryColor }}
            />
            <span className="text-sm">
              I confirm the vehicle condition report is accurate and agree to the terms above.
            </span>
          </label>

          {/* Signature Pad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">Your Signature</p>
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
            disabled={!hasSignature || !agreedToCondition || signing}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            {signing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirm Inspection
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm">
          {branding?.company_name} | Inspection created on {inspection?.created_at ? format(new Date(inspection.created_at), "MMMM d, yyyy") : ""}
        </p>
      </div>
    </div>
  )
}
