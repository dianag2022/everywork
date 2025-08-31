'use client'

import { useState, useEffect } from 'react'
import { searchServices } from '@/lib/services'
import { useSearchParams, useRouter } from 'next/navigation'
import { ServiceCard } from '@/components/services/ServiceCard'
import { useCategories } from '@/hooks/useCategories' // adjust path as needed
import SearchBar from '@/components/search/SearchBar'
import { ServiceWithProvider, Service } from '@/types/database';

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('query') || ''
  const categoryParam = searchParams.get('category') || ''

  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(categoryParam)

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
        console.log('results',results)
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
    
    // Update URL with the new category filter
    const params = new URLSearchParams(searchParams)
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

  return (
    <main className="bg-white min-h-screen">
      <div className="container py-8">
        <SearchBar />
        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2"
            disabled={categoriesLoading}
          >
            <option value="">
              {categoriesLoading ? 'Cargando categorías...' : 'Todas las categorías'}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name} title={cat.description}>
                {cat.name}
              </option>
            ))}
          </select>

          {categoriesError && (
            <p className="mt-1 text-sm text-red-600">
              Error al cargar categorías: {categoriesError}
            </p>
          )}
        </div>
        
        <h2 className="text-3xl font-bold mb-6">
          Resultados encontrados: {services.length}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-gray-600">Cargando...</div>
            </div>
          ) : services.length > 0 ? (
            services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">
                No se encontraron servicios que coincidan con tu búsqueda.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}