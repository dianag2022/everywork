'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, AlertCircle,  DollarSign } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {  ServiceWithProvider } from '@/types/database';
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';
import { useMapEvents } from 'react-leaflet'

interface MapSearchProps {
  services: ServiceWithProvider[]
  selectedService: ServiceWithProvider | null
  onServiceSelect: (service: ServiceWithProvider) => void
  onZoomChange?: (zoomLevel: number) => void // New prop
}

// Component to handle map events
function MapEventHandler({ onZoomChange }: { onZoomChange?: (zoom: number, bounds?: { lat: number; lng: number }[]) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      const zoomLevel = map.getZoom()
      const mapBounds = map.getBounds()
      const boundsArray = [
        { lat: mapBounds.getNorthEast().lat, lng: mapBounds.getNorthEast().lng },
        { lat: mapBounds.getNorthWest().lat, lng: mapBounds.getNorthWest().lng },
        { lat: mapBounds.getSouthEast().lat, lng: mapBounds.getSouthEast().lng },
        { lat: mapBounds.getSouthWest().lat, lng: mapBounds.getSouthWest().lng }
      ]
      if (onZoomChange) {
        onZoomChange(zoomLevel, boundsArray)
      }
    },
    moveend: () => {
      // Also trigger when map is panned
      const zoomLevel = map.getZoom()
      const mapBounds = map.getBounds()
      const boundsArray = [
        { lat: mapBounds.getNorthEast().lat, lng: mapBounds.getNorthEast().lng },
        { lat: mapBounds.getNorthWest().lat, lng: mapBounds.getNorthWest().lng },
        { lat: mapBounds.getSouthEast().lat, lng: mapBounds.getSouthEast().lng },
        { lat: mapBounds.getSouthWest().lat, lng: mapBounds.getSouthWest().lng }
      ]
      if (onZoomChange) {
        onZoomChange(zoomLevel, boundsArray)
      }
    }
  })
  
  return null
}

// Alternative: Add a reset button to clear the maximum radius
function ResetSearchButton({ onReset }: { onReset: () => void }) {
  return (
    <button 
      onClick={onReset}
      className="text-xs text-blue-600 hover:text-blue-800"
    >
      Reset search area
    </button>
  )
}

