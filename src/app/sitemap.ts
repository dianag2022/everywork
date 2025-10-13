import { MetadataRoute } from 'next'
import { generateServiceSlug } from '@/lib/slugify'

// Fetch all active services from your API
async function getAllServices() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${apiUrl}/services`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch services for sitemap');
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching services for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.goeverywork.com';
  
  // Fetch all services
  const services = await getAllServices();
  
  // Generate service URLs
  const serviceUrls = services.map((service: any) => ({
    url: `${baseUrl}/services/${generateServiceSlug(service)}`,
    lastModified: new Date(service.updated_at || service.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }
  ];

  return [...staticPages, ...serviceUrls];
}