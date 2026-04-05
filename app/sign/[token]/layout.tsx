import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sign Document",
  description: "Review and sign your document.",
  robots: { index: false, follow: false },
}

export default function SignLayout({ children }: { children: React.ReactNode }) {
  return children
}
