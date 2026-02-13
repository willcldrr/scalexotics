import type React from "react"
import type { Metadata, Viewport } from "next"
import { outfit, inter, jetbrainsMono } from "./fonts"
import { seoConfig, getAllSchemas } from "@/lib/seo"
import AnalyticsWrapper from "./components/analytics-wrapper"
import LoadingScreen from "./components/loading-screen"
import "./globals.css"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://scalexotics.com'

export const metadata: Metadata = {
  title: {
    default: seoConfig.defaultTitle,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.defaultDescription,
  keywords: seoConfig.keywords,
  authors: [{ name: seoConfig.author }],
  creator: seoConfig.author,
  publisher: seoConfig.author,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/scalexoticslogo.png",
    apple: "/scalexoticslogo.png",
    shortcut: "/scalexoticslogo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: seoConfig.siteName,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Scale Exotics - Exotic Car Rental Growth Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [`${SITE_URL}/og-image.png`],
    creator: seoConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: "technology",
}

// Viewport configuration for better mobile performance
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const schemas = getAllSchemas()

  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Critical preconnects for fastest resource loading */}
        <link rel="preconnect" href="https://imagedelivery.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for secondary resources */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Preload critical assets */}
        <link rel="preload" href="/scalexoticslogo.png" as="image" />

        {/* JSON-LD Structured Data - moved to end of head for non-blocking */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <LoadingScreen />
        {children}
        {/* Analytics loaded after main content */}
        <AnalyticsWrapper />
      </body>
    </html>
  )
}
