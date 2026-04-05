import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Book Your Experience",
  description: "Share your details to secure your vehicle booking.",
  robots: { index: false, follow: false },
}

export default function LeadLayout({ children }: { children: React.ReactNode }) {
  return children
}
