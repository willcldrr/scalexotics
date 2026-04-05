import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Velocity Labs - we help exotic car rental fleet owners build automated systems that generate consistent $50k+ months on autopilot.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Velocity Labs",
    description:
      "Learn about Velocity Labs - we help exotic car rental fleet owners build automated systems that generate consistent $50k+ months on autopilot.",
    url: "/about",
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
