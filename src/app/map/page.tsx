'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { searchServices } from '@/lib/services'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, Loader2, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ServiceWithProvider } from '@/types/database';

// Dynamically import MapSearch with no SSR to prevent window errors
const MapSearch = dynamic(() => import('@/components/search/MapSearch'), {
    ssr: false,
    loading: () => (
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando mapa...</p>
            </div>
        </div>
    )
})

// Function to calculate search radius based on zoom level
const calculateRadiusFromZoom = (zoomLevel: number, mapBounds?: { lat: number; lng: number }[], userLocation?: { lat: number; lng: number }): number => {
    // Strategy 1: Use map bounds to calculate radius
    if (mapBounds && mapBounds.length >= 2 && userLocation) {
        // Calculate the distance from user location to the farthest corner of the visible map
        const distances = mapBounds.map(point => {
            const R = 6371 // Earth's radius in km
            const dLat = (point.lat - userLocation.lat) * Math.PI / 180
            const dLng = (point.lng - userLocation.lng) * Math.PI / 180
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                     Math.sin(dLng/2) * Math.sin(dLng/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            return R * c
        })
        // Use the maximum distance plus a buffer (e.g., 20%)
        const maxDistance = Math.max(...distances)
        return Math.max(10, Math.ceil(maxDistance * 1.2)) // At least 10km, with 20% buffer
    }
    
    // Strategy 2 (fallback): Progressive radius that doesn't shrink too much
    // Instead of drastically reducing radius when zooming in, maintain a reasonable minimum
    if (zoomLevel >= 15) return 25    // Street level - but keep 25km minimum
    if (zoomLevel >= 13) return 50    // City level - 50km
    if (zoomLevel >= 11) return 100   // Metro area - 100km
    if (zoomLevel >= 9) return 200    // Regional - 200km
    if (zoomLevel >= 7) return 400    // State/Province - 400km
    if (zoomLevel >= 5) return 800    // Country - 800km
    return 1500                       // Continental - 1500km
}

// Separate component that uses useSearchParams
function MapContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('query') || ''
    const categoryParam = searchParams.get('category') || ''
    const [services, setServices] = useState<ServiceWithProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState(categoryParam)
    const [searchQuery, setSearchQuery] = useState(query)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationLoading, setLocationLoading] = useState(true)
    const [locationError, setLocationError] = useState<string | null>(null)
    
    // New state for zoom level and radius
    const [currentZoom, setCurrentZoom] = useState(13) // Default zoom level
    const [searchRadius, setSearchRadius] = useState(50) // Default 50km radius
    const [mapBounds, setMapBounds] = useState<{ lat: number; lng: number }[] | null>(null)
    const [maxRadiusReached, setMaxRadiusReached] = useState(50) // Track the maximum radius used
    
    // Callback to handle zoom changes from MapSearch component
    const handleZoomChange = useCallback((zoomLevel: number, bounds?: { lat: number; lng: number }[]) => {
        setCurrentZoom(zoomLevel)
        if (bounds) {
            setMapBounds(bounds)
        }
        
        const newRadius = calculateRadiusFromZoom(zoomLevel, bounds, userLocation || undefined)
        
        // Strategy 3: Never shrink the radius below what we've already searched
        // This ensures that once a service is visible, it stays visible when zooming in
        const finalRadius = Math.max(newRadius, maxRadiusReached)
        
        setSearchRadius(finalRadius)
        if (finalRadius > maxRadiusReached) {
            setMaxRadiusReached(finalRadius)
        }
        
        // console.log(`Zoom level: ${zoomLevel}, Calculated radius: ${newRadius}km, Final radius: ${finalRadius}km`)
    }, [userLocation, maxRadiusReached])

    // Get user's current location
    useEffect(() => {
        const getCurrentLocation = () => {
            if (!navigator.geolocation) {
                setLocationError('Geolocation is not supported by this browser')
                setLocationLoading(false)
                return
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    setUserLocation({ lat: latitude, lng: longitude })
                    setLocationLoading(false)
                    // console.log('User location:', { lat: latitude, lng: longitude })
                },
                (error) => {
                    console.error('Error getting location:', error)
                    setLocationError('Unable to get your location. Showing all services.')
                    setLocationLoading(false)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            )
        }

        getCurrentLocation()
    }, [])

    // Update category state when URL parameter changes
    useEffect(() => {
        setCategory(categoryParam)
    }, [categoryParam])

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    // Fetch services with dynamic location filtering based on zoom
    useEffect(() => {
        async function fetchResults() {
            setLoading(true)
            try {
                const results: ServiceWithProvider[] = await searchServices(
                    searchQuery, 
                    category, 
                    userLocation || undefined, 
                    searchRadius // Use dynamic radius based on zoom
                )
                // console.log(`Results with ${searchRadius}km radius:`, results)
                setServices(results)
            } catch (error) {
                console.error('Error fetching search results:', error)
                setServices([])
            } finally {
                setLoading(false)
            }
        }

        // Only fetch results after we've tried to get location (success or failure)
        if (!locationLoading) {
            fetchResults()
        }
    }, [searchQuery, category, userLocation, locationLoading, searchRadius])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateURL(searchQuery, category)
    }

    const handleCategoryChange = (selectedCategory: string) => {
        setCategory(selectedCategory)
        updateURL(searchQuery, selectedCategory)
    }

    const updateURL = (query: string, cat: string) => {
        const params = new URLSearchParams()
        if (query) params.set('query', query)
        if (cat) params.set('category', cat)
        router.push(`/map?${params.toString()}`, { scroll: false })
    }

    const formatDistance = (distance?: number) => {
        if (!distance) return ''
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m away`
        }
        return `${distance.toFixed(1)}km away`
    }

    return (
        <div className="h-screen bg-white flex">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
                {/* Location Status */}
                {locationLoading && (
                    <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-blue-700">Getting your location...</span>
                    </div>
                )}
                
                {locationError && (
                    <div className="p-3 bg-yellow-50 border-b border-yellow-200 flex items-center">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-700">{locationError}</span>
                    </div>
                )}

                {userLocation && !locationLoading && (
                    <div className="p-3 bg-green-50 border-b border-green-200 flex items-center">
                        <MapPin className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-700">
                            Mostrando servicios dentro de los {searchRadius}km de tu ubicación
                        </span>
                    </div>
                )}

                {/* Search Section */}
                <div className="p-4 border-b border-gray-200">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar servicios"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </form>
                </div>


                {/* Services List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {userLocation ? 'Servicios cerca de tu ubicación' : 'Todos los servicios'}
                        </h2>
                        {userLocation && (
                            <p className="text-sm text-gray-600 mb-4">
                               Radio: {searchRadius}km • Max: {maxRadiusReached}km • {services.length} resultados
                            </p>
                        )}
                        {loading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="animate-pulse">
                                        <div className="flex space-x-3">
                                            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : services.length > 0 ? (
                            <div className="space-y-4">
                                {services.map((service) => (
                                    <div
                                        key={service.id}
                                        className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        {/* Service Image */}
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {service.gallery && service.gallery[0] ? (
                                                <img
                                                    src={service.gallery[0]}
                                                    alt={service.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <MapPin className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Service Info */}
                                        <Link href={`/services/${service.id}`} className="flex-1 min-w-0">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 truncate">
                                                    {service.title}
                                                </h3>
                                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                                                    <span>4.9 (123 reviews)</span>
                                                    {service.distance !== undefined && (
                                                        <>
                                                            <span className="mx-2">•</span>
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            <span>{formatDistance(service.distance)}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 truncate">
                                                    {service.description}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm font-medium text-green-600">
                                                        ${service.min_price}
                                                    </span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {service.category}
                                                    </span>
                                                </div>
                                                {service.address && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                                        📍 {service.city || service.address}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 mb-2">
                                    {userLocation 
                                        ? `No services found within ${searchRadius}km of your location.`
                                        : 'No services found matching your search.'
                                    }
                                </p>
                                {userLocation && (
                                    <p className="text-sm text-gray-500">
                                        Try zooming out on the map to expand your search area.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <MapSearch 
                services={services} 
                selectedService={null}
                onServiceSelect={(service) => {
                    // console.log('Selected service:', service)
                }}
                onZoomChange={handleZoomChange} // Pass the zoom change handler
            />
        </div>
    )
}

// Loading fallback component
function MapLoading() {
    return (
        <div className="h-screen bg-white flex">
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando mapa...</p>
                    </div>
                </div>
            </div>
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Inicializando mapa...</p>
                </div>
            </div>
        </div>
    )
}

// Main component with Suspense boundary
export default function MapPage() {
    return (
        <Suspense fallback={<MapLoading />}>
            <MapContent />
        </Suspense>
    )
}