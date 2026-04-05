import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Payment",
  description: "Complete your payment securely.",
  robots: { index: false, follow: false },
}

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children
}
