'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MapPin, Phone, MessageCircle, Star, Tag, User, ThumbsUp, Calendar, ChevronLeft, ChevronRight, X, Send, Camera, Trash2, ExternalLink, Monitor } from 'lucide-react'
import WhatsAppButton from '@/components/services/WhatsAppButton'
import type { ServiceWithProvider } from '@/types/database'
import type { ReviewWithReviewer, ReviewStats, CreateReviewData, Review } from '@/types/review'
import ServiceImageGallery from './ServiceImageGallery'
import { useAuth } from '@/hooks/useAuth'
import { getServiceReviews, getServiceReviewStats, createReview, hasUserReviewedService, getUserReviewForService, updateReview } from '@/lib/services'

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

// Embedded Content Component
function ServiceEmbed({ service }: { service: ServiceWithProvider }) {
    // Asumiendo que estas propiedades se agregarán al tipo ServiceWithProvider
    const embedTitle = (service as any).embed_title
    const embedUrl = (service as any).embed_url

    if (!embedTitle || !embedUrl) return null

    const isYouTube = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')
    const isVimeo = embedUrl.includes('vimeo.com')
    const isGoogleMaps = embedUrl.includes('google.com/maps')

    // Convert YouTube URLs to embed format
    const getEmbedUrl = (url: string) => {
        if (isYouTube) {
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url
        }
        if (isVimeo) {
            const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
            return videoId ? `https://player.vimeo.com/video/${videoId}` : url
        }
        return url
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-4"></div>
                <div className="flex items-center gap-3">
                    <Monitor className="w-6 h-6 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900">{embedTitle}</h2>
                </div>
            </div>

            <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%', height: 0 }}>
                {isYouTube || isVimeo ? (
                    <iframe
                        src={getEmbedUrl(embedUrl)}
                        title={embedTitle}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : isGoogleMaps ? (
                    <iframe
                        src={embedUrl}
                        title={embedTitle}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                ) : (
                    <iframe
                        src={embedUrl}
                        title={embedTitle}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                    />
                )}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Contenido proporcionado por el proveedor</span>
                <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                    Ver original <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    )
}

// Review Form Component
function ReviewForm({
    serviceId,
    onReviewSubmitted,
    existingReview,
    onCancel
}: {
    serviceId: string
    onReviewSubmitted: () => void
    existingReview?: Review | null
    onCancel?: () => void
}) {
    const { user } = useAuth()
    const [rating, setRating] = useState(existingReview?.rating || 0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [title, setTitle] = useState(existingReview?.title || '')
    const [comment, setComment] = useState(existingReview?.comment || '')
    const [images, setImages] = useState<string[]>(existingReview?.images || [])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || rating === 0 || !title.trim()) return

        setIsSubmitting(true)
        try {
            const reviewData: CreateReviewData = {
                service_id: serviceId,
                rating,
                title: title.trim(),
                comment: comment.trim(),
                images
            }

            if (existingReview) {
                await updateReview(existingReview.id, {
                    rating,
                    title: title.trim(),
                    comment: comment.trim(),
                    images
                })
            } else {
                await createReview(reviewData)
            }

            onReviewSubmitted()
            if (!existingReview) {
                setRating(0)
                setTitle('')
                setComment('')
                setImages([])
            }
        } catch (error) {
            console.error('Error submitting review:', error)
            const errorMessage = error instanceof Error ? error.message : 'Error al enviar la reseña'
            alert(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!user) {
        return (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center border border-gray-200">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-6 text-lg">Inicia sesión para escribir una reseña</p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium">
                    Iniciar sesión
                </button>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
                {existingReview ? 'Editar tu reseña' : 'Escribir una reseña'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Calificación *
                    </label>
                    <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="p-2 transition-transform hover:scale-110 rounded-lg hover:bg-white/50"
                            >
                                <Star
                                    className={`w-8 h-8 transition-colors ${star <= (hoveredRating || rating)
                                        ? 'text-yellow-400 fill-current drop-shadow-sm'
                                        : 'text-gray-300'
                                        }`}
                                />
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="ml-4 px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                                {rating === 1 && 'Muy malo'}
                                {rating === 2 && 'Malo'}
                                {rating === 3 && 'Regular'}
                                {rating === 4 && 'Bueno'}
                                {rating === 5 && 'Excelente'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Título de la reseña *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Resume tu experiencia en pocas palabras"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                        maxLength={200}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-2">{title.length}/200 caracteres</p>
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Comentario detallado
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Comparte los detalles de tu experiencia..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white shadow-sm"
                        maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-2">{comment.length}/1000 caracteres</p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-4">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={rating === 0 || !title.trim() || isSubmitting}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>Enviando...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                <span>{existingReview ? 'Actualizar reseña' : 'Publicar reseña'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

// Individual Review Component
function ReviewCard({ review, onHelpful }: { review: ReviewWithReviewer, onHelpful?: (reviewId: string) => void }) {
    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
            />
        ))
    }

    const getReviewerName = () => {
        const userData = review.reviewer;
        return userData?.full_name || userData.email?.split('@')[0] || 'Usuario anónimo'
    }

    const getReviewerAvatar = () => {
        const userData = review.reviewer;
        return userData?.avatar_url
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {getReviewerAvatar() ? (
                        <img
                            src={getReviewerAvatar()}
                            alt={getReviewerName()}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-white shadow-sm">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                    )}
                </div>

                {/* Review Content */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h4 className="font-semibold text-gray-900">{getReviewerName()}</h4>
                            <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center">
                                    {renderStars(review.rating)}
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(review.created_at).toLocaleDateString('es-CO', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                                {review.verified && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                        Verificado
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <h5 className="font-semibold text-gray-900 mb-2 text-lg">{review.title}</h5>

                    {review.comment && (
                        <p className="text-gray-600 mb-4 leading-relaxed">{review.comment}</p>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                        <div className="flex space-x-2 mb-4">
                            {review.images.slice(0, 3).map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`Review image ${index + 1}`}
                                    className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                                />
                            ))}
                            {review.images.length > 3 && (
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium border border-gray-200">
                                    +{review.images.length - 3}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Helpful Button */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => onHelpful?.(review.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors py-2 px-3 rounded-lg hover:bg-blue-50"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Útil ({review.helpful_count})
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Main Service Detail Component
export default function ServiceDetailClient({ service }: { service: ServiceWithProvider }) {
    const { user } = useAuth()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
    const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [hasReviewed, setHasReviewed] = useState(false)
    const [userReview, setUserReview] = useState<Review | null>(null)
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [reviewsPage, setReviewsPage] = useState(1)
    const [hasMoreReviews, setHasMoreReviews] = useState(false)
    console.log(service);

    // Prepare images array
    const images = service.gallery && service.gallery.length > 0 ? service.gallery : (service.main_image ? [service.main_image] : [])

    // Load reviews and stats
    useEffect(() => {
        loadReviews()
        loadReviewStats()
        if (user) {
            checkUserReview()
        }
    }, [service.id, user])

    const loadReviews = async () => {
        try {
            const reviewsData = await getServiceReviews(service.id, reviewsPage, 10)
            setReviews(reviewsData.reviews)
            setHasMoreReviews(reviewsData.has_more)
        } catch (error) {
            console.error('Error loading reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadReviewStats = async () => {
        try {
            const stats = await getServiceReviewStats(service.id)
            setReviewStats(stats)
        } catch (error) {
            console.error('Error loading review stats:', error)
        }
    }

    const checkUserReview = async () => {
        try {
            const hasReviewedService = await hasUserReviewedService(service.id)
            setHasReviewed(hasReviewedService)

            if (hasReviewedService) {
                const existingReview = await getUserReviewForService(service.id)
                setUserReview(existingReview)
            }
        } catch (error) {
            console.error('Error checking user review:', error)
        }
    }

    const handleReviewSubmitted = () => {
        loadReviews()
        loadReviewStats()
        checkUserReview()
        setShowReviewForm(false)
    }

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

                        {/* Embedded Content Section */}
                        <ServiceEmbed service={service} />

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
                        {user && !hasReviewed && (
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                            >
                                Escribir reseña
                            </button>
                        )}
                    </div>

                    {/* Review Stats */}
                    {reviewStats && reviewStats.total_reviews > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Overall Rating */}
                            <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200">
                                <div className="text-6xl font-bold text-gray-900 mb-3">
                                    {reviewStats.average_rating.toFixed(1)}
                                </div>
                                <div className="flex items-center justify-center mb-3">
                                    {renderStars(reviewStats.average_rating, "w-6 h-6")}
                                </div>
                                <p className="text-gray-600 font-medium text-lg">
                                    Basado en {reviewStats.total_reviews} reseña{reviewStats.total_reviews !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {/* Rating Distribution */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 mb-4">Distribución de calificaciones</h4>
                                {[5, 4, 3, 2, 1].map((rating) =>
                                    renderRatingBar(
                                        rating,
                                        reviewStats.rating_distribution[rating as keyof typeof reviewStats.rating_distribution],
                                        reviewStats.total_reviews
                                    )
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* User's Review or Review Form */}
                    {user && hasReviewed && userReview && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Tu reseña</h3>
                                <button
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    Editar reseña
                                </button>
                            </div>
                            <ReviewCard review={{
                                ...userReview,
                                reviewer: {
                                    id: user.id,
                                    email: user.email || '',
                                    full_name: user.user_metadata?.full_name,
                                    avatar_url: user.user_metadata?.avatar_url
                                }
                            } as ReviewWithReviewer} />
                        </div>
                    )}

                    {/* Review Form */}
                    {showReviewForm && (
                        <div className="mb-8">
                            <ReviewForm
                                serviceId={service.id}
                                onReviewSubmitted={handleReviewSubmitted}
                                existingReview={userReview}
                                onCancel={() => setShowReviewForm(false)}
                            />
                        </div>
                    )}

                    {/* Reviews List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 text-lg">Cargando reseñas...</p>
                        </div>
                    ) : reviews.length > 0 ? (
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">
                                Todas las reseñas ({reviewStats?.total_reviews || 0})
                            </h3>
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        onHelpful={(reviewId) => console.log('Helpful clicked:', reviewId)}
                                    />
                                ))}
                            </div>

                            {hasMoreReviews && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={() => {
                                            setReviewsPage(reviewsPage + 1)
                                            loadReviews()
                                        }}
                                        className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                                    >
                                        Ver más reseñas
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : !showReviewForm ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <Star className="w-10 h-10 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                Aún no hay reseñas
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                                Sé el primero en compartir tu experiencia con este servicio.
                            </p>
                            {user && (
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                                >
                                    Escribir la primera reseña
                                </button>
                            )}
                        </div>
                    ) : null}
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