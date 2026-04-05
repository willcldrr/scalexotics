import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Revalidate hourly so new vehicles/businesses appear without a redeploy.
export const revalidate = 3600

export async function generateStaticParams() {
  const { data } = await supabase
    .from("deposit_portal_config")
    .select("company_slug")
    .not("company_slug", "is", null)
    .limit(100)

  return (data || [])
    .map((row) => ({ slug: row.company_slug as string }))
    .filter((p) => !!p.slug)
}

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  type: string
  daily_rate: number
  image_url: string | null
  status: string
}

interface PortalConfig {
  user_id: string
  company_slug: string
  portal_title: string | null
  logo_url: string | null
  accent_color: string | null
}

interface AISettings {
  business_name: string
}

async function getBusinessData(slug: string) {
  const { data: config } = await supabase
    .from("deposit_portal_config")
    .select("user_id, company_slug, portal_title, logo_url, accent_color")
    .eq("company_slug", slug)
    .single()

  if (!config) return null

  const [settingsRes, vehiclesRes] = await Promise.all([
    supabase
      .from("ai_settings")
      .select("business_name")
      .eq("user_id", config.user_id)
      .single(),
    supabase
      .from("vehicles")
      .select("id, name, make, model, year, type, daily_rate, image_url, status")
      .eq("user_id", config.user_id)
      .eq("status", "available")
      .order("daily_rate", { ascending: false }),
  ])

  return {
    config: config as PortalConfig,
    businessName: (settingsRes.data as AISettings | null)?.business_name || config.portal_title || slug,
    vehicles: (vehiclesRes.data as Vehicle[]) || [],
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getBusinessData(slug)

  if (!data) {
    return { title: "Not Found" }
  }

  const title = `${data.businessName} - Vehicle Gallery`
  const description = `Browse ${data.vehicles.length} available vehicles from ${data.businessName}. View pricing, availability, and details.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    rented: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    maintenance: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
        colors[status] || "bg-white/10 text-white/60 border-white/20"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function VehicleCard({ vehicle, accentColor }: { vehicle: Vehicle; accentColor: string }) {
  return (
    <div className="group rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300">
      {/* Image */}
      <div className="aspect-[16/10] relative bg-white/[0.02] overflow-hidden">
        {vehicle.image_url ? (
          <Image
            src={vehicle.image_url}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
            <svg
              className="w-16 h-16 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
            <span className="text-xs">No photo</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            {vehicle.type && (
              <p className="text-xs text-white/40 mt-0.5 capitalize">{vehicle.type}</p>
            )}
          </div>
          <StatusBadge status={vehicle.status} />
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: accentColor }}>
            ${vehicle.daily_rate}
          </span>
          <span className="text-sm text-white/40">/day</span>
        </div>
      </div>
    </div>
  )
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getBusinessData(slug)

  if (!data) {
    notFound()
  }

  const accentColor = data.config.accent_color || "#FFFFFF"

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-5">
            {data.config.logo_url && (
              <Image
                src={data.config.logo_url}
                alt={data.businessName}
                width={56}
                height={56}
                className="rounded-xl object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {data.businessName}
              </h1>
              <p className="text-sm text-white/40 mt-1">
                {data.vehicles.length} vehicle{data.vehicles.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Vehicle Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {data.vehicles.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.05] mb-4">
              <svg
                className="w-8 h-8 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-white/60">No vehicles available</h2>
            <p className="text-sm text-white/30 mt-1">Check back later for updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {data.vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                accentColor={accentColor}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-white/20 text-center">
            Powered by Velocity
          </p>
        </div>
      </footer>
    </div>
  )
}
