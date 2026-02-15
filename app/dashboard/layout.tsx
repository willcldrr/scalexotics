import type { Metadata } from "next"
import DashboardShell from "./dashboard-shell"
import { BrandingProvider } from "@/lib/branding-context"

// Force dynamic rendering to prevent SSR cache issues
export const dynamic = 'force-dynamic'

// Prevent search engines from indexing dashboard pages
export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Scale Exotics Dashboard",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BrandingProvider>
      <DashboardShell>{children}</DashboardShell>
    </BrandingProvider>
  )
}
