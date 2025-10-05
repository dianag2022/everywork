// lib/api/services.ts
import { Service, CreateServiceData, UpdateServiceData, Category, ServiceWithProvider } from '@/types/database'
import { Review, ReviewWithReviewer, CreateReviewData, UpdateReviewData, ReviewStats, PaginatedReviews, ReviewVote } from '@/types/review'
import { getSupabaseToken } from './supabase/client';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://everyworkbackend.vercel.app/api'



// Respuesta exitosa del API
interface ApiSuccessResponse<T> {
  status: string;
  data: T;
  count?: number;
}

// Respuesta de error del API
interface ApiErrorResponse {
  error: {
    message: string;
    status: number;
  }
}

// Type guard para verificar si es una respuesta de error
function isErrorResponse(response: unknown): response is ApiErrorResponse {
  if (response === null || typeof response !== 'object') {
    return false;
  }
  
  const obj = response as Record<string, unknown>;
  
  return 'error' in obj &&
    obj.error !== null &&
    typeof obj.error === 'object' &&
    typeof (obj.error as Record<string, unknown>).message === 'string' &&
    typeof (obj.error as Record<string, unknown>).status === 'number';
}

// Custom error class para errores del API
class ApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
// Utility function to handle API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Get auth token from localStorage
  // Obtener token de Supabase en lugar de localStorage
  const token = await getSupabaseToken();
  console.log("token", token);
  
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, defaultOptions);
    const responseData = await response.json();

    // Verificar si la respuesta es un error del API
    if (isErrorResponse(responseData)) {
      throw new ApiError(responseData.error.message, responseData.error.status);
    }

    // Verificar si el HTTP status no es OK pero no recibimos formato de error
    if (!response.ok) {
      throw new ApiError(
        responseData.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    // Verificar que sea una respuesta exitosa válida
    if (!responseData.data) {
      throw new ApiError('Invalid API response format', 500);
    }

    // Devolver solo los datos
    const successResponse = responseData as ApiSuccessResponse<T>;
    return successResponse.data;

  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);

    // Re-throw ApiError as is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors or JSON parsing errors
    if (error instanceof TypeError) {
      throw new ApiError('Network error or invalid JSON response', 0);
    }

    // Handle other unexpected errors
    throw new ApiError('Unexpected error occurred', 500);
  }
}

// Función para casos donde necesitas la respuesta completa con metadatos
async function apiRequestWithMetadata<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; count?: number; status: string }> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, defaultOptions);
    const responseData = await response.json();

    if (isErrorResponse(responseData)) {
      throw new ApiError(responseData.error.message, responseData.error.status);
    }

    if (!response.ok) {
      throw new ApiError(
        responseData.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    if (!responseData.data) {
      throw new ApiError('Invalid API response format', 500);
    }

    const successResponse = responseData as ApiSuccessResponse<T>;
    return successResponse;

  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiError('Network error or invalid JSON response', 0);
    }

    throw new ApiError('Unexpected error occurred', 500);
  }
}

// ==================== SERVICE FUNCTIONS ====================

// Get all active services
export async function getActiveServices(): Promise<ServiceWithProvider[]> {
  return apiRequest<ServiceWithProvider[]>('/services');
}

// Get services by provider
export async function getServicesByProvider(providerId: string): Promise<Service[]> {
  return apiRequest<Service[]>(`/services/provider/${providerId}`)
}

// Get service by ID
export async function getServiceById(id: string): Promise<ServiceWithProvider> {
  return apiRequest<ServiceWithProvider>(`/services/${id}`)
}

// Get services by category
export async function getServiceByCategory(category: string): Promise<ServiceWithProvider[]> {
  return apiRequest<ServiceWithProvider[]>(`/services/category/${encodeURIComponent(category)}`)
}

// Create a new service
export async function createService(serviceData: Omit<CreateServiceData, 'provider_id'> & {
  main_image?: string;
  gallery?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
}): Promise<Service> {
  return apiRequest<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  })
}

