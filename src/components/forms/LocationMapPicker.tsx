// components/forms/LocationMapPicker.tsx
'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ServiceLocation } from '@/types/database'
import { MapPin } from 'lucide-react'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationMapPickerProps {
  value: ServiceLocation | null
  onChange: (location: ServiceLocation) => void
  className?: string
}

// Component to handle map clicks
function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number] | null
  setPosition: (pos: [number, number]) => void 
}) {
  const map = useMapEvents({
    click(e) {
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng]
      setPosition(newPos)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return position ? (
    <Marker 
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const newPos = marker.getLatLng()
          setPosition([newPos.lat, newPos.lng])
        }
      }}
    />
  ) : null
}

export default function LocationMapPicker({ value, onChange, className = '' }: LocationMapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  // Handle SSR - Leaflet only works on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Set initial position from value
  useEffect(() => {
    if (value?.latitude && value?.longitude) {
      setPosition([value.latitude, value.longitude])
    }
  }, [value?.latitude, value?.longitude])

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoadingAddress(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      
      return {
        address: data.display_name || `${lat}, ${lng}`,
        city: data.address?.city || data.address?.town || data.address?.village || undefined,
        state: data.address?.state || undefined,
        country: data.address?.country || 'Colombia',
        postal_code: data.address?.postcode || undefined
      }
    } catch (error) {
      console.error('Error getting address:', error)
      return {
        address: `${lat}, ${lng}`,
        city: undefined,
        state: undefined,
        country: 'Colombia',
        postal_code: undefined
      }
    } finally {
      setIsLoadingAddress(false)
    }
  }

  // Handle position change
  const handlePositionChange = async (newPos: [number, number]) => {
    setPosition(newPos)
    
    const addressInfo = await getAddressFromCoordinates(newPos[0], newPos[1])
    
    onChange({
      latitude: newPos[0],
      longitude: newPos[1],
      ...addressInfo
    })
  }

  // Get user's current location
  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ]
          handlePositionChange(newPos)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('No se pudo obtener tu ubicación actual')
        }
      )
    } else {
      alert('Tu navegador no soporta geolocalización')
    }
  }

  if (!isClient) {
    return (
      <div className={`w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Cargando mapa...</p>
      </div>
    )
  }

  // Default center (Colombia - Bogotá)
  const center: [number, number] = position || [4.6097, -74.0817]

  return (
    <div className={className}>
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Haz clic en el mapa para ubicar tu servicio o arrastra el marcador
          </p>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Mi ubicación
          </button>
        </div>
        
        {position && (
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="font-medium">Coordenadas:</span> {position[0].toFixed(6)}, {position[1].toFixed(6)}
            {isLoadingAddress && <span className="ml-2 text-blue-600">Obteniendo dirección...</span>}
          </div>
        )}
      </div>

      <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
        <MapContainer
          center={center}
          zoom={position ? 15 : 6}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>

      {!position && (
        <p className="mt-3 text-sm text-gray-500 text-center">
          👆 Haz clic en el mapa para marcar la ubicación de tu servicio
        </p>
      )}
    </div>
  )
}