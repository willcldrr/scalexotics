import type { Metadata } from "next"
import DashboardShell from "./dashboard-shell"

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
  return <DashboardShell>{children}</DashboardShell>
}
