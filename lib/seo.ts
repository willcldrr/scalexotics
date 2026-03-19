import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://managevelocity.com'
const SITE_NAME = 'Velocity Labs'

export const seoConfig = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  defaultTitle: 'Velocity Labs | Exotic Car Rental Growth Platform',
  defaultDescription:
    'Scale your exotic car rental business to $50k+/month with AI-powered lead generation, automated booking, and fleet management. Trusted by 20+ fleet owners.',
  keywords: [
    'Velocity Labs',
    'exotic car rental',
    'luxury car rental',
    'exotic car rental marketing',
    'car rental lead generation',
    'exotic car fleet management',
    'rental business automation',
    'car rental booking system',
    'exotic car rental software',
    'luxury vehicle rental',
    'exotic fleet management',
    'car rental CRM',
    'rental business growth',
  ],
  author: 'Velocity Labs',
  twitterHandle: '@veloctylabs',
  ogImage: `${SITE_URL}/og-image.png`,
  locale: 'en_US',
}

export function generateMetadata({
  title,
  description,
  path = '',
  noIndex = false,
  ogImage,
}: {
  title?: string
  description?: string
  path?: string
  noIndex?: boolean
  ogImage?: string
}): Metadata {
  const fullTitle = title
    ? `${title} | ${seoConfig.siteName}`
    : seoConfig.defaultTitle
  const fullDescription = description || seoConfig.defaultDescription
  const url = `${seoConfig.siteUrl}${path}`
  const image = ogImage || seoConfig.ogImage

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: seoConfig.keywords,
    authors: [{ name: seoConfig.author }],
    creator: seoConfig.author,
    publisher: seoConfig.author,
    metadataBase: new URL(seoConfig.siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      locale: seoConfig.locale,
      url,
      siteName: seoConfig.siteName,
      title: fullTitle,
      description: fullDescription,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [image],
      creator: seoConfig.twitterHandle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  }
}

// JSON-LD Structured Data
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Velocity Labs',
  url: SITE_URL,
  logo: `${SITE_URL}/velocity.jpg`,
  description:
    'AI-powered lead capture and booking platform for exotic car rental fleets. Scale your rental business to $50k+/month with automated systems.',
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@managevelocity.com',
    contactType: 'customer service',
  },
  sameAs: [],
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Velocity Labs',
  url: SITE_URL,
  description: seoConfig.defaultDescription,
  publisher: {
    '@type': 'Organization',
    name: 'Velocity Labs',
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/velocity.jpg`,
    },
  },
}

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Velocity Labs',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered lead generation and booking management platform for exotic car rental businesses.',
  offers: {
    '@type': 'Offer',
    price: '125',
    priceCurrency: 'USD',
    priceValidUntil: '2025-12-31',
    description: 'Pay per booking - $125 per qualified booking',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '20',
    bestRating: '5',
    worstRating: '1',
  },
}

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Velocity Labs',
  url: SITE_URL,
  logo: `${SITE_URL}/velocity.jpg`,
  image: `${SITE_URL}/og-image.png`,
  description:
    'Growth platform for exotic car rental businesses. We help fleet owners scale to $50k+/month with AI-powered lead generation and automated booking systems.',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
  email: 'info@managevelocity.com',
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  serviceType: [
    'Lead Generation',
    'Marketing Automation',
    'Booking Management',
    'Fleet Management Software',
    'CRM',
  ],
}

// Generate all schemas as a single array for injection
export function getAllSchemas() {
  return [organizationSchema, websiteSchema, softwareApplicationSchema, localBusinessSchema]
}
