import type { Metadata } from "next"
import DashboardShell from "./dashboard-shell"
import { BrandingProvider } from "@/lib/branding-context"
import { Toaster } from "sonner"

// Allow Next.js to optimize rendering while cache provider handles data freshness

// Prevent search engines from indexing dashboard pages
export const metadata: Metadata = {
  title: {
    default: "Velocity Labs",
    template: "Velocity Labs",
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
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
          },
        }}
      />
    </BrandingProvider>
  )
}
