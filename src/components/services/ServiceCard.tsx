'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ServiceWithProvider } from '@/types/database'
import { StarIcon, HeartIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { getServiceReviewStats } from '@/lib/services'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Keyboard, Zoom } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'

interface ServiceCardProps {
  service: ServiceWithProvider
  onFavorite?: (serviceId: string) => void
  isFavorite?: boolean
}

interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_distribution?: {
    [key: number]: number
  }
}

export function ServiceCard({ service, onFavorite, isFavorite = false }: ServiceCardProps) {
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null)
  const providerName = 'Proveedor'

  useEffect(() => {
    const fetchReviewStats = async () => {
      try {
        setLoadingStats(true)
        const stats = await getServiceReviewStats(service.id)
        setReviewStats(stats)
      } catch (error) {
        console.error('Error fetching review stats:', error)
        setReviewStats({ average_rating: 0, total_reviews: 0 })
      } finally {
        setLoadingStats(false)
      }
    }

    fetchReviewStats()
  }, [service.id])

  // Force Swiper to update after mount
  useEffect(() => {
    if (swiperInstance) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        swiperInstance.update()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [swiperInstance])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(service.id)
  }

  return (
    <>
      <Link href={`/services/${service.id}`}>
        <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
          {/* Imagen del servicio con Swiper */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Swiper
              modules={[Pagination]}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              spaceBetween={0}
              slidesPerView={1}
              className="w-full h-full"
              onSwiper={setSwiperInstance}
              onSlideChange={(swiper: SwiperType) => {
                // You can track slide changes here if needed
              }}
              observer={true}
              observeParents={true}
            >
              {service.gallery.map((image, index) => (
                <SwiperSlide key={index}>
                  <div className="relative w-full h-full bg-gray-100">
                    <Image
                      src={image}
                      alt={`${service.title} - Imagen ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={index === 0}
                      draggable={false}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Información del servicio */}
          <div className="p-4">
            {/* Ubicación y calificación */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900 line-clamp-1">
                {service.title}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {loadingStats ? (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                ) : reviewStats && reviewStats.total_reviews > 0 ? (
                  <>
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {reviewStats.average_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({reviewStats.total_reviews})
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Sin reseñas</span>
                )}
              </div>
            </div>

            {/* Descripción corta */}
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {service.description}
            </p>

            {/* Características */}
            <div className="text-sm text-gray-500 mb-3">{providerName}</div>

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
      </Link>

      <style jsx global>{`
        /* Custom Swiper styles */
        .swiper {
          width: 100%;
          height: 100%;
        }

        .swiper-slide {
          height: 100%;
        }

        .swiper-pagination-bullet {
          background: white;
          opacity: 0.5;
          width: 8px;
          height: 8px;
        }

        .swiper-pagination-bullet-active {
          opacity: 1;
          width: 32px;
          border-radius: 4px;
        }

        .swiper-button-next,
        .swiper-button-prev {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .swiper-button-next::after,
        .swiper-button-prev::after {
          font-size: 20px;
        }

        .swiper-pagination-fraction {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          width: auto;
          left: 50%;
          transform: translateX(-50%);
          bottom: 16px;
        }

        /* Hide navigation on mobile */
        @media (max-width: 768px) {
          .swiper-button-next,
          .swiper-button-prev {
            display: none;
          }
        }
      `}</style>
    </>
  )
}