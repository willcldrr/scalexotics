import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Complete Your Booking",
  description: "Secure booking portal for your vehicle rental.",
  robots: { index: false, follow: false },
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children
}
