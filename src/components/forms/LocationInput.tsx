// components/forms/LocationInput.tsx
'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, Search } from 'lucide-react'
import { ServiceLocation } from '@/types/database'

interface LocationInputProps {
  value: ServiceLocation | null
  onChange: (location: ServiceLocation | null) => void
  required?: boolean
}

export function LocationInput({ value, onChange, required = false }: LocationInputProps) {
  const [address, setAddress] = useState(value?.address || '')
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (value?.address) {
      setAddress(value.address)
    }
  }, [value])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada')
      return
    }

    setIsGettingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocoding to get address
          const addressData = await reverseGeocode(latitude, longitude)
          
          const location: ServiceLocation = {
            latitude,
            longitude,
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country || 'Colombia',
            postal_code: addressData.postal_code
          }
          
          onChange(location)
          setAddress(addressData.address)
        } catch (error) {
          console.error('Error getting address:', error)
          // Still save coordinates even if reverse geocoding fails
          onChange({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          })
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        }
        
        setIsGettingLocation(false)
      },
      (error) => {
        setError('Error al obtener ubicación')
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const searchAddress = async () => {
    if (!address.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const locationData = await geocodeAddress(address.trim());
      
      onChange(locationData)
    } catch (error) {
      setError('No se pudo encontrar la dirección')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchAddress()
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Ubicación del Servicio {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Address Input */}
      <form onSubmit={handleAddressSubmit} className="flex space-x-2">
        <div className="flex-1">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ingresa la dirección del servicio"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={required}
          />
        </div>
        <button
          type="button" // CHANGED: Explicitly set type to button
          onClick={searchAddress} // CHANGED: Use onClick instead of relying on form submit
          disabled={isSearching || !address.trim()}
          className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Current Location Button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={isGettingLocation}
        className="w-full flex items-center justify-center px-3 py-2 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGettingLocation ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <MapPin className="w-4 h-4 mr-2" />
        )}
        {isGettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
      </button>

      {/* Location Preview */}
      {value && value.latitude && value.longitude && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <MapPin className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-green-800 font-medium">Ubicación confirmada</p>
              <p className="text-green-700">{value.address}</p>
              {value.city && (
                <p className="text-green-600">
                  {value.city}{value.state && `, ${value.state}`}
                </p>
              )}
              <p className="text-green-600 text-xs mt-1">
                {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Utility functions for geocoding
async function reverseGeocode(lat: number, lng: number) {
  // Using OpenStreetMap Nominatim (free alternative to Google Maps)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  )
  
  if (!response.ok) {
    throw new Error('Failed to get address')
  }
  
  const data = await response.json()
  
  return {
    address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    city: data.address?.city || data.address?.town || data.address?.village,
    state: data.address?.state,
    country: data.address?.country,
    postal_code: data.address?.postcode
  }
}

async function geocodeAddress(address: string): Promise<ServiceLocation> {
  // Using OpenStreetMap Nominatim for forward geocoding
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
  )
  
  if (!response.ok) {
    throw new Error('Failed to search address')
  }
  
  const data = await response.json()
  
  if (!data || data.length === 0) {
    throw new Error('Address not found')
  }
  
  const result = data[0]
  
  return {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    address: result.display_name,
    city: result.address?.city || result.address?.town || result.address?.village,
    state: result.address?.state,
    country: result.address?.country,
    postal_code: result.address?.postcode
  }
}