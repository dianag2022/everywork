'use client'

import { useState, useEffect, Suspense } from 'react'
import { searchServices } from '@/lib/services'
import { useSearchParams, useRouter } from 'next/navigation'
import { ServiceCard } from '@/components/services/ServiceCard'
import { useCategories } from '@/hooks/useCategories'
import SearchBar from '@/components/search/SearchBar'
import { ServiceWithProvider } from '@/types/database';
import { Filter, Grid, List, ChevronDown, DollarSign, X } from 'lucide-react'

// Simple Price Range Component with Two Inputs
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
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [tempMin, setTempMin] = useState(minPrice.toString())
  const [tempMax, setTempMax] = useState(maxPrice.toString())

  // Initialize from URL params on mount and when props change
  useEffect(() => {
    const urlMinPrice = searchParams.get('min_price')
    const urlMaxPrice = searchParams.get('max_price')
    
    // Use URL params if available, otherwise use props
    const newMin = urlMinPrice || minPrice.toString()
    const newMax = urlMaxPrice || maxPrice.toString()
    
    setTempMin(newMin)
    setTempMax(newMax)
  }, [searchParams, minPrice, maxPrice])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const updateURL = (newMin?: string, newMax?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Handle min price
    const minValue = newMin !== undefined ? newMin : tempMin
    if (minValue && parseInt(minValue) > 0) {
      params.set('min_price', minValue)
    } else {
      params.delete('min_price')
    }

    // Handle max price
    const maxValue = newMax !== undefined ? newMax : tempMax
    if (maxValue && parseInt(maxValue) < 10000000) {
      params.set('max_price', maxValue)
    } else {
      params.delete('max_price')
    }

    // Keep existing query and category parameters
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    
    if (query) {
      params.set('query', query)
    }
    
    if (category) {
      params.set('category', category)
    }

    // Update the URL
    router.push(`/search?${params.toString()}`, { scroll: false })
  }

  const handleMinChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^\d]/g, '')
    setTempMin(numericValue)

    const minNum = parseInt(numericValue) || 0
    const maxNum = parseInt(tempMax) || 10000000
    onRangeChange(minNum, maxNum)

    // Update URL
    updateURL(numericValue, undefined)
  }

  const handleMaxChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^\d]/g, '')
    setTempMax(numericValue)

    const minNum = parseInt(tempMin) || 0
    const maxNum = parseInt(numericValue) || 10000000
    onRangeChange(minNum, maxNum)

    // Update URL
    updateURL(undefined, numericValue)
  }

  const clearFilters = () => {
    setTempMin('0')
    setTempMax('10000000')
    onRangeChange(0, 10000000)
    
    // Remove price params from URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('min_price')
    params.delete('max_price')
    
    // Keep existing query and category parameters
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    
    if (query) {
      params.set('query', query)
    }
    
    if (category) {
      params.set('category', category)
    }

    router.push(`/search?${params.toString()}`, { scroll: false })
  }

  const handlePresetClick = (preset: { label: string, min: number, max: number }) => {
    setTempMin(preset.min.toString())
    setTempMax(preset.max.toString())
    onRangeChange(preset.min, preset.max)
    
    updateURL(preset.min.toString(), preset.max.toString())
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">Rango de precio</span>
        </div>
        <button
          onClick={clearFilters}
          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Precio mínimo</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
            <input
              type="text"
              value={tempMin}
              onChange={(e) => handleMinChange(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Precio máximo</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
            <input
              type="text"
              value={tempMax}
              onChange={(e) => handleMaxChange(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
              placeholder="Sin límite"
            />
          </div>
        </div>
      </div>

      {/* Current Range Display */}
      {(parseInt(tempMin) > 0 || parseInt(tempMax) < 10000000) && (
        <div className="text-center py-2 px-4 bg-green-50 rounded-lg border border-green-100">
          <span className="text-sm font-medium text-green-700">
            Buscando de {formatPrice(parseInt(tempMin) || 0)} a {formatPrice(parseInt(tempMax) || 10000000)}
          </span>
        </div>
      )}

      {/* Quick preset buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Hasta $50k", min: 0, max: 50000 },
          { label: "$50k - $200k", min: 50000, max: 200000 },
          { label: "$200k - $500k", min: 200000, max: 500000 },
          { label: "Más de $500k", min: 500000, max: 10000000 }
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded-full transition-all duration-200 border border-transparent hover:border-green-200"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Separate component that uses useSearchParams
function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('query') || ''
  const categoryParam = searchParams.get('category') || ''
  
  // Initialize price range from URL parameters
  const initialMinPrice = parseInt(searchParams.get('min_price') || '0') || 0
  const initialMaxPrice = parseInt(searchParams.get('max_price') || '10000000') || 10000000

  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [filteredServices, setFilteredServices] = useState<ServiceWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(categoryParam)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false)
  const [priceRange, setPriceRange] = useState({ 
    min: initialMinPrice, 
    max: initialMaxPrice 
  })
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()

  // Update category state when URL parameter changes
  useEffect(() => {
    setCategory(categoryParam)
  }, [categoryParam])

  // Update price range when URL parameters change
  useEffect(() => {
    const urlMinPrice = parseInt(searchParams.get('min_price') || '0') || 0
    const urlMaxPrice = parseInt(searchParams.get('max_price') || '10000000') || 10000000
    
    setPriceRange({ 
      min: urlMinPrice, 
      max: urlMaxPrice 
    })
  }, [searchParams])

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      try {
        // Pass price filters to the search function for database-level filtering
        const results = await searchServices(
          query,
          category,
          priceRange.min,
          priceRange.max
        )
        setServices(results)
        setFilteredServices(results)
      } catch (error) {
        console.error('Error fetching search results:', error)
        setServices([])
        setFilteredServices([])
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [query, category, priceRange])

  // Remove client-side price filtering since it's now done at database level
  useEffect(() => {
    setFilteredServices(services)

    // Check if filters are active
    setHasActiveFilters(
      category !== '' ||
      priceRange.min > 0 ||
      priceRange.max < 10000000
    )
  }, [services, category, priceRange])

  const handleCategoryChange = (selectedCategory: string) => {
    setCategory(selectedCategory)
    setIsFilterOpen(false)

    // Update URL with the new category filter
    const params = new URLSearchParams(searchParams.toString())
    if (selectedCategory) {
      params.set('category', selectedCategory)
    } else {
      params.delete('category')
    }

    // Keep the existing query parameter
    if (query) {
      params.set('query', query)
    }

    // Update the URL
    router.push(`/search?${params.toString()}`, { scroll: false })
  }

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max })
  }

  const clearAllFilters = () => {
    setCategory('')
    setPriceRange({ min: 0, max: 10000000 })
    
    // If there's a query, keep it, otherwise go to clean search page
    const params = new URLSearchParams()
    if (query) {
      params.set('query', query)
      router.push(`/search?${params.toString()}`, { scroll: false })
    } else {
      router.push(`/search`, { scroll: false })
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-10">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {query ? `Resultados para "${query}"` : 'Explora Servicios'}
          </h1>
          <p className="text-gray-600 text-lg">
            Encuentra el servicio perfecto para tus necesidades
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Filters and Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-8 relative overflow-visible z-[90]">
          <div className="flex flex-col space-y-4">
            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-4 relative z-[95]">
              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 rounded-full transition-all duration-200 border border-blue-200"
                >
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {category || 'Categoría'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Category Dropdown */}
                {isFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] max-h-96 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800">Filtrar por categoría</h3>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      <button
                        onClick={() => handleCategoryChange('')}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center ${!category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-3 ${!category ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        Todas las categorías
                      </button>

                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.name)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center group ${category === cat.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                          title={cat.description}
                        >
                          <div className={`w-2 h-2 rounded-full mr-3 transition-colors ${category === cat.name ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-400'
                            }`}></div>
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 border ${
                    (priceRange.min > 0 || priceRange.max < 10000000)
                      ? 'bg-gradient-to-r from-green-200 to-emerald-200 border-green-300 text-green-800'
                      : 'bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 border-green-200 text-green-700'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {(priceRange.min > 0 || priceRange.max < 10000000) 
                      ? `$${(priceRange.min / 1000).toFixed(0)}k - $${(priceRange.max / 1000).toFixed(0)}k`
                      : 'Precio'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPriceFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Price Filter Dropdown */}
                {isPriceFilterOpen && (
                  <div className="absolute top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] overflow-visible
                                  w-72 sm:w-80 md:w-96
                                  right-0 sm:left-0 sm:right-auto
                                  max-w-[calc(100vw-2rem)]">
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
                )}
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-all duration-200 border border-red-200"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">Limpiar filtros</span>
                </button>
              )}

              {categoriesError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  Error al cargar categorías
                </p>
              )}
            </div>

            {/* Results Count and View Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {loading ? 'Cargando...' : `${filteredServices.length} resultados`}
              </span>

              <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white/50 rounded-2xl p-6 min-h-96 relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-500 mb-4"></div>
              <p className="text-gray-600 font-medium">Buscando servicios...</p>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className={`
              ${viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
              }
            `}>
              {filteredServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No se encontraron servicios
              </h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters
                  ? 'Intenta ajustar tus filtros para ver más resultados'
                  : 'Intenta con otros términos de búsqueda o categorías diferentes'
                }
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                {hasActiveFilters ? 'Limpiar filtros' : 'Ver todos los servicios'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

// Loading fallback component
function SearchLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-blue-500 mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Preparando búsqueda
          </h2>
          <p className="text-gray-600">
            Cargando página de búsqueda...
          </p>
        </div>
      </div>
    </main>
  )
}

// Main component with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  )
}