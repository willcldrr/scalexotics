import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
  description:
    "Log in to your Scale Exotics dashboard to manage your leads, bookings, and fleet operations.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Login | Scale Exotics",
    description:
      "Log in to your Scale Exotics dashboard to manage your leads, bookings, and fleet operations.",
    url: "/login",
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
