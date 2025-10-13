import { MetadataRoute } from 'next'
import { generateServiceSlug } from '@/lib/slugify'
import { getActiveServices } from '@/lib/services';
import { ServiceWithProvider } from '@/types/database';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.goeverywork.com';
  
  // Fetch all services
  const services = await getActiveServices();
  
  // Generate service URLs
  const serviceUrls = services.map((service: ServiceWithProvider) => ({
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