// Update a service
export async function updateService(
  serviceId: string,
  updateData: UpdateServiceData
): Promise<Service> {
  return apiRequest<Service>(`/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })
}

// Toggle service status
export async function toggleServiceStatus(serviceId: string): Promise<Service> {
  return apiRequest<Service>(`/services/${serviceId}/toggle`, {
    method: 'PATCH',
  })
}

// Delete service (soft delete)
export async function deleteService(id: string): Promise<Service> {
  return apiRequest<Service>(`/services/${id}`, {
    method: 'DELETE',
  })
}

// Get services for map display
export async function getServicesForMap(bounds?: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<Service[]> {
  const queryParams = bounds ?
    `?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}` : ''

  return apiRequest<Service[]>(`/services/map${queryParams}`)
}

// Search services with filters
export async function searchServices(
  query: string = '',
  category: string = '',
  minPrice?: number,
  maxPrice?: number,
  userLocation?: { lat: number; lng: number },
  radiusKm: number = 50
): Promise<ServiceWithProvider[]> {
  const params = new URLSearchParams()

  if (query.trim()) params.append('query', query.trim())
  if (category.trim()) params.append('category', category.trim())
  if (minPrice !== undefined) params.append('minPrice', minPrice.toString())
  if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString())
  if (userLocation?.lat) params.append('lat', userLocation.lat.toString())
  if (userLocation?.lng) params.append('lng', userLocation.lng.toString())
  if (radiusKm !== 50) params.append('radiusKm', radiusKm.toString())

  const queryString = params.toString()
  const endpoint = queryString ? `/services/search?${queryString}` : '/services/search'

  return apiRequest<ServiceWithProvider[]>(endpoint)
}

// ==================== CATEGORY FUNCTIONS ====================

// Get all categories
export async function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories')
}

// ==================== REVIEW FUNCTIONS ====================

// Get service reviews with pagination
export async function getServiceReviews(
  serviceId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful' = 'newest'
): Promise<{ data: T; count?: number; status: string }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy
  })


  return apiRequestWithMetadata<{ data: T; count?: number; status: string }>(`/reviews/service/${serviceId}?${params}`)
 
}

// Get review statistics for a service
export async function getServiceReviewStats(serviceId: string): Promise<ReviewStats> {
  return apiRequest<ReviewStats>(`/reviews/service/${serviceId}/stats`)
}

// Create a new review
export async function createReview(reviewData: CreateReviewData): Promise<Review> {
  return apiRequest<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  })
}

// Update a review
export async function updateReview(
  reviewId: string,
  updateData: UpdateReviewData
): Promise<Review> {
  return apiRequest<Review>(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<void> {
  return apiRequest<void>(`/reviews/${reviewId}`, {
    method: 'DELETE',
  })
}

// Get a specific review by ID
export async function getReviewById(reviewId: string): Promise<ReviewWithReviewer> {
  return apiRequest<ReviewWithReviewer>(`/reviews/${reviewId}`)
}

// Check if user has reviewed a service
export async function hasUserReviewedService(serviceId: string): Promise<boolean> {
  try {
    const result = await apiRequest<{ hasReviewed: boolean }>(`/reviews/service/${serviceId}/user-review-status`)
    return result.hasReviewed
  } catch {
    return false
  }
}

// Get user's review for a service
export async function getUserReviewForService(serviceId: string): Promise<Review | null> {
  try {
    return await apiRequest<Review>(`/reviews/service/${serviceId}/user-review`)
  } catch {
    return null
  }
}

// Vote on a review
export async function voteOnReview(
  reviewId: string,
  voteType: 'helpful' | 'not_helpful'
): Promise<ReviewVote> {
  return apiRequest<ReviewVote>(`/reviews/${reviewId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ voteType }),
  })
}

// Remove vote from a review
export async function removeReviewVote(reviewId: string): Promise<void> {
  return apiRequest<void>(`/reviews/${reviewId}/vote`, {
    method: 'DELETE',
  })
}

// Get user's vote on a review
export async function getUserVoteOnReview(reviewId: string): Promise<ReviewVote | null> {
  try {
    return await apiRequest<ReviewVote>(`/reviews/${reviewId}/user-vote`)
  } catch {
    return null
  }
}

// Get reviews by user
export async function getUserReviews(
  userId?: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedReviews> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (userId) {
    params.append('userId', userId)
  }

  return apiRequest<PaginatedReviews>(`/reviews/user?${params}`)
}

// ==================== AUTH TOKEN MANAGEMENT ====================

// Set auth token (call this after user login)
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token)
  }
}

// Remove auth token (call this on logout)
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
  }
}

// Get current auth token
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken')
  }
  return null
}