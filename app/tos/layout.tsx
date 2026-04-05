import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Velocity Labs Terms of Service - Read our terms and conditions for using our platform and services.",
  alternates: {
    canonical: "/tos",
  },
  openGraph: {
    title: "Terms of Service | Velocity Labs",
    description:
      "Velocity Labs Terms of Service - Read our terms and conditions for using our platform and services.",
    url: "/tos",
  },
}

export default function TosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