// Corrige el icono de Leaflet
const serviceIcon = L.icon({
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

// Icono para la ubicación del usuario
const userLocationIcon = L.icon({
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-icon.png",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

// Componente para cambiar el centro del mapa
function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  
  return null
}

interface UserLocation {
  lat: number
  lng: number
}


export default function MapSearch({ services, selectedService, onServiceSelect, onZoomChange }: MapSearchProps) {
  const [query, setQuery] = useState('')
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.711, -74.0721]) // Bogotá por defecto
  const router = useRouter()
  const mapRef = useRef<L.Map | null>(null)
  
  // Detectar ubicación del usuario al cargar el componente
  useEffect(() => {
    getUserLocation()
  }, [])

  // Center map on selected service
  useEffect(() => {
    if (selectedService && selectedService.latitude && selectedService.longitude) {
      setMapCenter([selectedService.latitude, selectedService.longitude])
    }
  }, [selectedService])

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no soportada por este navegador')
      return
    }

    setLocationLoading(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = { lat: latitude, lng: longitude }
        
        setUserLocation(newLocation)
        setMapCenter([latitude, longitude])
        setLocationLoading(false)
        
        // console.log('User location:', newLocation)
      },
      (error) => {
        let errorMessage = 'Error al obtener ubicación'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible'
            break
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado'
            break
        }
        
        setLocationError(errorMessage)
        setLocationLoading(false)
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/map?location=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleLocationClick = () => {
    if (userLocation) {
      // Si ya tenemos la ubicación, centrar el mapa ahí
      setMapCenter([userLocation.lat, userLocation.lng])
    } else {
      // Si no tenemos ubicación, pedirla de nuevo
      getUserLocation()
    }
  }

  const handleServiceClick = (service: ServiceWithProvider) => {
    if (onServiceSelect) {
      onServiceSelect(service)
    }
    // Redirect to service detail page
    router.push(`/services/${service.id}`)
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return ''
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`
    }
    return `${distance.toFixed(1)}km away`
  }

  const createServiceIcon = (imageUrl: string | null) => {
    if (imageUrl) {
      return L.divIcon({
        className: "custom-service-marker",
        html: `
          <div style="
            width: 40px; 
            height: 40px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 50%; 
            overflow: hidden; 
            background: white; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            <img 
              src="${imageUrl}" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40], // bottom center
        popupAnchor: [0, -40] // above marker
      })
    } else {
      return serviceIcon
    }
  }
  

  return (
    <div className="flex-1 relative">
      {/* Location Error Banner */}
      {locationError && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 p-3 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">{locationError}</span>
            </div>
            <button
              onClick={() => setLocationError(null)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

    {/* Map Section */}
    <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="absolute inset-0 w-full h-full z-0"
        ref={mapRef}
      >
        <MapEventHandler onZoomChange={onZoomChange} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Componente para cambiar el centro */}
        <ChangeMapCenter center={mapCenter} />
        
        {/* Marcador de ubicación del usuario */}
        {userLocation && userLocationIcon && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <MapPin className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="font-medium">Tu ubicación</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Service markers */}
        {L && services.map((service) => {
          if (!service.latitude || !service.longitude) return null
          
          const serviceIcon = createServiceIcon(service.main_image || (service.gallery && service.gallery[0]) || null)
          if (!serviceIcon) return null
          
          return (
            <Marker 
              key={service.id}
              position={[service.latitude, service.longitude]} 
              icon={serviceIcon}
            >
              <Popup>
                <div className="w-64 p-2">
                  {/* Service Image */}
                  {service.gallery && service.gallery[0] && (
                    <div className="w-full h-32 mb-3 rounded-lg overflow-hidden">
                      <img
                        src={service.gallery[0]}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Service Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {service.title}
                    </h3>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {service.description}
                    </p>
                    
                    {/* Price and Category */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-600">
                        <DollarSign className="w-3 h-3 mr-1" />
                        <span className="text-sm font-medium">
                          ${service.min_price}
                          {service.max_price && ` - ${service.max_price}`}
                        </span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {service.category}
                      </span>
                    </div>
                    
                    {/* Distance */}
                    {/* {service.distance !== undefined && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="text-xs">{formatDistance(service.distance)}</span>
                      </div>
                    )} */}
                    
                    {/* Address */}
                    {/* {service.address && (
                      <p className="text-xs text-gray-500 truncate">
                        📍 {service.city || service.address}
                      </p>
                    )} */}
                    
                    {/* Provider Info */}
                    {/* {service.provider && service.provider.raw_user_meta_data?.nombre && (
                      <p className="text-xs text-gray-600">
                        Por: {service.provider.raw_user_meta_data.nombre}
                      </p>
                    )} */}
                    
                    {/* Action Button */}
                    <button
                      onClick={() => handleServiceClick(service)}
                      className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        <button 
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          <span className="text-lg font-bold text-gray-600">+</span>
        </button>
        <button 
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          <span className="text-lg font-bold text-gray-600">−</span>
        </button>
      </div>

      {/* Map Search Bar */}
      <div className={`absolute top-4 left-4 right-16 z-10 ${locationError ? 'mt-16' : ''}`}>
        <div className="bg-white rounded-lg shadow-md p-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en tu ciudad..."
                className="w-full pl-10 pr-4 py-2 border-0 focus:ring-0 text-sm"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Location Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button 
          onClick={handleLocationClick}
          disabled={locationLoading}
          className={`w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors ${
            userLocation ? 'text-blue-600' : 'text-gray-600'
          } ${locationLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          title={userLocation ? 'Ir a mi ubicación' : 'Obtener mi ubicación'}
        >
          {locationLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Location Status Indicator */}
      {userLocation && (
        <div className="absolute bottom-20 right-4 z-10">
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
            Ubicación detectada
          </div>
        </div>
      )}

      {/* Services Count */}
      {services.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white px-3 py-2 rounded-lg shadow-md">
            <span className="text-sm text-gray-600">
              {services.length} servicio{services.length !== 1 ? 's' : ''} encontrado{services.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}