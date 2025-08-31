'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createService } from '@/lib/services';
import { uploadServiceImages } from '@/lib/storage';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories'; // adjust path as needed
import { LocationInput } from '@/components/forms/LocationInput';
import { ServiceLocation } from '@/types/database';
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

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  //location
  const [location, setLocation] = useState<ServiceLocation | null>(null)

  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

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
  };

  const removeImage = (id: string) => {
    setImages(prev => {
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
        max_price: parseFloat(price),
        category,
        main_image: imageUrls[mainImageIndex], // Set the main image
        gallery: imageUrls, // Store all images in gallery
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nuevo Servicio</h2>

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
        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imágenes del Servicio (máximo 5)
          </label>

          {/* Drag & Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition
      ${isLoading || images.length >= 5
                ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400'
                : 'bg-white border-gray-300 hover:border-blue-500'}`}
          >
            <Upload className="w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Arrastra y suelta imágenes aquí o haz clic para seleccionar
            </p>
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isLoading || images.length >= 5}
            />
            <label
              htmlFor="images"
              className="mt-2 px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-gray-50 hover:bg-gray-100"
            >
              Seleccionar Imágenes
            </label>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF hasta 5MB cada una. {images.length}/5 imágenes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                id="maxPrice"
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
        </div>



        {/* Progress Bar */}
        {isLoading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-sm text-gray-600 mt-1">
              Subiendo... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || images.length === 0}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando...' : 'Publicar Servicio'}
          </button>
        </div>
      </form>
    </div>
  );
}