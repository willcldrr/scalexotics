import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore Velocity Labs services: Lead Magnet for targeted acquisition, Conversion System for AI-powered booking automation, and Insight Engine for real-time analytics.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Services | Velocity Labs",
    description:
      "Explore Velocity Labs services: Lead Magnet for targeted acquisition, Conversion System for AI-powered booking automation, and Insight Engine for real-time analytics.",
    url: "/services",
  },
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
