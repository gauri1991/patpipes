import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://patpipes.com'; // Update with your production domain

  // Static pages
  const staticPages = [
    '',
    '/login',
    '/signup',
    '/forgot-password',
    '/pricing',
    '/contact',
    '/privacy',
    '/terms',
    '/case-studies',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Case study pages
  const caseStudies = [
    'pharma-giant-roi',
    'law-firm-efficiency',
    'tech-startup-speed',
    'manufacturing-analytics',
    'university-research',
    'automotive-infringement',
  ].map((slug) => ({
    url: `${baseUrl}/case-studies/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...caseStudies];
}
