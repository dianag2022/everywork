"use server";

import { supabase } from './supabase/client'
import { Service, CreateServiceData, UpdateServiceData, Category, ServiceWithProvider } from '@/types/database'
import { getCurrentUser } from '@/auth'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Review, ReviewWithReviewer, CreateReviewData, UpdateReviewData, ReviewStats, PaginatedReviews, ReviewVote } from '@/types/review'

// Obtener todos los servicios activos con información del proveedor
export async function getActiveServices() {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      provider:profiles (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('status', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ServiceWithProvider[]
}

// Obtener servicios por proveedor
export async function getServicesByProvider(providerId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Service[]
}

// Obtener un servicio por ID
export async function getServiceById(id: string) {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      provider:profiles (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ServiceWithProvider
}

// Obtener servicios por categoría
export async function getServiceByCategory(category: string) {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      provider:profiles (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('category', category) // Filtrar por categoría
    .eq('status', true)
    .order('created_at', { ascending: false }) // opcional: ordenar por fecha de creación

  if (error) throw error
  return data as ServiceWithProvider[]
}

// lib/services.ts
import { ServiceLocation } from '@/types/database'

export async function createService(serviceData: Omit<CreateServiceData, 'provider_id'> & {
  main_image?: string;
  gallery?: string[];
  location?: ServiceLocation;
}) {
  // Obtener el usuario actual
  const user = await getCurrentUser();
  console.log(user);

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { location, ...otherData } = serviceData;

  const { data, error } = await supabase
    .from('services')
    .insert([
      {
        ...otherData,
        provider_id: user.id,
        status: true,
        min_price: serviceData.min_price || 0,
        max_price: serviceData.max_price || 0,
        main_image: serviceData.main_image,
        gallery: serviceData.gallery, // Array of image URLs

        // Location fields
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        address: location?.address || null,
        city: location?.city || null,
        state: location?.state || null,
        country: location?.country || 'Colombia',
        postal_code: location?.postal_code || null,
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Service;
}

// Actualizar un servicio
export async function updateService(
  serviceId: string,
  updateData: UpdateServiceData
) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { location, ...otherData } = updateData;

  // Prepare update object with proper typing
  const updateObject: Partial<Service> = {
    ...otherData,
    updated_at: new Date().toISOString(),
  };

  // Add location fields if location is provided
  if (location) {
    updateObject.latitude = location.latitude ?? null;
    updateObject.longitude = location.longitude ?? null;
    updateObject.address = location.address ?? null;
    updateObject.city = location.city ?? null;
    updateObject.state = location.state ?? null;
    updateObject.country = location.country ?? 'Colombia';
    updateObject.postal_code = location.postal_code ?? null;
  }

  const { data, error } = await supabase
    .from('services')
    .update(updateObject)
    .eq('id', serviceId)
    .eq('provider_id', user.id) // Ensure user owns the service
    .select()
    .single();

  if (error) throw error;
  return data as Service;
}


export async function getServicesForMap(
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): Promise<Service[]> {
  try {
    let query = supabase
      .from('services')
      .select(`
        *,
        provider:users(id, name, email, avatar_url)
      `)
      .eq('status', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Add map bounds filtering if provided
    if (bounds) {
      query = query
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(service => ({
      ...service,
      gallery: service.gallery || []
    })) as Service[];
  } catch (error) {
    console.error('Error getting services for map:', error);
    throw error;
  }
}
// Buscar servicios por título, descripción o categoría
// // Buscar servicios por título, descripción y opcionalmente por categoría
// export async function searchServices(query: string, category?: string) {
//   let search = supabase
//     .from('services')
//     .select(`
//       *,
//       provider:profiles (
//         id,
//         email,
//         raw_user_meta_data
//       )
//     `)
//     .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
//     .eq('status', true)
//     .order('created_at', { ascending: false })

//   // Solo aplicar categoría si se pasa
//   if (category) {
//     search = search.ilike('category', `%${category}%`)
//   }

//   const { data, error } = await search

//   if (error) throw error
//   return data as Service[]
// }


// Updated searchServices to match actual schema with min_price and max_price
export async function searchServices(
  query: string = '',
  category: string = '',
  minPrice?: number,
  maxPrice?: number,
  userLocation?: { lat: number; lng: number },
  radiusKm: number = 50
): Promise<ServiceWithProvider[]> {
  try {
    let supabaseQuery = supabase
      .from('services')
      .select(`
        *,
        provider:profiles (
        id,
        email,
        raw_user_meta_data
      )
      `)
      .eq('status', true);

    // Add text search
    if (query && query.trim() !== '') {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%,category.ilike.%${query.trim()}%`
      );
    }

    // Add category filter
    if (category && category.trim() !== '') {
      supabaseQuery = supabaseQuery.eq('category', category.trim());
    }

    // Add price range filter
    // For services with price ranges, we need to check if there's any overlap
    if (minPrice !== undefined && minPrice > 0) {
      // Service's max_price should be >= user's minimum price requirement
      supabaseQuery = supabaseQuery.gte('max_price', minPrice);
    }

    if (maxPrice !== undefined && maxPrice < Number.MAX_SAFE_INTEGER) {
      // Service's min_price should be <= user's maximum price requirement  
      supabaseQuery = supabaseQuery.lte('min_price', maxPrice);
    }

    const { data, error } = await supabaseQuery.order('created_at', { ascending: false });

    if (error) throw error;

    let results = (data || []).map(service => ({
      ...service,
      gallery: service.gallery || []
    })) as Service[];

    // If user location is provided, filter by distance and add distance field
    if (userLocation && userLocation.lat && userLocation.lng) {
      results = results
        .map(service => {
          if (service.latitude && service.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              service.latitude,
              service.longitude
            );
            return { ...service, distance };
          }
          return { ...service, distance: Infinity };
        })
        .filter(service => service.distance <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return results as ServiceWithProvider[];
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
}

// Utility function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
// Eliminar un servicio (cambiar status a false)
export async function deleteService(id: string) {
  const { data, error } = await supabase
    .from('services')
    .update({ status: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Service
}




// get categories
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Category[]
}

//reviews
// Get reviews for a service with pagination
export async function getServiceReviews(
  serviceId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful' = 'newest'
): Promise<PaginatedReviews> {
  const offset = (page - 1) * limit

  let orderClause = 'created_at desc' // default: newest first
  switch (sortBy) {
    case 'oldest':
      orderClause = 'created_at asc'
      break
    case 'rating_high':
      orderClause = 'rating desc, created_at desc'
      break
    case 'rating_low':
      orderClause = 'rating asc, created_at desc'
      break
    case 'helpful':
      orderClause = 'helpful_count desc, created_at desc'
      break
  }

  // Get reviews with reviewer info
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviewer_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('service_id', serviceId)
    .order(orderClause.split(',')[0].split(' ')[0], { 
      ascending: orderClause.includes('asc'),
      ...(orderClause.includes(',') && {
        referencedTable: orderClause.split(',')[1] ? undefined : 'profiles'
      })
    })
    .range(offset, offset + limit - 1)

  if (reviewsError) throw reviewsError

  // Get total count
  const { count, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('service_id', serviceId)

  if (countError) throw countError

  return {
    reviews: reviews as ReviewWithReviewer[],
    total_count: count || 0,
    has_more: (offset + limit) < (count || 0),
    next_cursor: (offset + limit) < (count || 0) ? (page + 1).toString() : undefined
  }
}

// Get review statistics for a service
export async function getServiceReviewStats(serviceId: string): Promise<ReviewStats> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('service_id', serviceId)

  if (error) throw error

  const reviews = data || []
  const totalReviews = reviews.length

  if (totalReviews === 0) {
    return {
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews

  // Calculate rating distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(review => {
    distribution[review.rating as keyof typeof distribution]++
  })

  return {
    total_reviews: totalReviews,
    average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    rating_distribution: distribution
  }
}

// Create a new review
export async function createReview(reviewData: CreateReviewData): Promise<Review> {
  // Get current user (same as createService)
  const user = await getCurrentUser()
  console.log('Current user:', user)

  if (!user?.id) {
    throw new Error("User not authenticated")
  }

  // Check if user has already reviewed this service
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('service_id', reviewData.service_id)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (existingReview) {
    throw new Error("You have already reviewed this service")
  }

  // Validate rating
  if (reviewData.rating < 1 || reviewData.rating > 5) {
    throw new Error("Rating must be between 1 and 5")
  }

  // Insert the review (following the same pattern as createService)
  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        service_id: reviewData.service_id,
        reviewer_id: user.id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment || null,
        images: reviewData.images || [],
        verified: false,
        helpful_count: 0
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Supabase error creating review:', error)
    throw new Error(`Failed to create review: ${error.message}`)
  }

  return data as Review
}

// Update a review
export async function updateReview(
  reviewId: string,
  updateData: UpdateReviewData
): Promise<Review> {
  const user = await getCurrentUser()

  if (!user?.id) {
    throw new Error("User not authenticated")
  }

  // Validate rating if provided
  if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
    throw new Error("Rating must be between 1 and 5")
  }

  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .eq('reviewer_id', user.id) // Ensure user owns the review
    .select()
    .maybeSingle()

  if (error) throw error
  return data as Review
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<void> {
  const user = await getCurrentUser()

  if (!user?.id) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('reviewer_id', user.id) // Ensure user owns the review

  if (error) throw error
}

// Get a specific review by ID
export async function getReviewById(reviewId: string): Promise<ReviewWithReviewer> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviewer_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('id', reviewId)
    .maybeSingle()

  if (error) throw error
  return data as ReviewWithReviewer
}

// Check if user has reviewed a service
export async function hasUserReviewedService(serviceId: string): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user?.id) return false

  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('service_id', serviceId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  return !error && !!data
}

// Get user's review for a service
export async function getUserReviewForService(serviceId: string): Promise<Review | null> {
  const user = await getCurrentUser()

  if (!user?.id) return null

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('service_id', serviceId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (error) return null
  return data as Review
}

// Vote on a review (helpful/not helpful)
export async function voteOnReview(
  reviewId: string,
  voteType: 'helpful' | 'not_helpful'
): Promise<ReviewVote> {
  const user = await getCurrentUser()

  if (!user?.id) {
    throw new Error("User not authenticated")
  }

  // Use upsert to handle updating existing votes
  const { data, error } = await supabase
    .from('review_votes')
    .upsert([
      {
        review_id: reviewId,
        voter_id: user.id,
        vote_type: voteType
      }
    ], {
      onConflict: 'review_id,voter_id'
    })
    .select()
    .maybeSingle()

  if (error) throw error
  return data as ReviewVote
}

// Remove vote from a review
export async function removeReviewVote(reviewId: string): Promise<void> {
  const user = await getCurrentUser()

  if (!user?.id) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from('review_votes')
    .delete()
    .eq('review_id', reviewId)
    .eq('voter_id', user.id)

  if (error) throw error
}

// Get user's vote on a review
export async function getUserVoteOnReview(reviewId: string): Promise<ReviewVote | null> {
  const user = await getCurrentUser()

  if (!user?.id) return null

  const { data, error } = await supabase
    .from('review_votes')
    .select('*')
    .eq('review_id', reviewId)
    .eq('voter_id', user.id)
    .maybeSingle()

  if (error) return null
  return data as ReviewVote
}

// Get reviews by user (for user profile/dashboard)
export async function getUserReviews(
  userId?: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedReviews> {
  const user = await getCurrentUser()
  const targetUserId = userId || user?.id

  if (!targetUserId) {
    throw new Error("User not found")
  }

  const offset = (page - 1) * limit

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviewer_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('reviewer_id', targetUserId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (reviewsError) throw reviewsError

  // Get total count
  const { count, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewer_id', targetUserId)

  if (countError) throw countError

  return {
    reviews: reviews as ReviewWithReviewer[],
    total_count: count || 0,
    has_more: (offset + limit) < (count || 0),
    next_cursor: (offset + limit) < (count || 0) ? (page + 1).toString() : undefined
  }
}