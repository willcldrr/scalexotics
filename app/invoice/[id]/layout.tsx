import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Invoice",
  description: "View and pay your invoice.",
  robots: { index: false, follow: false },
}

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return children
}
