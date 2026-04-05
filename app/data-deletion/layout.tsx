import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Data Deletion",
  description:
    "Request deletion of your personal data from Velocity Labs. Submit a data deletion request in accordance with our privacy commitments.",
  alternates: {
    canonical: "/data-deletion",
  },
  openGraph: {
    title: "Data Deletion | Velocity Labs",
    description:
      "Request deletion of your personal data from Velocity Labs.",
    url: "/data-deletion",
  },
}

export default function DataDeletionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
