'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getServiceById, updateService } from '@/lib/services'
import { uploadServiceImages } from '@/lib/storage' // Updated import
import { Service } from '@/types/database'
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'; // adjust path as needed
import { LocationInput } from '@/components/forms/LocationInput';
import { ServiceLocation } from '@/types/database';

import Link from 'next/link'
import Image from 'next/image'

interface ImageFile {
  file?: File
  url: string
  isExisting?: boolean
}

export default function EditServicePage({ params }: { params: { id: string } }) {
  const [service, setService] = useState<Service | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [max_price, setMaxPrice] = useState('');
  const [category, setCategory] = useState('')
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const [images, setImages] = useState<ImageFile[]>([])
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  
  //location
  const [location, setLocation] = useState<ServiceLocation | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const fetchService = async () => {
      try {
        const serviceData = await getServiceById(params.id)
        
        // Check if user owns this service
        if (serviceData.provider_id !== user?.id) {
          setError('No tienes permisos para editar este servicio')
          return
        }
        
        setService(serviceData)
        setTitle(serviceData.title)
        setDescription(serviceData.description || '')
        setPrice(serviceData.min_price.toString())
        setMaxPrice(serviceData.max_price.toString())
        setCategory(serviceData.category || '')
        
        // ADDED: Load existing location data
        if (serviceData.latitude && serviceData.longitude) {
          setLocation({
            latitude: serviceData.latitude,
            longitude: serviceData.longitude,
            address: serviceData.address || `${serviceData.latitude}, ${serviceData.longitude}`,
            city: serviceData.city || undefined,
            state: serviceData.state || undefined,
            country: serviceData.country || undefined,
            postal_code: serviceData.postal_code || undefined
          })
        }
        
        // Load existing images from gallery JSONB column
        if (serviceData.gallery && Array.isArray(serviceData.gallery)) {
          const existingImages: ImageFile[] = serviceData.gallery.map(url => ({
            url,
            isExisting: true
          }))
          setImages(existingImages)
        }
      } catch (error) {
        setError('Error al cargar el servicio')
        console.error('Error fetching service:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user?.id) {
      fetchService()
    }
  }, [params.id, user?.id, isAuthenticated])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length + images.length > 5) {
      setError('Máximo 5 imágenes permitidas')
      return
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen')
        return false
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Las imágenes no pueden ser mayores a 5MB')
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    const newImages: ImageFile[] = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file), // Temporary preview URL
      isExisting: false
    }))

    setImages(prev => [...prev, ...newImages])
    setError('')
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      const removedImage = newImages[index]
      
      // Cleanup preview URL if it's a new file
      if (!removedImage.isExisting) {
        URL.revokeObjectURL(removedImage.url)
      }
      
      newImages.splice(index, 1)
      return newImages
    })
  }

  const uploadNewImages = async (): Promise<string[]> => {
    const newImages = images.filter(img => !img.isExisting && img.file)
    
    if (newImages.length === 0) {
      return images.filter(img => img.isExisting).map(img => img.url)
    }

    setIsUploadingImages(true)

    try {
      // Extract files from new images
      const filesToUpload = newImages
        .map(img => img.file)
        .filter((file): file is File => file !== undefined)

      // Upload new images using your existing storage function
      const uploadedUrls = await uploadServiceImages(
        filesToUpload, 
        user!.id, 
        (progress) => {
          // Optional: You could add a progress state here if needed
          // console.log(`Upload progress: ${progress}%`)
        }
      )

      // Include existing image URLs
      const existingImageUrls = images.filter(img => img.isExisting).map(img => img.url)
      return [...existingImageUrls, ...uploadedUrls]
      
    } catch (error) {
      console.error('Error uploading images:', error)
      throw new Error('Error al subir las imágenes')
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!service) return

    // ADDED: Validate location is required
    if (!location || !location.latitude || !location.longitude) {
      setError('Por favor selecciona una ubicación para el servicio')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Upload images and get final URLs
      const finalImageUrls = await uploadNewImages()

      // MODIFIED: Update service with location data
      await updateService(service.id, {
        title,
        description,
        min_price: parseFloat(price),
        max_price: parseFloat(max_price),
        category,
        main_image: finalImageUrls[mainImageIndex], // Set the main image
        gallery: finalImageUrls, // Store as JSONB array
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country,
          postal_code: location.postal_code,
        }
      })
      
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el servicio')
    } finally {
      setIsLoading(false)
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (!img.isExisting) {
          URL.revokeObjectURL(img.url)
        }
      })
    }
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso requerido</h1>
          <p className="text-gray-600">Debes iniciar sesión para editar servicios.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    )
  }

  if (error && !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Volver al dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Editar Servicio</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título del Servicio
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                required
              />
            </div>
            
            <LocationInput
              value={location}
              onChange={setLocation}
              required={true}
            />

            <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Precio Mínimo
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="max_price" className="block text-sm font-medium text-gray-700">
              Precio Máximo
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="max_price"
                value={max_price}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                step="0.01"
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2"
                required
              />
            </div>
          </div>
            
            <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2"
              required
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading ? 'Cargando categorías...' : 'Selecciona una categoría'}
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

            {/* Image Gallery Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Galería de Imágenes
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {/* Upload Button */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= 5 || isUploadingImages}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingImages ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {images.length === 0 ? 'Subir Imágenes' : 'Agregar Más Imágenes'}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo 5 imágenes, hasta 5MB cada una
                  </p>
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={image.url}
                            alt={`Preview ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {image.isExisting && (
                          <div className="absolute bottom-2 left-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Existente
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading || isUploadingImages}
                className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploadingImages ? 'Subiendo imágenes...' : 'Guardando...'}
                  </>
                ) : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}