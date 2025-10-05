'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MapPin, Phone, MessageCircle, Star, Tag, User, ThumbsUp, Calendar, ChevronLeft, ChevronRight, X, Edit2 , Send, Camera, Trash2, ExternalLink, Monitor, Plus, AlertCircle } from 'lucide-react'
import WhatsAppButton from '@/components/services/WhatsAppButton'
import type { ServiceWithProvider } from '@/types/database'
import type { CreateReviewData } from '@/types/review'
import ServiceImageGallery from './ServiceImageGallery'
import { useAuth } from '@/hooks/useAuth'
import { createReview, getServiceReviews, updateReview, deleteReview } from '@/lib/services'
import type { PaginatedReviews, ReviewWithReviewer } from '@/types/review'
import { toast } from 'react-hot-toast' // Or your preferred toast library

// Leaflet type definitions
interface LeafletMap {
    setView(latlng: [number, number], zoom: number): LeafletMap
    on(event: string, handler: () => void): void
    scrollWheelZoom: {
        enable(): void
        disable(): void
    }
}

interface LeafletMarker {
    addTo(map: LeafletMap): LeafletMarker
    bindPopup(content: string): LeafletMarker
    openPopup(): LeafletMarker
}

interface LeafletTileLayer {
    addTo(map: LeafletMap): LeafletTileLayer
}

interface LeafletStatic {
    map(id: string, options: {
        zoomControl: boolean
        scrollWheelZoom: boolean
    }): LeafletMap
    tileLayer(url: string, options: { attribution: string }): LeafletTileLayer
    marker(latlng: [number, number]): LeafletMarker
}

