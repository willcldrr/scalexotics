import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SMS Terms",
  description:
    "Scale Exotics SMS Terms and Conditions - Learn about our SMS communication policies and your rights.",
  alternates: {
    canonical: "/sms-terms",
  },
  openGraph: {
    title: "SMS Terms | Scale Exotics",
    description:
      "Scale Exotics SMS Terms and Conditions - Learn about our SMS communication policies and your rights.",
    url: "/sms-terms",
  },
}

export default function SmsTermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
