import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vehicle Inspection",
  robots: {
    index: false,
    follow: false,
  },
}

export default function InspectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
