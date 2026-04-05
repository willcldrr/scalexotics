import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your secure checkout.",
  robots: { index: false, follow: false },
}

export default function SlugCheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
