'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getServiceBySlug, updateService } from '@/lib/services';
import { uploadServiceImages } from '@/lib/storage'
import { Service } from '@/types/database'
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2, Phone, MapPin, DollarSign, Tag, FileText, Camera, Star, Instagram, Facebook, Music2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
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

interface EditServicePageProps {
  params: Promise<{ slug: string }>
}

const STEPS = [
  { id: 1, name: 'Información Básica', icon: FileText },
  { id: 2, name: 'Imágenes', icon: Camera },
  { id: 3, name: 'Precios y Categoría', icon: DollarSign },
  { id: 4, name: 'Ubicación y Contacto', icon: MapPin },
];

export default function EditServicePage({ params }: EditServicePageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [service, setService] = useState<Service | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [max_price, setMaxPrice] = useState('')
  const [category, setCategory] = useState('')
  const [phone_number, setPhoneNumber] = useState('')
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()

  const [images, setImages] = useState<ImageFile[]>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'facebook' | 'tiktok' | ''>('');
  const [socialUrl, setSocialUrl] = useState('');
  const [location, setLocation] = useState<ServiceLocation | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth();

  const socialPlatforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      placeholder: 'https://instagram.com/tu_usuario',
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-purple-50',
      borderColor: 'border-pink-300'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      placeholder: 'https://facebook.com/tu_pagina',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-300'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Music2,
      placeholder: 'https://tiktok.com/@tu_usuario',
      color: 'from-gray-800 to-pink-600',
      bgColor: 'bg-gradient-to-br from-gray-50 to-pink-50',
      borderColor: 'border-gray-300'
    }
  ];

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { slug } = await params;
        const serviceData = await getServiceBySlug(slug);
        
        if (serviceData.provider_id !== user?.id) {
          setError('No tienes permisos para editar este servicio')
          return
        }
        
        setService(serviceData)
        setTitle(serviceData.title)
        if (serviceData.social_media && serviceData.social_media.length > 0) {
          setSocialPlatform(serviceData.social_media[0].name as 'instagram' | 'facebook' | 'tiktok');
          setSocialUrl(serviceData.social_media[0].url);
        }
        setDescription(serviceData.description || '')
        setPrice(serviceData.min_price.toString())
        setMaxPrice(serviceData.max_price.toString())
        setCategory(serviceData.category || '')
        setPhoneNumber(serviceData.phone_number || '')
        
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
  }, [params, user?.id, isAuthenticated])

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/
    return phoneRegex.test(phone)
  }

  const validateSocialUrl = (platform: string, url: string): boolean => {
    if (!url) return true;
    
    const patterns = {
      instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
      facebook: /^https?:\/\/(www\.)?facebook\.com\/.+/i,
      tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@.+/i,
    };
    
    return patterns[platform as keyof typeof patterns]?.test(url) || false;
  };

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

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        if (!title.trim()) {
          setError('El título es requerido');
          return false;
        }
        if (!description.trim()) {
          setError('La descripción es requerida');
          return false;
        }
        return true;
      
      case 2:
        if (images.length === 0) {
          setError('Debes tener al menos una imagen');
          return false;
        }
        return true;
      
      case 3:
        if (!price || parseFloat(price) <= 0) {
          setError('El precio mínimo es requerido');
          return false;
        }
        if (!max_price || parseFloat(max_price) <= 0) {
          setError('El precio máximo es requerido');
          return false;
        }
        if (parseFloat(max_price) < parseFloat(price)) {
          setError('El precio máximo debe ser mayor o igual al precio mínimo');
          return false;
        }
        if (!category) {
          setError('Debes seleccionar una categoría');
          return false;
        }
        return true;
      
      case 4:
        if (!location) {
          setError('Debes seleccionar una ubicación');
          return false;
        }
        if (phone_number && !validatePhoneNumber(phone_number)) {
          setError('El formato del número de teléfono no es válido');
          return false;
        }
        if (socialPlatform && socialUrl && !validateSocialUrl(socialPlatform, socialUrl)) {
          setError(`La URL de ${socialPlatform} no es válida`);
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setIsTransitioning(true)
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      setError('');
      // Reset transition state after a short delay
      setTimeout(() => setIsTransitioning(false), 100)
    }
  };

  const prevStep = () => {
    setIsTransitioning(true)
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
    // Reset transition state after a short delay
    setTimeout(() => setIsTransitioning(false), 100)
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter key from submitting form unless on final step
    if (e.key === 'Enter' && currentStep < STEPS.length) {
      e.preventDefault()
      nextStep()
    }
  }

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    
    // Only allow submission on the final step
    if (currentStep < STEPS.length) {
      console.log('Form submission blocked - not on final step. Current step:', currentStep)
      return
    }
    
    if (!service) return

    if (!validateStep(4)) {
      return;
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
        social_media: socialPlatform && socialUrl ? [{
          name: socialPlatform,
          url: socialUrl
        }] : undefined,
        phone_number: phone_number || undefined,
        location: {
          latitude: location!.latitude!,
          longitude: location!.longitude!,
          address: location!.address,
          city: location!.city,
          state: location!.state,
          country: location!.country,
          postal_code: location!.postal_code,
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
            <p className="text-gray-600">Paso {currentStep} de {STEPS.length}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium text-center hidden sm:block ${
                      isCurrent ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
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
          <form onSubmit={(e) => {
            e.preventDefault()
            // Only allow submission if we're on the final step and not transitioning
            if (currentStep === STEPS.length && !isTransitioning) {
              handleSubmit(e)
            } else {
              console.log('Form submission blocked - currentStep:', currentStep, 'isTransitioning:', isTransitioning)
            }
          }} onKeyDown={handleKeyDown} className="p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-purple-600" />
                    Información Básica
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Actualiza el título y descripción de tu servicio</p>
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
                    className="text-gray-700 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Ej: Plomería domiciliaria, Diseño gráfico, Clases de guitarra..."
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
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    placeholder="Describe detalladamente tu servicio, experiencia y lo que incluye..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Images */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <Camera className="w-6 h-6 mr-2 text-pink-600" />
                    Imágenes del Servicio
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Gestiona las fotos de tu servicio (mínimo 1, máximo 5)</p>
                </div>

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
                        
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg hover:shadow-xl"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
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
            )}

            {/* Step 3: Pricing and Category */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                    Precios y Categoría
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Actualiza el rango de precios y la categoría</p>
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
                        className="text-gray-700 w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="0.00"
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
                        className="text-gray-700 w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="0.00"
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
            )}

            {/* Step 4: Location and Contact */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-blue-600" />
                    Ubicación y Contacto
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Actualiza tu ubicación e información de contacto</p>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Ubicación *</h3>
                  <LocationInput
                    value={location}
                    onChange={setLocation}
                    required={true}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Teléfono de Contacto</h3>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone_number"
                      value={phone_number}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-gray-700 w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Opcional - Los clientes podrán contactarte directamente</p>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Redes Sociales (Opcional)</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {socialPlatforms.map((platform) => {
                      const Icon = platform.icon;
                      const isSelected = socialPlatform === platform.id;

                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => {
                            setSocialPlatform(platform.id as 'instagram' | 'facebook' | 'tiktok');
                            setSocialUrl('');
                          }}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? `${platform.bgColor} ${platform.borderColor} shadow-lg`
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`p-3 rounded-full ${
                              isSelected ? `bg-gradient-to-br ${platform.color}` : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                              {platform.name}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {socialPlatform && (
                    <div className="animate-slideDown">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          {(() => {
                            const Icon = socialPlatforms.find(p => p.id === socialPlatform)?.icon;
                            return Icon ? <Icon className="h-5 w-5 text-gray-400" /> : null;
                          })()}
                        </div>
                        <input
                          type="url"
                          id="social_url"
                          value={socialUrl}
                          onChange={(e) => setSocialUrl(e.target.value)}
                          className="text-gray-700 w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder={socialPlatforms.find(p => p.id === socialPlatform)?.placeholder}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Comparte tu perfil para que los clientes puedan conocerte mejor
                      </p>
                      {socialUrl && !validateSocialUrl(socialPlatform, socialUrl) && (
                        <p className="mt-1 text-xs text-red-500 flex items-center">
                          <span className="mr-1">⚠️</span>
                          La URL no parece válida para {socialPlatforms.find(p => p.id === socialPlatform)?.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200 mt-8">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Anterior
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Cancelar
                </Link>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Siguiente
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={() => {
                    if (!isTransitioning) {
                      handleSubmit()
                    }
                  }}
                  disabled={isLoading || isUploadingImages || isTransitioning}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      {isUploadingImages ? 'Subiendo imágenes...' : 'Guardando Cambios...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}