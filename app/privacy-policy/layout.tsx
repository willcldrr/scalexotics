import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Velocity Labs Privacy Policy - Learn how we collect, use, and protect your personal information.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Velocity Labs",
    description:
      "Velocity Labs Privacy Policy - Learn how we collect, use, and protect your personal information.",
    url: "/privacy-policy",
  },
}

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
