'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ServiceWithProvider } from '@/types/database'
import { StarIcon, HeartIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'

interface ServiceCardProps {
  service: ServiceWithProvider
  onFavorite?: (serviceId: string) => void
  isFavorite?: boolean
}

export function ServiceCard({ service, onFavorite, isFavorite = false }: ServiceCardProps) {
  const providerName = 'Proveedor';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };
  

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(service.id)
  }

  return (
    <Link href={`/services/${service.id}`}>

      <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
        {/* Imagen del servicio */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={service.main_image || '/placeholder-service.jpg'}
            alt={service.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

        </div>

        {/* Información del servicio */}
        <div className="p-4">
          {/* Ubicación y calificación */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">
              {service.title}
            </span>
            <div className="flex items-center gap-1">
              <StarIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">4.8</span>
              <span className="text-sm text-gray-500">(1)</span>
            </div>
          </div>

          {/* Título del servicio
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">
            {service.title}
          </h3> */}

          {/* Descripción corta */}
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {service.description}
          </p>

          {/* Características */}
          <div className="text-sm text-gray-500 mb-3">
             {providerName}
          </div>

          {/* Precio */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(service.min_price)}
              </span>
              <span className="text-sm text-gray-500 ml-1">desde</span>
            </div>
            <span className="text-sm text-gray-500">
              {formatPrice(service.max_price)} máximo
            </span>
          </div>
        </div>
      </div>
      {/* Tarjeta completa aquí */}
    </Link>
  )
}




