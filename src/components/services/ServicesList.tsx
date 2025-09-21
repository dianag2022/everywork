'use client'

import { useState, useEffect } from 'react'
import { ServiceCard } from './ServiceCard'
import { ServiceWithProvider } from '@/types/database'
import { getActiveServices } from '@/lib/services'

export function ServicesList() {
  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getActiveServices();
        console.log("data", data);
        
        setServices(data)
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const handleFavorite = (serviceId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(serviceId)) {
        newFavorites.delete(serviceId)
      } else {
        newFavorites.add(serviceId)
      }
      return newFavorites
    })
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Cargando servicios...
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80 h-96 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Más de {services.length} servicios disponibles
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Resultados mostrados: 1-{Math.min(services.length, 18)}
          </p>
        </div>
        
        {/* Etiqueta de precios */}
        <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
          <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
          Los precios incluyen todas las tarifas
        </div>
      </div>

      {/* Lista de servicios con scroll horizontal */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {services.map((service) => (
          <div key={service.id} className="flex-shrink-0 w-80">
            <ServiceCard
              service={service}
              onFavorite={handleFavorite}
              isFavorite={favorites.has(service.id)}
            />
          </div>
        ))}
      </div>

      {/* Indicador de scroll */}
      {services.length > 3 && (
        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  )
}




