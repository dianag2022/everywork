import { getServiceById } from '@/lib/services'
import type { ServiceWithProvider } from '@/types/database'
import ServiceDetailClient from '@/components/services/ServiceDetailClient';

interface ServiceDetailProps {
  params: { id: string }
}

export default async function ServiceDetail({ params }: ServiceDetailProps) {
  // Server-side fetch
  const service: ServiceWithProvider = await getServiceById(params.id)

  return <ServiceDetailClient service={service} />
}
