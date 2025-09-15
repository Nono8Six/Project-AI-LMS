import type { MetadataRoute } from 'next';
import { getAppBaseUrl } from '@/shared/utils/url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/*',
        '/api/*',
        '/_next/*',
        '/debug/*',
        '/unauthorized',
        '/upgrade',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}