import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

/**
 * Upload service images to Supabase Storage
 * @param files - Array of image files
 * @param userId - User ID for folder organization
 * @param onProgress - Optional progress callback
 * @returns Array of public URLs
 */
export async function uploadServiceImages(
  files: File[], 
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}_${i}.${fileExt}`;
    
    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('service-images') // Make sure this bucket exists in Supabase
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error for file', fileName, ':', error);
        throw new Error(`Error subiendo ${file.name}: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
      
      // Update progress
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  return uploadedUrls;
}

/**
 * Delete service images from Supabase Storage
 * @param imageUrls - Array of image URLs to delete
 */
export async function deleteServiceImages(imageUrls: string[]): Promise<void> {
  const filePaths = imageUrls.map(url => {
    // Extract file path from URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'service-images');
    return urlParts.slice(bucketIndex + 1).join('/');
  });

  const { error } = await supabase.storage
    .from('service-images')
    .remove(filePaths);

  if (error) {
    console.error('Error deleting images:', error);
    throw new Error(`Error eliminando imágenes: ${error.message}`);
  }
}

/**
 * Get optimized image URL with transformations
 * @param url - Original image URL
 * @param options - Transformation options
 */
export function getOptimizedImageUrl(
  url: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If it's a Supabase storage URL, we can add transformations
  if (url.includes('supabase')) {
    const params = new URLSearchParams();
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', quality.toString());
    params.append('format', format);
    
    return `${url}?${params.toString()}`;
  }
  
  return url;
}