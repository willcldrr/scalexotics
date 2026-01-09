import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { GoogleAnalytics } from "@next/third-parties/google"
import { syne, inter } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: "Scale Exotics - Automate Your Rental Fleet to $50k/month+",
  description:
    "Learn how to scale your exotic car rental business to $50k/month+ with our automated booking assistant.",
  icons: {
    icon: "/scalexoticslogo.png",
    apple: "/scalexoticslogo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
