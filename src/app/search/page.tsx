'use client'

import { useState, useEffect, Suspense } from 'react'
import { searchServices } from '@/lib/services'
import { useSearchParams, useRouter } from 'next/navigation'
import { ServiceCard } from '@/components/services/ServiceCard'
import { useCategories } from '@/hooks/useCategories'
import SearchBar from '@/components/search/SearchBar'
import { ServiceWithProvider } from '@/types/database';
import { Filter, Grid, List, ChevronDown } from 'lucide-react'

// Separate component that uses useSearchParams
function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('query') || ''
  const categoryParam = searchParams.get('category') || ''

  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(categoryParam)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()

  // Update category state when URL parameter changes
  useEffect(() => {
    setCategory(categoryParam)
  }, [categoryParam])

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      try {
        const results = await searchServices(query, category)
        setServices(results)
      } catch (error) {
        console.error('Error fetching search results:', error)
        setServices([])
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [query, category])

  const handleCategoryChange = (selectedCategory: string) => {
    setCategory(selectedCategory)
    setIsFilterOpen(false)
    
    // Update URL with the new category filter
    const params = new URLSearchParams(searchParams)
    if (selectedCategory) {
      params.set('category', selectedCategory)
    } else {
      params.delete('category')
      params.delete('query')
    }
    
    // Keep the existing query parameter
    if (query) {
      params.set('query', query)
    }
    
    // Update the URL
    router.push(`/search?${params.toString()}`, { scroll: false })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8  bg-white/80">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 rounded-full transition-all duration-200 border border-blue-200"
                >
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {category || 'Todas las categorías'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {isFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Filtrar por categoría</h3>
                  </div>
                  
                  {/* Scrollable content */}
                  <div className="max-h-72 overflow-y-auto">
                    <button
                      onClick={() => handleCategoryChange('')}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center ${
                        !category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 ${!category ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      Todas las categorías
                    </button>
                    
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.name)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center group ${
                          category === cat.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                        title={cat.description}
                      >
                        <div className={`w-2 h-2 rounded-full mr-3 transition-colors ${
                          category === cat.name ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-400'
                        }`}></div>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                    
                     {/* Footer with count */}
                     <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {categories.length} categorías disponibles
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {categoriesError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  Error al cargar categorías
                </p>
              )}
            </div>

            {/* Results Count and View Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {loading ? 'Cargando...' : `${services.length} resultados`}
              </span>
              
              <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    viewMode === 'list' 
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
        <div className="bg-white/50 rounded-2xl p-6 min-h-96">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-500 mb-4"></div>
              <p className="text-gray-600 font-medium">Buscando servicios...</p>
            </div>
          ) : services.length > 0 ? (
            <div className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
                : 'space-y-4'
              }
            `}>
              {services.map(service => (
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
                Intenta con otros términos de búsqueda o categorías diferentes
              </p>
              <button 
                onClick={() => handleCategoryChange('')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Ver todos los servicios
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