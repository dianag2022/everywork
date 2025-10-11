'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createService } from '@/lib/services';
import { uploadServiceImages } from '@/lib/storage';
import { X, Upload, Image as ImageIcon, Star, Phone, MapPin, DollarSign, Tag, FileText, Camera, Instagram, Facebook, Music, Music2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { LocationInput } from '@/components/forms/LocationInput';
import { SearchableDropdown } from '@/components/forms/SearchableDropdown';
import { ServiceLocation } from '@/types/database';
import Image from 'next/image';
import { Toast } from '@/components/ui/Toast';


interface UploadedImage {
  file: File;
  preview: string;
  id: string;
}

export default function ServiceForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [max_price, setMaxPrice] = useState('');
  const [category, setCategory] = useState('');
  const [phone_number, setPhoneNumber] = useState(''); // NEW FIELD

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'facebook' | 'tiktok' | ''>('');
  const [socialUrl, setSocialUrl] = useState('');

  //location
  const [location, setLocation] = useState<ServiceLocation | null>(null)

  const router = useRouter();
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Limit to 5 images max
    const currentCount = images.length;
    const maxNewImages = Math.max(0, 5 - currentCount);
    const filesToAdd = files.slice(0, maxNewImages);

    if (filesToAdd.length < files.length) {
      setError(`Solo puedes subir un máximo de 5 imágenes. Se agregaron ${filesToAdd.length} imágenes.`);
    }

    filesToAdd.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} no es una imagen válida`);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} es muy grande. Máximo 5MB por imagen.`);
        return;
      }

      const preview = URL.createObjectURL(file);
      const newImage: UploadedImage = {
        file,
        preview,
        id: Math.random().toString(36).substr(2, 9)
      };

      setImages(prev => [...prev, newImage]);
    });

    // Clear the input value to allow re-selecting the same files
    e.target.value = '';
  };

  const validateSocialUrl = (platform: string, url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    
    const patterns = {
      instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
      facebook: /^https?:\/\/(www\.)?facebook\.com\/.+/i,
      tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@.+/i,
    };
    
    return patterns[platform as keyof typeof patterns]?.test(url) || false;
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview); // Clean up memory
      }

      const filtered = prev.filter(img => img.id !== id);
      // If we removed the main image, set the first one as main
      if (mainImageIndex >= filtered.length && filtered.length > 0) {
        setMainImageIndex(0);
      } else if (filtered.length === 0) {
        setMainImageIndex(0);
      }
      return filtered;
    });
  };

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Colombian phone number validation (flexible format)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('Debes iniciar sesión para crear un servicio');
      return;
    }

    if (images.length === 0) {
      setError('Debes subir al menos una imagen para tu servicio');
      return;
    }

    if (!location) {
      setError('Debes seleccionar una ubicación para tu servicio');
      return;
    }

    // Validate phone number if provided
    if (phone_number && !validatePhoneNumber(phone_number)) {
      setError('El formato del número de teléfono no es válido');
      return;
    }

    if (socialPlatform && socialUrl && !validateSocialUrl(socialPlatform, socialUrl)) {
      setError(`La URL de ${socialPlatform} no es válida`);
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Upload images first
      setUploadProgress(25);
      const imageUrls = await uploadServiceImages(images.map(img => img.file), user!.id, (progress) => {
        setUploadProgress(25 + (progress * 0.5)); // 25% to 75%
      });

      setUploadProgress(75);

      // Create the service with image URLs
      const newService = await createService({
        title,
        description,
        min_price: parseFloat(price),
        max_price: parseFloat(max_price),
        category,
        main_image: imageUrls[mainImageIndex], // Set the main image
        social_media: socialPlatform && socialUrl ? [{
          name: socialPlatform,
          url: socialUrl
        }] : undefined,
        gallery: imageUrls, // Store all images in gallery
        location: location, // Add location
        phone_number: phone_number || undefined, 
      });

      setUploadProgress(100);

      // Clean up object URLs
      images.forEach(img => URL.revokeObjectURL(img.preview));

      // Redirect to service detail page or services list
      router.push('/dashboard'); // or `/services/${newService.id}` when you have that route
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al crear el servicio');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Add a new handler for drag & drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    // Use same logic from handleImageUpload
    const currentCount = images.length;
    const maxNewImages = Math.max(0, 5 - currentCount);
    const filesToAdd = files.slice(0, maxNewImages);

    if (filesToAdd.length < files.length) {
      setError(`Solo puedes subir un máximo de 5 imágenes. Se agregaron ${filesToAdd.length} imágenes.`);
    }

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} no es una imagen válida`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} es muy grande. Máximo 5MB por imagen.`);
        return;
      }

      const preview = URL.createObjectURL(file);
      const newImage: UploadedImage = {
        file,
        preview,
        id: Math.random().toString(36).substr(2, 9)
      };

      setImages(prev => [...prev, newImage]);
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Crear Nuevo Servicio
          </h1>
          <p className="text-gray-600">Completa la información para publicar tu servicio</p>
        </div>



        {error && (
          <Toast
            message={error}
            type="error"
            onClose={() => setError('')}
          />
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

            {/* Social Media Information */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-pink-600" />
                  Redes Sociales
                </h2>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona tu red social
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {socialPlatforms.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = socialPlatform === platform.id;

                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => {
                          setSocialPlatform(platform.id as 'instagram' | 'facebook' | 'tiktok');
                          setSocialUrl(''); // Clear URL when changing platform
                        }}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                          ? `${platform.bgColor} ${platform.borderColor} shadow-lg`
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className={`p-3 rounded-full ${isSelected
                            ? `bg-gradient-to-br ${platform.color}`
                            : 'bg-gray-100'
                            }`}>
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'
                              }`} />
                          </div>
                          <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'
                            }`}>
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
              </div>

              {/* URL Input */}
              {socialPlatform && (
                <div className="animate-slideDown">
                  <label htmlFor="social_url" className="block text-sm font-medium text-gray-700 mb-2">
                    URL de {socialPlatforms.find(p => p.id === socialPlatform)?.name}
                  </label>
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
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder={socialPlatforms.find(p => p.id === socialPlatform)?.placeholder}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Opcional - Comparte tu perfil para que los clientes puedan conocerte mejor
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
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 ${isLoading || images.length >= 5
                  ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300 hover:border-purple-500 cursor-pointer hover:bg-gradient-to-br hover:from-purple-100 hover:to-blue-100'
                  }`}
              >
                <Upload className={`w-12 h-12 mb-4 ${isLoading || images.length >= 5 ? 'text-gray-400' : 'text-purple-500'
                  }`} />
                <p className={`text-lg font-medium mb-2 ${isLoading || images.length >= 5 ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                  {images.length >= 5
                    ? 'Límite máximo de imágenes alcanzado'
                    : 'Arrastra y suelta imágenes aquí'
                  }
                </p>
                <p className={`text-sm ${isLoading || images.length >= 5 ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  o haz clic para seleccionar archivos
                </p>

                {/* Hidden file input */}
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isLoading || images.length >= 5}
                />

                {/* Clickable label button */}
                {images.length < 5 && !isLoading && (
                  <label
                    htmlFor="images"
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Seleccionar Imágenes
                  </label>
                )}

                <div className="flex items-center mt-4 space-x-4 text-xs text-gray-500">
                  <span>PNG, JPG, GIF hasta 5MB</span>
                  <span>•</span>
                  <span className={`font-medium ${images.length === 5 ? 'text-red-500' : 'text-purple-600'}`}>
                    {images.length}/5 imágenes
                  </span>
                </div>

                {/* Loading state */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
                    <div className="flex items-center text-purple-600">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                      <span className="font-medium">Subiendo imágenes...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-md">
                        <Image
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={() => {
                            console.error(`Failed to load image: ${image.preview}`)
                          }}
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        disabled={isLoading}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        title="Eliminar imagen"
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
                      id="maxPrice"
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


              <SearchableDropdown categories={categories}
                category={category}
                setCategory={setCategory}
                categoriesLoading={categoriesLoading}
                categoriesError={categoriesError} />
            </div>

            {/* Progress Bar */}
            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center font-medium">
                  Subiendo... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading || images.length === 0}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creando Servicio...
                  </span>
                ) : (
                  'Publicar Servicio'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}