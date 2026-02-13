import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Only pay us when you get paid. We send pre-qualified renters to your exotic car fleet. Fill your weekday gaps and scale your rental business.",
  alternates: {
    canonical: "/offer",
  },
  openGraph: {
    title: "Get Started with Scale Exotics",
    description:
      "Only pay us when you get paid. We send pre-qualified renters to your exotic car fleet. Fill your weekday gaps and scale your rental business.",
    url: "/offer",
  },
}

export default function OfferLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
