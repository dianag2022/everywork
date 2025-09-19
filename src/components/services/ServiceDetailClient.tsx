'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MapPin, Phone, MessageCircle, Star, Tag, User, ThumbsUp, Calendar, ChevronLeft, ChevronRight, X, Send, Camera, Trash2 } from 'lucide-react'
import WhatsAppButton from '@/components/services/WhatsAppButton'
import type { ServiceWithProvider } from '@/types/database'
import type { ReviewWithReviewer, ReviewStats, CreateReviewData, Review } from '@/types/review'
import ServiceImageGallery from './ServiceImageGallery'
import { useAuth } from '@/hooks/useAuth'
import { getServiceReviews, getServiceReviewStats, createReview, hasUserReviewedService, getUserReviewForService, updateReview } from '@/lib/services'

// Review Form Component
function ReviewForm({ 
    serviceId, 
    onReviewSubmitted, 
    existingReview,
    onCancel 
}: { 
    serviceId: string
    onReviewSubmitted: () => void
    existingReview?: Review
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
                // Reset form for new reviews
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
            <div className="bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-gray-600 mb-4">Debes iniciar sesión para escribir una reseña</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Iniciar sesión
                </button>
            </div>
        )
    }

    return (
        <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {existingReview ? 'Editar tu reseña' : 'Escribir una reseña'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calificación *
                    </label>
                    <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="p-1 transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-8 h-8 transition-colors ${
                                        star <= (hoveredRating || rating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                    }`}
                                />
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="ml-3 text-sm text-gray-600">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título de la reseña *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Resume tu experiencia en pocas palabras"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={200}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">{title.length}/200 caracteres</p>
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentario detallado
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Comparte los detalles de tu experiencia..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 caracteres</p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={rating === 0 || !title.trim() || isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Enviando...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
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
                className={`w-4 h-4 ${
                    i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
        <div className="border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
            <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {getReviewerAvatar() ? (
                        <img
                            src={getReviewerAvatar()}
                            alt={getReviewerName()}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                        </div>
                    )}
                </div>

                {/* Review Content */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h4 className="font-semibold text-gray-800">{getReviewerName()}</h4>
                            <div className="flex items-center space-x-2">
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
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Verificado
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <h5 className="font-medium text-gray-800 mb-2">{review.title}</h5>
                    
                    {review.comment && (
                        <p className="text-gray-600 mb-3 leading-relaxed">{review.comment}</p>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                        <div className="flex space-x-2 mb-3">
                            {review.images.slice(0, 3).map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`Review image ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                />
                            ))}
                            {review.images.length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                    +{review.images.length - 3}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Helpful Button */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => onHelpful?.(review.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">
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
            console.log("reviews data", reviewsData);
            
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
            <div className="flex items-center gap-2 text-sm">
                <span className="w-2 text-gray-600">{stars}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="text-gray-500 text-xs w-10">{Math.round(percentage)}%</span>
            </div>
        )
    }

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
                                    {service.category || 'Sin categoría'}
                                </span>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-500 font-medium">Ubicación</span>
                                <span className="text-gray-800 font-semibold">
                                    {service.city && service.state ? `${service.city}, ${service.state}` : 'No especificada'}
                                </span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-500 font-medium">Precios</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-800">
                                        ${service.min_price?.toLocaleString('es-CO') || '0'}
                                        {service.max_price && service.max_price !== service.min_price && (
                                            <span className="text-lg text-gray-500 ml-1">
                                                - ${service.max_price.toLocaleString('es-CO')}
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
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Reseñas y calificaciones</h2>
                        {user && !hasReviewed && (
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Escribir reseña
                            </button>
                        )}
                    </div>

                    {/* Review Stats */}
                    {reviewStats && reviewStats.total_reviews > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Overall Rating */}
                            <div className="text-center">
                                <div className="text-5xl font-bold text-gray-800 mb-2">
                                    {reviewStats.average_rating.toFixed(1)}
                                </div>
                                <div className="flex items-center justify-center mb-2">
                                    {renderStars(reviewStats.average_rating, "w-5 h-5")}
                                </div>
                                <p className="text-gray-600">
                                    Basado en {reviewStats.total_reviews} reseñas
                                </p>
                            </div>

                            {/* Rating Distribution */}
                            <div className="space-y-2">
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
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Tu reseña</h3>
                                <button
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    Editar
                                </button>
                            </div>
                            <ReviewCard review={{ 
                                ...userReview, 
                                reviewer: { 
                                    id: user.id,
                                    email: user.email || '',
                                    raw_user_meta_data: user.user_metadata || null
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
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando reseñas...</p>
                        </div>
                    ) : reviews.length > 0 ? (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-6">
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
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Ver más reseñas
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : !showReviewForm ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <Star className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                Aún no hay reseñas
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                Sé el primero en compartir tu experiencia con este servicio.
                            </p>
                            {user && (
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Escribir la primera reseña
                                </button>
                            )}
                        </div>
                    ) : null}
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