declare global {
    interface Window {
        L?: LeafletStatic
    }
}

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
            if (typeof window !== 'undefined' && !window.L) {
                // Load Leaflet CSS
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
                document.head.appendChild(link)

                // Load Leaflet JS
                const script = document.createElement('script')
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

                return new Promise<void>((resolve) => {
                    script.onload = () => resolve()
                    document.head.appendChild(script)
                })
            }
        }

        loadLeaflet().then(() => {
            const L = window.L
            if (!L) return

            // Clear previous map
            mapContainer.innerHTML = ''

            // Initialize map
            const map = L.map('service-map', {
                zoomControl: true,
                scrollWheelZoom: false,
            }).setView([service.latitude!, service.longitude!], 15)

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map)

            // Add marker
            L.marker([service.latitude!, service.longitude!])
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

// Review Form Component
function ReviewForm({ serviceId, onReviewSubmitted }: { serviceId: string, onReviewSubmitted: () => void }) {
    const { user } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        rating: 0,
        title: '',
        comment: '',
        images: [] as string[]
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        if (formData.rating === 0) {
            setError('Por favor selecciona una calificación')
            return
        }

        if (formData.title.trim().length < 3) {
            setError('El título debe tener al menos 3 caracteres')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const reviewData: CreateReviewData = {
                service_id: serviceId,
                rating: formData.rating,
                title: formData.title.trim(),
                comment: formData.comment.trim(),
                images: formData.images
            }

            await createReview(reviewData)
            setSuccess(true)
            setFormData({ rating: 0, title: '', comment: '', images: [] })
            onReviewSubmitted()

            // Hide success message after 3 seconds
            setTimeout(() => {
                setSuccess(false)
                setShowForm(false)
            }, 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar la reseña')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRatingClick = (rating: number) => {
        setFormData(prev => ({ ...prev, rating }))
        setError('')
    }

    if (!user) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <User className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-700 font-medium mb-2">Inicia sesión para escribir una reseña</p>
                <p className="text-blue-600 text-sm">Comparte tu experiencia con otros usuarios</p>
            </div>
        )
    }

    if (success) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-700 font-medium mb-2">¡Reseña enviada exitosamente!</p>
                <p className="text-green-600 text-sm">Gracias por compartir tu experiencia</p>
            </div>
        )
    }

    if (!showForm) {
        return (
            <div className="text-center">
                <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Escribir una reseña
                </button>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Escribir una reseña</h3>
                <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Calificación *
                    </label>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingClick(star)}
                                className={`transition-all duration-200 hover:scale-110 ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                                    }`}
                            >
                                <Star className="w-8 h-8 fill-current" />
                            </button>
                        ))}
                        {formData.rating > 0 && (
                            <span className="ml-2 text-sm font-medium text-gray-600">
                                ({formData.rating} de 5 estrellas)
                            </span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                        Título de la reseña *
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Resumen de tu experiencia..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        maxLength={200}
                        required
                    />
                    <div className="mt-1 text-xs text-gray-500 text-right">
                        {formData.title.length}/200 caracteres
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
                        Comentario (opcional)
                    </label>
                    <textarea
                        id="comment"
                        value={formData.comment}
                        onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Comparte más detalles sobre tu experiencia..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
                        maxLength={1000}
                    />
                    <div className="mt-1 text-xs text-gray-500 text-right">
                        {formData.comment.length}/1000 caracteres
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || formData.rating === 0}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Enviar reseña
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>)
}
// Reviews Display Component
function ReviewsDisplay({ serviceId, reviewsKey }: { serviceId: string, reviewsKey: number }) {
    const [reviews, setReviews] = useState<PaginatedReviews | null>(null)
    const [allReviews, setAllReviews] = useState<ReviewWithReviewer[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful'>('newest')
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
    const [editFormData, setEditFormData] = useState<{
        rating: number
        title: string
        comment: string
    }>({ rating: 5, title: '', comment: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null)
    const { user } = useAuth()
    const limit = 5

    const fetchReviews = async (page: number = 1, sort: typeof sortBy = 'newest', append: boolean = false) => {
        try {
            if (page === 1) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }
            setError('')

            const data = await getServiceReviews(serviceId, page, limit, sort)
            
            const reviewsArray = Array.isArray(data) ? data : data.data
            
            setReviews(data)

            if (append && page > 1) {
                setAllReviews(prev => [...prev, ...reviewsArray])
            } else {
                setAllReviews(reviewsArray)
            }
        } catch (err) {
            setError('Error al cargar las reseñas')
            console.error('Error fetching reviews:', err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        fetchReviews(1, sortBy, false)
        setCurrentPage(1)
    }, [serviceId, sortBy, reviewsKey])

    const handleSortChange = (newSort: typeof sortBy) => {
        setSortBy(newSort)
        setCurrentPage(1)
        setAllReviews([])
    }

    const handleLoadMore = () => {
        const nextPage = currentPage + 1
        setCurrentPage(nextPage)
        fetchReviews(nextPage, sortBy, true)
    }

    const handleEditClick = (review: ReviewWithReviewer) => {
        setEditingReviewId(review.id)
        setEditFormData({
            rating: review.rating,
            title: review.title,
            comment: review.comment || ''
        })
    }

    const handleCancelEdit = () => {
        setEditingReviewId(null)
        setEditFormData({ rating: 5, title: '', comment: '' })
    }

    const handleUpdateReview = async (reviewId: string) => {
        try {
            setIsSubmitting(true)
            
            await updateReview(reviewId, editFormData)
            
            setAllReviews(prev => prev.map(review => 
                review.id === reviewId 
                    ? { ...review, ...editFormData, updated_at: new Date().toISOString() }
                    : review
            ))
            
            setEditingReviewId(null)
            setEditFormData({ rating: 5, title: '', comment: '' })
            
            toast.success('Reseña actualizada exitosamente')
        } catch (err) {
            console.error('Error updating review:', err)
            toast.error('Error al actualizar la reseña')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClick = (reviewId: string) => {
        setReviewToDelete(reviewId)
        setShowDeleteConfirm(true)
    }

    const handleCancelDelete = () => {
        setReviewToDelete(null)
        setShowDeleteConfirm(false)
    }

    const handleConfirmDelete = async () => {
        if (!reviewToDelete) return

        try {
            setDeletingReviewId(reviewToDelete)
            
            await deleteReview(reviewToDelete)
            
            setAllReviews(prev => prev.filter(review => review.id !== reviewToDelete))
            
            // Refetch reviews to get updated stats
            fetchReviews(1, sortBy, false)
            
            setShowDeleteConfirm(false)
            setReviewToDelete(null)
            
            toast.success('Reseña eliminada exitosamente')
        } catch (err) {
            console.error('Error deleting review:', err)
            toast.error('Error al eliminar la reseña')
        } finally {
            setDeletingReviewId(null)
        }
    }

    const isOwnReview = (reviewerId: string) => {
        return user?.id === reviewerId
    }

    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
        ))
    }

    const renderEditableStars = (currentRating: number, onChange: (rating: number) => void) => {
        return [...Array(5)].map((_, i) => (
            <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                className="focus:outline-none"
            >
                <Star
                    className={`w-6 h-6 transition-colors ${
                        i < currentRating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300 hover:text-yellow-300'
                    }`}
                />
            </button>
        ))
    }

    if (loading && !reviews) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-gray-100 rounded-xl p-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-700 font-medium mb-2">Error al cargar las reseñas</p>
                <button
                    onClick={() => fetchReviews(currentPage, sortBy)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                    Intentar de nuevo
                </button>
            </div>
        )
    }

    if (!loading && (!allReviews || allReviews.length === 0)) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">Aún no hay reseñas</p>
                <p className="text-gray-400 text-sm">Sé el primero en compartir tu experiencia</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                ¿Eliminar reseña?
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta reseña?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={deletingReviewId !== null}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={deletingReviewId !== null}
                            >
                                {deletingReviewId ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews Stats */}
            {reviews?.stats && reviews.stats.average_rating !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <div className="text-4xl font-bold text-gray-900">{reviews.stats.average_rating.toFixed(1)}</div>
                            <div className="flex items-center">
                                {renderStars(Math.round(reviews.stats.average_rating))}
                            </div>
                        </div>
                        <p className="text-gray-600 font-medium">
                            Basado en {reviews.stats.total_reviews} reseña{reviews.stats.total_reviews !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviews?.stats?.total_reviews || 0
                            const percentage = reviews?.stats && reviews?.stats.total_reviews > 0 ? (count / reviews?.stats.total_reviews) * 100 : 0

                            return (
                                <div key={star} className="flex items-center gap-3 text-sm">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-gray-600 font-medium">{star}</span>
                                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-gray-500 text-xs w-8 text-right font-medium">
                                        {count}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Sort Controls */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    Reseñas ({reviews?.pagination?.total_count || 0})
                </h3>
                <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguas</option>
                    <option value="rating_high">Mejor calificadas</option>
                    <option value="rating_low">Menor calificadas</option>
                    <option value="helpful">Más útiles</option>
                </select>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {allReviews.map((review: ReviewWithReviewer) => {
                    const isEditing = editingReviewId === review.id
                    const isOwn = isOwnReview(review.reviewer_id)

                    return (
                        <div 
                            key={review.id} 
                            className={`bg-white border rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 ${
                                isOwn ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
                            }`}
                        >
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900">Editar reseña</h4>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Calificación
                                        </label>
                                        <div className="flex items-center gap-1">
                                            {renderEditableStars(editFormData.rating, (rating) => 
                                                setEditFormData(prev => ({ ...prev, rating }))
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Título
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.title}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            maxLength={200}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Comentario (opcional)
                                        </label>
                                        <textarea
                                            value={editFormData.comment}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, comment: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={4}
                                            maxLength={1000}
                                        />
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => handleUpdateReview(review.id)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isSubmitting || !editFormData.title.trim()}
                                        >
                                            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-semibold text-lg">
                                            {review.reviewer?.full_name ? review.reviewer.full_name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {review.reviewer?.email?.split('@')[0] || 'Usuario anónimo'}
                                                    </h4>
                                                    {isOwn && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                                            Tu reseña
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
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
                                                    {review.updated_at !== review.created_at && (
                                                        <span className="text-xs text-gray-400">(editada)</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {isOwn && (
                                                <div className="flex gap-2 ml-2">
                                                    <button
                                                        onClick={() => handleEditClick(review)}
                                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(review.id)}
                                                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                                                        disabled={deletingReviewId === review.id}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>

                                        {review.comment && (
                                            <p className="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
                                                {review.comment}
                                            </p>
                                        )}

                                        {review.images && review.images.length > 0 && (
                                            <div className="flex gap-2 mb-3">
                                                {review.images.slice(0, 3).map((image, index) => (
                                                    <div key={index} className="relative">
                                                        <Image
                                                            src={image}
                                                            alt={`Imagen de reseña ${index + 1}`}
                                                            width={80}
                                                            height={80}
                                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm">
                                            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                                                <ThumbsUp className="w-4 h-4" />
                                                Útil ({review.helpful_count || 0})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
export default function ServiceDetailClient({ service }: { service: ServiceWithProvider }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [reviewsKey, setReviewsKey] = useState(0)
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

    const handleReviewSubmitted = () => {
        // Force re-render of reviews section if needed
        setReviewsKey(prev => prev + 1)
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

                                    {/* Location */}
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

                    {/* Review Form */}
                    <div className="mb-8">
                        <ReviewForm serviceId={service.id} onReviewSubmitted={handleReviewSubmitted} />
                    </div>

                    {/* Reviews Display */}
                    <ReviewsDisplay serviceId={service.id} reviewsKey={reviewsKey} />
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