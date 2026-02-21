import { Metadata } from 'next';

const siteConfig = {
  name: 'PatPipes',
  description: 'AI-powered patent analytics platform for law firms and enterprises. Transform your patent workflow with intelligent search, automated drafting, and comprehensive analytics.',
  url: 'https://patpipes.com',
  ogImage: 'https://patpipes.com/og-image.png',
  links: {
    twitter: 'https://twitter.com/patpipes',
    linkedin: 'https://linkedin.com/company/patpipes',
    github: 'https://github.com/patpipes',
  },
};

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = '/favicon.ico',
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title: title === siteConfig.name ? title : `${title} | ${siteConfig.name}`,
    description,
    keywords: [
      'patent analytics',
      'patent search',
      'patent drafting',
      'prior art search',
      'IP management',
      'patent intelligence',
      'infringement analysis',
      'patent landscape',
      'AI patent tools',
      'patent law firm software',
    ],
    authors: [
      {
        name: 'PatPipes',
        url: 'https://patpipes.com',
      },
    ],
    creator: 'PatPipes',
    publisher: 'PatPipes',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteConfig.url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@patpipes',
    },
    icons,
    metadataBase: new URL(siteConfig.url),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

// Structured data helpers
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PatPipes',
    url: 'https://patpipes.com',
    logo: 'https://patpipes.com/logo.png',
    description: siteConfig.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Innovation Drive',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94105',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-123-4567',
      contactType: 'Customer Service',
      email: 'support@patpipes.com',
    },
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.linkedin,
      siteConfig.links.github,
    ],
  };
}

export function generateWebPageSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    publisher: {
      '@type': 'Organization',
      name: 'PatPipes',
    },
  };
}

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PatPipes',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '299',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateArticleSchema(
  title: string,
  description: string,
  publishedDate: string,
  author: string,
  url: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PatPipes',
      logo: {
        '@type': 'ImageObject',
        url: 'https://patpipes.com/logo.png',
      },
    },
    datePublished: publishedDate,
    url,
  };
}

export { siteConfig };
