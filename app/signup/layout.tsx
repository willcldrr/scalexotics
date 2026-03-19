import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your Velocity Labs account and start scaling your exotic car rental business with AI-powered lead generation.",
  alternates: {
    canonical: "/signup",
  },
  openGraph: {
    title: "Sign Up | Velocity Labs",
    description:
      "Create your Velocity Labs account and start scaling your exotic car rental business with AI-powered lead generation.",
    url: "/signup",
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
