'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MapPin, Phone, MessageCircle, Star, Tag, User, ThumbsUp, Calendar, ChevronLeft, ChevronRight, X, Send, Camera, Trash2, ExternalLink, Monitor } from 'lucide-react'
import WhatsAppButton from '@/components/services/WhatsAppButton'
import type { ServiceWithProvider } from '@/types/database'
import ServiceImageGallery from './ServiceImageGallery'
import { useAuth } from '@/hooks/useAuth'

// OpenStreetMap Component
function ServiceMap({ service }: { service: ServiceWithProvider }) {
    useEffect(() => {
        // Only load map if we have coordinates
        if (!service.latitude || !service.longitude) return

        // Create map container
        const mapContainer = document.getElementById('service-map')
        if (!mapContainer) return

        // Load Leaflet dynamically
        const loadLeaflet = async () => {
            if (typeof window !== 'undefined' && !(window as any).L) {
                // Load Leaflet CSS
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
                document.head.appendChild(link)

                // Load Leaflet JS
                const script = document.createElement('script')
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

                return new Promise((resolve) => {
                    script.onload = resolve
                    document.head.appendChild(script)
                })
            }
        }

        loadLeaflet().then(() => {
            const L = (window as any).L
            if (!L) return

            // Clear previous map
            mapContainer.innerHTML = ''

            // Initialize map
            const map = L.map('service-map', {
                zoomControl: true,
                scrollWheelZoom: false,
            }).setView([service.latitude, service.longitude], 15)

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map)

            // Add marker
            L.marker([service.latitude, service.longitude])
                .addTo(map)
                .bindPopup(`
                    <div class="text-sm">
                        <strong>${service.title}</strong><br/>
                        ${service.city ? `${service.city}, ` : ''}${service.state || ''}
                    </div>
                `)
                .openPopup()

            // Enable scroll wheel zoom on click
            map.on('click', () => {
                map.scrollWheelZoom.enable()
            })

            map.on('mouseout', () => {
                map.scrollWheelZoom.disable()
            })
        })
    }, [service])

    if (!service.latitude || !service.longitude) {
        return (
            <div className="bg-gray-100 rounded-xl p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Ubicación no disponible</p>
                <p className="text-sm text-gray-400 mt-1">
                    {service.city && service.state ? `${service.city}, ${service.state}` : 'Sin especificar'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Ubicación</h3>
                <a
                    href={`https://www.openstreetmap.org/?mlat=${service.latitude}&mlon=${service.longitude}&zoom=15`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                    Ver en Mapa <ExternalLink className="w-3 h-3" />
                </a>
            </div>
            <div
                id="service-map"
                className="w-full h-64 rounded-xl border border-gray-200 bg-gray-100"
                style={{ minHeight: '256px' }}
            />
            {(service.city || service.state) && (
                <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    {[service.city, service.state, service.country].filter(Boolean).join(', ')}
                </div>
            )}
        </div>
    )
}

// Main Service Detail Component
export default function ServiceDetailClient({ service }: { service: ServiceWithProvider }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    console.log("service detail client", service);

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

    const renderRatingBar = (stars: number, count: number, total: number) => {
        const percentage = total > 0 ? (count / total) * 100 : 0
        return (
            <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 w-12">
                    <span className="text-gray-600 font-medium">{stars}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="text-gray-500 text-xs w-12 text-right font-medium">{Math.round(percentage)}%</span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Main Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* Left Column (3/5) */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Service Title Header */}
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">{service.title}</h1>


                                    </div>

                                    {/* Price display */}
                                    {(service.min_price || service.max_price) && (
                                        <div className="lg:text-right bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                                            <div className="text-sm text-green-600 font-semibold mb-2">Precio desde</div>
                                            <div className="text-4xl font-bold text-green-700">
                                                ${service.min_price?.toLocaleString('es-CO') || '0'}
                                                {service.max_price && service.max_price !== service.min_price && (
                                                    <span className="text-xl text-green-500 ml-2">
                                                        - ${service.max_price.toLocaleString('es-CO')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <ServiceImageGallery
                            mainImage={service.main_image}
                            gallery={service.gallery}
                            title={service.title}
                        />

                        {/* Service Description */}
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                            <div className="flex items-center mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-4"></div>
                                <h2 className="text-3xl font-bold text-gray-900">Descripción del servicio</h2>
                            </div>

                            <div className="prose max-w-none">
                                {service.description ? (
                                    <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                                        {service.description}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <MessageCircle className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-lg">No hay descripción disponible</p>
                                        <p className="text-gray-400 text-sm mt-2">El proveedor no ha agregado una descripción para este servicio</p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Location Map */}
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                            <ServiceMap service={service} />
                        </div>
                    </div>

                    {/* Right Column (2/5) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sticky top-8">
                            <div className="flex items-center mb-6">
                                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-3"></div>
                                <h3 className="text-xl font-bold text-gray-900">Contactar proveedor</h3>
                            </div>

                            {/* Contact Methods */}
                            <div className="space-y-4 mb-8">
                                {service.phone_number && (
                                    <div className="group">
                                        <a
                                            href={`tel:${service.phone_number}`}
                                            className="flex items-center p-4 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                                        >
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                                                <Phone className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500 font-medium">Teléfono</div>
                                                <div className="font-semibold text-gray-900">{service.phone_number}</div>
                                            </div>
                                        </a>
                                    </div>
                                )}

                                {/* WhatsApp Button */}
                                <WhatsAppButton phoneNumber={service.phone_number} serviceName={service.title} />
                            </div>

                            {/* Service Details */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Información adicional</h4>

                                <div className="space-y-4">
                                    {/* Category */}
                                    {service.category && (
                                        <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
                                            <Tag className="w-4 h-4 mr-2" />
                                            {service.category}
                                        </div>
                                    )}

                                    {/* Meta badges
                                    <div className="flex flex-wrap items-center gap-3">
                                            

                                            {(service.city || service.state) && (
                                                <div className="flex items-center bg-gradient-to-r from-green-50 to-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    {[service.city, service.state].filter(Boolean).join(', ')}
                                                </div>
                                            )}

                                            {service.created_at && (
                                                <div className="flex items-center bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold border border-purple-200">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    {new Date(service.created_at).toLocaleDateString('es-CO', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            )}
                                        </div> */}

                                    {/* Location */}
                                    {/* {(service.city || service.state) && (
                                        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                                            <span className="text-gray-600 font-medium">Ubicación</span>
                                            <span className="text-gray-900 font-semibold text-right bg-white px-3 py-1 rounded-lg shadow-sm">
                                                {service.city && service.state ? `${service.city}, ${service.state}` : 'No especificada'}
                                            </span>
                                        </div>
                                    )} */}

                                    {(service.city || service.state) && (
                                        <div className="flex items-center bg-gradient-to-r from-green-50 to-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {service.city && service.state ? [service.city, service.state].filter(Boolean).join(', ') : 'No especificada'}
                                        </div>
                                    )}


                                    {/* Publication Date */}
                                    {service.created_at && (
                                        <div className="flex items-center bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold border border-purple-200">

                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(service.created_at).toLocaleDateString('es-CO', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    )}

                                    {/* {service.created_at && (
                                        <div className="flex items-center bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold border border-purple-200">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(service.created_at).toLocaleDateString('es-CO', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            <div className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full mr-4"></div>
                            <h2 className="text-3xl font-bold text-gray-900">Reseñas y calificaciones</h2>
                        </div>
                    </div>

                  

                </div>

                {/* Modal for full-screen image viewing */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
                        <div className="relative max-w-6xl max-h-full">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="relative">
                                <Image
                                    src={images[currentImageIndex]}
                                    alt={`${service.title} - Imagen ${currentImageIndex + 1}`}
                                    width={1200}
                                    height={800}
                                    className="max-h-[85vh] w-auto object-contain rounded-lg"
                                />

                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-70 transition-all duration-200"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-70 transition-all duration-200"
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