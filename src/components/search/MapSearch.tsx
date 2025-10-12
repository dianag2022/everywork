'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ServiceWithProvider } from '@/types/database';
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';
import { useMapEvents } from 'react-leaflet'
import { generateServiceSlug } from '@/lib/slugify';

interface MapSearchProps {
  services: ServiceWithProvider[]
  selectedService: ServiceWithProvider | null
  onServiceSelect: (service: ServiceWithProvider) => void
  onZoomChange?: (zoomLevel: number) => void
}

// Fix Leaflet default marker icons
interface LeafletIconDefault extends L.Icon.Default {
  _getIconUrl?: () => string;
}

const defaultIcon = L.Icon.Default.prototype as LeafletIconDefault;
delete defaultIcon._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

// Service icon
const serviceIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// User location icon
const userLocationIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'user-location-marker'
})

// Component to change map center
function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  return null
}

// Component to handle map resize on mobile
function MapResizer() {
  const map = useMap()

  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }

    window.addEventListener('resize', handleResize)

    // Initial resize to handle mobile rendering
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [map])

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
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.451, -76.532]) // Cali por defecto
  const [mapMounted, setMapMounted] = useState(false)
  const router = useRouter()
  const mapRef = useRef<L.Map | null>(null)

  // Ensure map is properly mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Get user location on mount
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
        maximumAge: 300000
      }
    )
  }

  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (locationSearched.trim()) {
  //     // Redirigir con la query para filtrar servicios
  //     router.push(`/map?location=${encodeURIComponent(locationSearched.trim())}`)
  //   }
  // }
  

  const handleLocationClick = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng])
    } else {
      getUserLocation()
    }
  }

  const handleServiceClick = (service: ServiceWithProvider) => {
    if (onServiceSelect) {
      onServiceSelect(service)
    }

    const slug = generateServiceSlug(service);

    router.push(`/services/${slug}`)
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
            border: 2px solid #3b82f6;
          ">
            <img 
              src="${imageUrl}" 
              style="width: 100%; height: 100%; object-fit: cover;" 
              onerror="this.style.display='none'"
            />
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      })
    }
    return serviceIcon
  }

  // Show loading state until map is ready
  if (!mapMounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
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

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      // whenReady={(map) => {
      //   mapRef.current = map.target
      //   // Force invalidate size to handle mobile rendering
      //   setTimeout(() => {
      //     map.target.invalidateSize()
      //   }, 100)
      // }}
      >
        <MapEventHandler onZoomChange={onZoomChange} />
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeMapCenter center={mapCenter} />

        {/* User location marker */}
        {userLocation && (
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
        {services.map((service) => {
          if (!service.latitude || !service.longitude) return null

          const icon = createServiceIcon(
            service.main_image || (service.gallery && service.gallery[0]) || null
          )

          return (
            <Marker
              key={service.id}
              position={[service.latitude, service.longitude]}
              icon={icon}
            >
              <Popup maxWidth={280} className="custom-popup">
                <div className="p-2">
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
                          {service.max_price && service.max_price !== service.min_price && ` - ${service.max_price}`}
                        </span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {service.category}
                      </span>
                    </div>

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

      {/* Map Controls - Hidden on mobile to save space */}
      <div className="absolute top-4 right-4 hidden md:flex flex-col space-y-2 z-10">
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

      {/* Map Search Bar - Hidden on mobile */}
      {/* <div className={`absolute top-4 left-4 right-16 z-10 hidden md:block ${locationError ? 'mt-16' : ''}`}>
        <div className="bg-white rounded-lg shadow-md p-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={locationSearched}
                onChange={(e) => setLocationSearched(e.target.value)}
                placeholder="Buscar en tu ciudad..."
                className="w-full pl-10 pr-4 py-2 border-0 focus:ring-0 text-sm"
              />
            </div>
          </form>
        </div>
      </div> */}

      {/* Location Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={handleLocationClick}
          disabled={locationLoading}
          className={`w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors ${userLocation ? 'text-blue-600' : 'text-gray-600'
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

      {/* Services Count - Hidden on small mobile screens */}
      {services.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 hidden sm:block">
          <div className="bg-white px-3 py-2 rounded-lg shadow-md">
            <span className="text-sm text-gray-600">
              {services.length} servicio{services.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}


    </div>
  )
}