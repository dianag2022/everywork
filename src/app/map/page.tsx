'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { searchServices } from '@/lib/services'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, Loader2, AlertCircle, List, Map, X, Filter, DollarSign, ChevronDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ServiceWithProvider } from '@/types/database';
import { useCategories } from '@/hooks/useCategories'
import { generateServiceSlug } from '@/lib/slugify'

// Dynamically import MapSearch with no SSR to prevent window errors
const MapSearch = dynamic(() => import('@/components/search/MapSearch'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
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
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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

// Compact Price Range Component for Sidebar
function PriceRangeInputs({
    minPrice,
    maxPrice,
    onRangeChange,
    className = ""
}: {
    minPrice: number
    maxPrice: number
    onRangeChange: (min: number, max: number) => void
    className?: string
}) {
    const [tempMin, setTempMin] = useState(minPrice.toString())
    const [tempMax, setTempMax] = useState(maxPrice.toString())

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price)
    }

    const handleMinChange = (value: string) => {
        const numericValue = value.replace(/[^\d]/g, '')
        setTempMin(numericValue)
        const minNum = parseInt(numericValue) || 0
        const maxNum = parseInt(tempMax) || 10000000
        onRangeChange(minNum, maxNum)
    }

    const handleMaxChange = (value: string) => {
        const numericValue = value.replace(/[^\d]/g, '')
        setTempMax(numericValue)
        const minNum = parseInt(tempMin) || 0
        const maxNum = parseInt(numericValue) || 10000000
        onRangeChange(minNum, maxNum)
    }

    const clearFilters = () => {
        setTempMin('0')
        setTempMax('10000000')
        onRangeChange(0, 10000000)
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Input Fields */}
            <div className="space-y-2">
                <div className="space-y-1">
                    <label className="text-xs text-gray-600 font-medium">Precio mínimo</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                        <input
                            type="text"
                            value={tempMin}
                            onChange={(e) => handleMinChange(e.target.value)}
                            className="text-gray-700 placeholder-gray-400 w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-gray-600 font-medium">Precio máximo</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                        <input
                            type="text"
                            value={tempMax}
                            onChange={(e) => handleMaxChange(e.target.value)}
                            className="text-gray-700 placeholder-gray-400 w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                            placeholder="Sin límite"
                        />
                    </div>
                </div>
            </div>

            {/* Current Range Display */}
            {(parseInt(tempMin) > 0 || parseInt(tempMax) < 10000000) && (
                <div className="text-center py-2 px-3 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-xs font-medium text-green-700">
                        {formatPrice(parseInt(tempMin) || 0)} a {formatPrice(parseInt(tempMax) || 10000000)}
                    </span>
                </div>
            )}

            {/* Quick Preset Buttons */}
            <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Rangos rápidos</p>
                <div className="flex flex-col gap-2">
                    {[
                        { label: "Hasta $50k", min: 0, max: 50000 },
                        { label: "$50k - $200k", min: 50000, max: 200000 },
                        { label: "$200k - $500k", min: 200000, max: 500000 },
                        { label: "Más de $500k", min: 500000, max: 10000000 }
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                setTempMin(preset.min.toString())
                                setTempMax(preset.max.toString())
                                onRangeChange(preset.min, preset.max)
                            }}
                            className="w-full px-3 py-2 text-sm bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-lg transition-all duration-200 border border-gray-200 hover:border-green-300 text-left font-medium"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clear Button */}
            <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200 font-medium"
            >
                Limpiar filtro de precio
            </button>
        </div>
    )
}

