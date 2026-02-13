import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Demo",
  description:
    "See how Scale Exotics can help you scale your exotic car rental business with AI-powered lead generation and automated booking systems.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Demo | Scale Exotics",
    description:
      "See how Scale Exotics can help you scale your exotic car rental business with AI-powered lead generation and automated booking systems.",
    url: "/demo",
  },
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
