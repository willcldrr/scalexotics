import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://managevelocity.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/dashboard',
          '/admin/',
          '/api/',
          '/checkout/',
          '/verify-access',
          '/reset-password',
          '/check-email',
          '/forgot-password',
          '/sign/',
          '/pay/',
          '/invoice/',
          '/book/',
          '/inspection/',
          '/embed',
          '/demo-notifications',
          '/unsubscribe',
          '/newsletter',
          '/carousel',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
