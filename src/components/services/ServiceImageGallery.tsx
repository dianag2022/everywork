'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Keyboard, Zoom } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/zoom'

interface ServiceImageGalleryProps {
  mainImage: string | undefined
  gallery: string[] | null
  title: string
}

export default function ServiceImageGallery({ mainImage, gallery, title }: ServiceImageGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialSlide, setInitialSlide] = useState(0)

  const images = gallery && gallery.length > 0 ? gallery : (mainImage ? [mainImage] : [])

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-96 flex items-center justify-center">
          <p className="text-gray-500">No hay imágenes disponibles</p>
        </div>
      </div>
    )
  }

  const openModal = (index: number) => {
    setInitialSlide(index)
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = 'unset'
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <Swiper
          modules={[Pagination]}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          spaceBetween={0}
          slidesPerView={1}
          className="aspect-[16/9]"
          onSlideChange={(swiper: SwiperType) => {
            // You can track slide changes here if needed
          }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div
                className="relative w-full h-full bg-black cursor-pointer"
                onClick={() => openModal(index)}
              >
                <Image
                  src={image}
                  alt={`${title} - Imagen ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  draggable={false}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black z-50">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-50 bg-white/10 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/20 transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Keyboard, Zoom]}
            navigation
            pagination={{
              type: 'fraction',
            }}
            keyboard={{
              enabled: true,
            }}
            zoom={{
              maxRatio: 3,
              minRatio: 1,
            }}
            initialSlide={initialSlide}
            spaceBetween={0}
            slidesPerView={1}
            className="w-full h-full"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="swiper-zoom-container w-full h-full flex items-center justify-center">
                  <Image
                    src={image}
                    alt={`${title} - Imagen ${index + 1}`}
                    fill
                    className="object-contain"
                    draggable={false}
                    sizes="100vw"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      <style jsx global>{`
        /* Custom Swiper styles */
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