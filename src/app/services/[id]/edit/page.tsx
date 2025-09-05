'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getServiceById, updateService } from '@/lib/services'
import { uploadServiceImages } from '@/lib/storage'
import { Service } from '@/types/database'
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2, Phone, MapPin, DollarSign, Tag, FileText, Camera, Star } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { LocationInput } from '@/components/forms/LocationInput'
import { ServiceLocation } from '@/types/database'
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
  const [max_price, setMaxPrice] = useState('')
  const [category, setCategory] = useState('')
  const [phone_number, setPhoneNumber] = useState('') // NEW FIELD
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()

  const [images, setImages] = useState<ImageFile[]>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [location, setLocation] = useState<ServiceLocation | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const fetchService = async () => {
      try {
        const serviceData = await getServiceById(params.id)
        
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
        setPhoneNumber(serviceData.phone_number || '') // NEW FIELD
        
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
        
        if (serviceData.gallery && Array.isArray(serviceData.gallery)) {
          const existingImages: ImageFile[] = serviceData.gallery.map(url => ({
            url,
            isExisting: true
          }))
          setImages(existingImages)
          
          // Set main image index based on main_image URL
          if (serviceData.main_image) {
            const mainIndex = serviceData.gallery.findIndex(url => url === serviceData.main_image)
            if (mainIndex !== -1) {
              setMainImageIndex(mainIndex)
            }
          }
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

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/
    return phoneRegex.test(phone)
  }

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
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Las imágenes no pueden ser mayores a 5MB')
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    const newImages: ImageFile[] = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      isExisting: false
    }))

    setImages(prev => [...prev, ...newImages])
    setError('')
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      const removedImage = newImages[index]
      
      if (!removedImage.isExisting) {
        URL.revokeObjectURL(removedImage.url)
      }
      
      newImages.splice(index, 1)
      
      // Adjust main image index if necessary
      if (mainImageIndex >= newImages.length && newImages.length > 0) {
        setMainImageIndex(0)
      } else if (newImages.length === 0) {
        setMainImageIndex(0)
      }
      
      return newImages
    })
  }

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index)
  }

  const uploadNewImages = async (): Promise<string[]> => {
    const newImages = images.filter(img => !img.isExisting && img.file)
    
    if (newImages.length === 0) {
      return images.filter(img => img.isExisting).map(img => img.url)
    }

    setIsUploadingImages(true)

    try {
      const filesToUpload = newImages
        .map(img => img.file)
        .filter((file): file is File => file !== undefined)

      const uploadedUrls = await uploadServiceImages(
        filesToUpload, 
        user!.id, 
        (progress) => {
          // Optional progress tracking
        }
      )

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

    if (!location || !location.latitude || !location.longitude) {
      setError('Por favor selecciona una ubicación para el servicio')
      return
    }

    if (phone_number && !validatePhoneNumber(phone_number)) {
      setError('El formato del número de teléfono no es válido')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const finalImageUrls = await uploadNewImages()

      await updateService(service.id, {
        title,
        description,
        min_price: parseFloat(price),
        max_price: parseFloat(max_price),
        category,
        main_image: finalImageUrls[mainImageIndex],
        gallery: finalImageUrls,
        phone_number: phone_number || undefined, // NEW FIELD
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return

    const currentCount = images.length
    const maxNewImages = Math.max(0, 5 - currentCount)
    const filesToAdd = files.slice(0, maxNewImages)

    if (filesToAdd.length < files.length) {
      setError(`Solo puedes subir un máximo de 5 imágenes. Se agregaron ${filesToAdd.length} imágenes.`)
    }

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} no es una imagen válida`)
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} es muy grande. Máximo 5MB por imagen.`)
        return
      }

      const newImage: ImageFile = {
        file,
        url: URL.createObjectURL(file),
        isExisting: false
      }

      setImages(prev => [...prev, newImage])
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Acceso requerido
          </h1>
          <p className="text-gray-600">Debes iniciar sesión para editar servicios.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gradient-to-r from-purple-200 to-blue-200 rounded w-64"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al dashboard
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Editar Servicio
            </h1>
            <p className="text-gray-600">Actualiza la información de tu servicio</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Service Basic Info */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Información Básica
                </h2>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Servicio *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Ej: Plomería domiciliaria, Diseño gráfico, Clases de guitarra..."
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  placeholder="Describe detalladamente tu servicio, experiencia y lo que incluye..."
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-blue-600" />
                  Información de Contacto
                </h2>
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone_number"
                    value={phone_number}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Opcional - Los clientes podrán contactarte directamente</p>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-600" />
                  Ubicación
                </h2>
              </div>

              <LocationInput
                value={location}
                onChange={setLocation}
                required={true}
              />
            </div>

            {/* Images */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-pink-600" />
                  Imágenes del Servicio
                </h2>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 ${
                  isLoading || images.length >= 5
                    ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300 hover:border-purple-500 cursor-pointer hover:bg-gradient-to-br hover:from-purple-100 hover:to-blue-100'
                }`}
              >
                <Upload className={`w-12 h-12 mb-4 ${
                  isLoading || images.length >= 5 ? 'text-gray-400' : 'text-purple-500'
                }`} />
                <p className={`text-lg font-medium mb-2 ${
                  isLoading || images.length >= 5 ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {images.length >= 5 
                    ? 'Límite máximo de imágenes alcanzado' 
                    : 'Arrastra y suelta imágenes aquí'
                  }
                </p>
                <p className={`text-sm ${
                  isLoading || images.length >= 5 ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  o haz clic para seleccionar archivos
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading || images.length >= 5}
                />
                
                {images.length < 5 && !isLoading && (
                  <label
                    htmlFor="images"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {images.length === 0 ? 'Subir Imágenes' : 'Agregar Más Imágenes'}
                  </label>
                )}
                
                <div className="flex items-center mt-4 space-x-4 text-xs text-gray-500">
                  <span>PNG, JPG, GIF hasta 5MB</span>
                  <span>•</span>
                  <span className={`font-medium ${images.length === 5 ? 'text-red-500' : 'text-purple-600'}`}>
                    {images.length}/5 imágenes
                  </span>
                </div>
                
                {(isLoading || isUploadingImages) && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
                    <div className="flex items-center text-purple-600">
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      <span className="font-medium">
                        {isUploadingImages ? 'Subiendo imágenes...' : 'Procesando...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-md">
                        <Image
                          src={image.url}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg hover:shadow-xl"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {/* Main image indicator and setter */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        {mainImageIndex === index ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Principal
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAsMainImage(index)}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                            title="Establecer como imagen principal"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Principal
                          </button>
                        )}
                      </div>
                      
                      {/* Existing image indicator */}
                      {image.isExisting && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 shadow-md">
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

            {/* Pricing and Category */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Precios y Categoría
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Mínimo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium">$</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="max_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Máximo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium">$</span>
                    </div>
                    <input
                      type="number"
                      id="max_price"
                      value={max_price}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
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
                </div>

                {categoriesError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    Error al cargar categorías: {categoriesError}
                  </p>
                )}
              </div>
            </div>
            
            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading || isUploadingImages}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    {isUploadingImages ? 'Subiendo imágenes...' : 'Guardando Cambios...'}
                  </span>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}