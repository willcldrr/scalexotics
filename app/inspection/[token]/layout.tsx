import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Vehicle Inspection",
  description: "Complete your vehicle inspection.",
  robots: { index: false, follow: false },
}

export default function InspectionLayout({ children }: { children: React.ReactNode }) {
  return children
}
