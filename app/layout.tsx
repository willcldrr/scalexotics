import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Anton } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { GoogleAnalytics } from "@next/third-parties/google"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _anton = Anton({ subsets: ["latin"], weight: "400" })

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
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