// MapContent component
function MapContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('query') || ''
    const categoryParam = searchParams.get('category') || ''

    const [services, setServices] = useState<ServiceWithProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState(categoryParam)
    const [searchQuery, setSearchQuery] = useState(query)
    const [debouncedQuery, setDebouncedQuery] = useState(query)
    const [isSearching, setIsSearching] = useState(false)

    // Filter states
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false)
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 })
    const [hasActiveFilters, setHasActiveFilters] = useState(false)

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationLoading, setLocationLoading] = useState(true)
    const [locationError, setLocationError] = useState<string | null>(null)

    // Mobile-specific state
    const [showMobileList, setShowMobileList] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [mapMounted, setMapMounted] = useState(false)

    // Map state
    const [currentZoom, setCurrentZoom] = useState(13)
    const [searchRadius, setSearchRadius] = useState(50)
    const [mapBounds, setMapBounds] = useState<{ lat: number; lng: number }[] | null>(null)
    const [maxRadiusReached, setMaxRadiusReached] = useState(50)

    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()

    // Check for active filters
    useEffect(() => {
        setHasActiveFilters(
            category !== '' ||
            priceRange.min > 0 ||
            priceRange.max < 10000000
        )
    }, [category, priceRange])

    // Debounced search effect
    useEffect(() => {
        if (searchQuery !== debouncedQuery) {
            setIsSearching(true)
        }

        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery)
            setIsSearching(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery, debouncedQuery])

    // Detect mobile and mount map
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        const timer = setTimeout(() => {
            setMapMounted(true)
        }, 100)

        return () => {
            window.removeEventListener('resize', checkMobile)
            clearTimeout(timer)
        }
    }, [])

    // Zoom change handler
    const handleZoomChange = useCallback((zoomLevel: number, bounds?: { lat: number; lng: number }[]) => {
        setCurrentZoom(zoomLevel)
        if (bounds) {
            setMapBounds(bounds)
        }

        const newRadius = calculateRadiusFromZoom(zoomLevel, bounds, userLocation || undefined)
        const finalRadius = Math.max(newRadius, maxRadiusReached)

        setSearchRadius(finalRadius)
        if (finalRadius > maxRadiusReached) {
            setMaxRadiusReached(finalRadius)
        }
    }, [userLocation, maxRadiusReached])

    // Get user location
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
                },
                (error) => {
                    console.error('Error getting location:', error)
                    setLocationError('Unable to get your location. Showing all services.')
                    setLocationLoading(false)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            )
        }

        getCurrentLocation()
    }, [])

    // Update category from URL
    useEffect(() => {
        setCategory(categoryParam)
    }, [categoryParam])

    // Update search query from URL
    useEffect(() => {
        setSearchQuery(query)
        setDebouncedQuery(query)
    }, [query])

    // Fetch services with filters
    // Fetch services with filters
    useEffect(() => {
        async function fetchResults() {
            setLoading(true)
            try {
                const results: ServiceWithProvider[] = await searchServices(
                    debouncedQuery,
                    category,
                    priceRange.min,
                    priceRange.max,
                    userLocation || undefined,
                    searchRadius
                )
                setServices(results)
                updateURL(debouncedQuery, category)
            } catch (error) {
                console.error('Error fetching search results:', error)
                setServices([])
            } finally {
                setLoading(false)
            }
        }

        if (!locationLoading) {
            fetchResults()
        }
    }, [debouncedQuery, category, userLocation, locationLoading, searchRadius, priceRange])

    // Handle search form submit
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // The debouncing effect will handle updating debouncedQuery
        // No need to manually set it here
    }

    // Handle category change
    const handleCategoryChange = (selectedCategory: string) => {
        setCategory(selectedCategory)
        setIsFilterOpen(false)
        updateURL(debouncedQuery, selectedCategory)
    }

    // Handle price range change
    const handlePriceRangeChange = (min: number, max: number) => {
        setPriceRange({ min, max })
    }

    // Clear all filters
    const clearAllFilters = () => {
        setCategory('')
        setPriceRange({ min: 0, max: 10000000 })
        router.push('/map', { scroll: false })
    }

    // Update URL
    const updateURL = (query: string, cat: string) => {
        const params = new URLSearchParams()
        if (query) params.set('query', query)
        if (cat) params.set('category', cat)
        router.push(`/map?${params.toString()}`, { scroll: false })
    }

    // Filter row component
    // Filter row component
    // Filter row component
    const FilterRow = () => (
<div className="flex flex-col gap-3 w-full">
{/* Category Filter */}
            <div className="relative">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 rounded-full transition-all duration-200 border border-blue-200 text-sm"
                >
                    <Filter className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-blue-700">
                        {category || 'Categoría'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-blue-600 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] max-h-96 overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800">Filtrar por categoría</h3>
                        </div>

                        <div className="max-h-72 overflow-y-auto">
                            <button
                                onClick={() => handleCategoryChange('')}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center ${!category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                                <div className={`w-2 h-2 rounded-full mr-3 ${!category ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                Todas las categorías
                            </button>

                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(cat.name)}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center group ${category === cat.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                    title={cat.description}
                                >
                                    <div className={`w-2 h-2 rounded-full mr-3 transition-colors ${category === cat.name ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-400'}`}></div>
                                    <span className="truncate">{cat.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                            <p className="text-xs text-gray-500">
                                {categories.length} categorías disponibles
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Price Filter */}
            <div className="relative">
                <button
                    onClick={() => setIsPriceFilterOpen(!isPriceFilterOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 rounded-full transition-all duration-200 border border-green-200 text-sm"
                >
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="font-medium text-green-700">
                        Precio
                    </span>
                    <ChevronDown className={`w-3 h-3 text-green-600 transition-transform duration-200 ${isPriceFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPriceFilterOpen && (
                    <>
                        {/* Backdrop to close dropdown when clicking outside */}
                        <div
                            className="fixed inset-0 z-[99]"
                            onClick={() => setIsPriceFilterOpen(false)}
                        />
                        <div
  className="
    absolute top-full left-0 mt-2
    w-[250px]
    h-[250px] overflow-scroll
    md:h-auto md:overflow-visible
    bg-white rounded-xl shadow-xl border border-gray-200
    z-[101]
  "
>


                            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-800">Filtrar por precio</h3>
                            </div>

                            <div className="p-4">
                                <PriceRangeInputs
                                    minPrice={priceRange.min}
                                    maxPrice={priceRange.max}
                                    onRangeChange={handlePriceRangeChange}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
                <button
                    onClick={clearAllFilters}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-all duration-200 border border-red-200 text-sm"
                >
                    <X className="w-3 h-3" />
                    <span className="font-medium">Limpiar</span>
                </button>
            )}
        </div>
    )

    // Mobile controls
    const MobileControls = () => (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 md:hidden">
            <button
                onClick={() => setShowMobileList(!showMobileList)}
                className={`w-14 h-14 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 ${hasActiveFilters ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <Filter className="w-6 h-6" />
                {hasActiveFilters && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        !
                    </div>
                )}
            </button>
        </div>
    )

    // Mobile services list
    const MobileServicesList = () => (
        <div className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 md:hidden ${showMobileList ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ maxHeight: '80vh' }}>
            <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Servicios encontrados
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {services.length}
                    </span>
                </div>
                <FilterRow />
            </div>

            <div className="p-4 border-b border-gray-200">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar servicios"
                        className="text-gray-700 placeholder-gray-400 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                    )}
                </form>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
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
                    <div className="p-4 space-y-4">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => {
                                    setShowMobileList(false)
                                    router.push(`/services/${service.id}`)
                                }}
                            >
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

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">
                                        {service.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center py-8">
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
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="h-screen bg-white flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-80 bg-white border-r border-gray-200 flex-col overflow-hidden">
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

                <div className="p-4 border-b border-gray-200">
                    <form onSubmit={handleSearch} className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar servicios"
                            className="text-gray-700 placeholder-gray-400 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                        )}
                    </form>

                    <FilterRow />
                </div>

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
                                    <Link href={`/services/${generateServiceSlug(service)}`} key={service.id}>
                                        <div className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
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

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 truncate">
                                                    {service.title}
                                                </h3>
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
                                        </div>
                                    </Link>
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
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative min-h-0">
                {isMobile && userLocation && !locationLoading && (
                    <div className="absolute top-4 left-4 right-4 z-30 bg-green-100/90 backdrop-blur-sm border border-green-200 rounded-lg p-3 flex items-center">
                        <MapPin className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <span className="text-sm text-green-700 truncate">
                            {services.length} servicios en {searchRadius}km
                        </span>
                    </div>
                )}

                {mapMounted && (
                    <div className="w-full h-full">
                        <MapSearch
                            services={services}
                            selectedService={null}
                            onServiceSelect={(service) => {
                                // Handle service selection
                            }}
                            onZoomChange={handleZoomChange}
                        />
                    </div>
                )}

                {!mapMounted && (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Inicializando mapa...</p>
                        </div>
                    </div>
                )}
            </div>

            <MobileControls />
            <MobileServicesList />
        </div>
    )
}


// Loading fallback component
function MapLoading() {
    return (
        <div className="h-screen bg-white flex">
            <div className="hidden md:block w-80 bg-white border-r border-gray-200">
                <div className="flex-1 flex items-center justify-center h-full">
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