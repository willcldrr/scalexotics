import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Demo",
  description:
    "See how Velocity Labs can help you scale your exotic car rental business with AI-powered lead generation and automated booking systems.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Demo | Velocity Labs",
    description:
      "See how Velocity Labs can help you scale your exotic car rental business with AI-powered lead generation and automated booking systems.",
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
