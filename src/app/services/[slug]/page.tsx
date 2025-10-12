import { getServiceById,getServiceBySlug } from '@/lib/services'
import type { ServiceWithProvider } from '@/types/database'
import ServiceDetailClient from '@/components/services/ServiceDetailClient';
import { extractUuidFromSlug, getLocationString } from '@/lib/slugify';
import { notFound } from 'next/navigation';

interface ServiceDetailProps {
  params: Promise<{ slug: string }>
}

interface GenerateMetadataProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: GenerateMetadataProps) {
  try {
    const { slug } = await params;
    const shortUuid = extractUuidFromSlug(slug);
    const service: ServiceWithProvider = await getServiceBySlug(shortUuid);
    
    const location = getLocationString(service);
    const priceRange = service.min_price === service.max_price 
      ? `$${service.min_price.toLocaleString()}`
      : `$${service.min_price.toLocaleString()} - $${service.max_price.toLocaleString()}`;

    return {
      title: `${service.title} en ${location} | GoEveryWork`,
      description: service.description 
        ? `${service.description.substring(0, 155)}...` 
        : `Encuentra ${service.title} en ${location}. Precios desde ${priceRange}. Contacta directamente con el proveedor.`,
      keywords: `${service.title}, ${service.category || 'servicios'}, ${service.city || 'Cali'}, ${service.state || 'Valle del Cauca'}, ${service.country || 'Colombia'}`,
      openGraph: {
        title: `${service.title} en ${location}`,
        description: service.description || `${service.title} - ${priceRange}`,
        url: `https://www.goeverywork.com/services/${slug}`,
        images: service.main_image ? [
          {
            url: service.main_image,
            width: 1200,
            height: 630,
            alt: service.title,
          }
        ] : [],
        type: 'website',
        locale: 'es_CO',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${service.title} en ${location}`,
        description: service.description || `${service.title} - ${priceRange}`,
        images: service.main_image ? [service.main_image] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Servicio no encontrado | GoEveryWork',
      description: 'El servicio que buscas no está disponible.',
    };
  }
}

export default async function ServiceDetail({ params }: ServiceDetailProps) {
  try {
    const { slug } = await params;
    const shortUuid = extractUuidFromSlug(slug);
    const service: ServiceWithProvider = await getServiceBySlug(shortUuid);

    if (!service) {
      notFound();
    }

    const location = getLocationString(service);
    
    // Structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": service.title,
      "description": service.description || service.title,
      "image": service.main_image || undefined,
      "provider": {
        "@type": "Organization",
        "name": service.provider?.email || "GoEveryWork"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "COP",
        "lowPrice": service.min_price,
        "highPrice": service.max_price,
      },
      "areaServed": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": service.address || undefined,
          "addressLocality": service.city || "Cali",
          "addressRegion": service.state || "Valle del Cauca",
          "addressCountry": service.country || "CO",
          "postalCode": service.postal_code || undefined,
        },
        ...(service.latitude && service.longitude ? {
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": service.latitude,
            "longitude": service.longitude
          }
        } : {})
      },
      ...(service.category ? { "serviceType": service.category } : {}),
      "url": `https://www.goeverywork.com/services/${slug}`,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ServiceDetailClient service={service} />
      </>
    );
  } catch (error) {
    notFound();
  }
}