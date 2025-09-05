'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Phone, MessageCircle, Star, Tag, User, ThumbsUp, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import WhatsAppButton from '@/components/services/WhatsAppButton'
import type { ServiceWithProvider } from '@/types/database'
import ServiceImageGallery from './ServiceImageGallery'

// Mock reviews data - replace with actual data from your database
const mockReviews = [
    {
        id: 1,
        author: "Sophia Carter",
        avatar: "/api/placeholder/40/40",
        rating: 5,
        date: "1 month ago",
        comment: "Contraté a esta empresa para una renovación completa de mi hogar, y no podría estar más feliz con los resultados. El equipo de diseño fue increíblemente profesional y atento a mis necesidades. Transformaron mi casa anticuada en un hogar moderno y elegante que superó mis expectativas. ¡Altamente recomendado!"
    },
    {
        id: 2,
        author: "Ethan Bennett",
        avatar: "/api/placeholder/40/40",
        rating: 4,
        date: "2 months ago",
        comment: "Los servicios de diseño de interiores fueron excelentes. El equipo fue creativo y eficiente, entregando un hermoso diseño dentro del plazo acordado. Hubo algunos problemas menores durante la implementación, pero se resolvieron rápidamente. En general, una gran experiencia."
    }
]

const mockRatingBreakdown = {
    5: 70,
    4: 20,
    3: 5,
    2: 3,
    1: 2
}

export default function ServiceDetailClient({ service }: { service: ServiceWithProvider }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const averageRating = 4.8
    const totalReviews = 125

    // Prepare images array
    const images = service.gallery && service.gallery.length > 0 ? service.gallery : (service.main_image ? [service.main_image] : [])

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    const openModal = (index: number) => {
        setCurrentImageIndex(index)
        setIsModalOpen(true)
    }

    const renderStars = (rating: number, size: string = "w-4 h-4") => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`${size} ${i < Math.round(rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
            />
        ))
    }

    const renderRatingBar = (stars: number, percentage: number) => (
        <div className="flex items-center gap-2 text-sm">
            <span className="w-2 text-gray-600">{stars}</span>
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-gray-500 text-xs w-10">{percentage}%</span>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Main Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <ServiceImageGallery
                            mainImage={service.main_image}
                            gallery={service.gallery}
                            title={service.title}
                        />

                        {/* Service Description */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Descripción del servicio</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {service.description || 'No hay descripción disponible.'}
                            </p>
                        </div>
                    </div>

                    {/* Right Column (1/3) */}
                    <div className="bg-white rounded-2xl shadow-sm p-8 h-fit">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Detalles del servicio</h3>

                        {/* Category */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-500 font-medium">Categoría</span>
                                <span className="text-gray-800 font-semibold">
                                    {service.category || 'Interior Design'}
                                </span>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-500 font-medium">Ubicación</span>
                                <span className="text-gray-800 font-semibold">
                                    {service.city && service.state ? `${service.city}, ${service.state}` : 'San Francisco, CA'}
                                </span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-500 font-medium">Precios</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-800">
                                        ${service.min_price.toLocaleString('en-US')}
                                        {service.max_price !== service.min_price && (
                                            <span className="text-lg text-gray-500 ml-1">
                                                - ${service.max_price.toLocaleString('en-US')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        {service.phone_number && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">

                                    <a
                                        href={`tel:${service.phone_number}`}
                                        className="text-gray-600 hover:text-gray-700 transition-colors"
                                    >

                                        <div className="flex items-center">
                                            <Phone className="w-5 h-5 mr-3 text-gray-600" />
                                            <span className="text-gray-700 font-medium">{service.phone_number}</span>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* WhatsApp Button */}
                        <div className="mb-8">
                            <WhatsAppButton phoneNumber={service.phone_number} serviceName={service.title} />
                        </div>

                        {/* Extra Info */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="grid grid-cols-1 gap-4 text-sm">
                                {service.created_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Publicado:</span>
                                        <span className="text-gray-800 font-medium">
                                            {new Date(service.created_at).toLocaleDateString('es-CO', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                                {/* Complete Location Info */}
                                {(service.city || service.state || service.country) && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Ubicación completa:</span>
                                        <span className="text-gray-800 font-medium text-right">
                                            {[service.city, service.state, service.country]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Reviews Section */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Testimonios</h2>

                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                            <Star className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Testimonios próximamente</h3>
                        <p className="text-gray-500 max-w-md">
                            Estamos trabajando en implementar el sistema de reseñas y testimonios.
                            ¡Pronto podrás ver las opiniones de nuestros clientes satisfechos!
                        </p>
                    </div>
                </div>

                {/* Modal for full-screen image viewing */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                        <div className="relative max-w-4xl max-h-full">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="relative">
                                <Image
                                    src={images[currentImageIndex]}
                                    alt={`${service.title} - Imagen ${currentImageIndex + 1}`}
                                    width={1200}
                                    height={800}
                                    className="max-h-[80vh] w-auto object-contain rounded-lg"
                                />

                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}