import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Subscribe to the Velocity Labs newsletter for exotic car rental growth strategies, industry insights, and product updates.",
  alternates: {
    canonical: "/newsletter",
  },
  openGraph: {
    title: "Newsletter | Velocity Labs",
    description:
      "Subscribe to the Velocity Labs newsletter for exotic car rental growth strategies and industry insights.",
    url: "/newsletter",
  },
}

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
