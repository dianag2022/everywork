"use server";

import { supabase } from './supabase/client'
import { Service, CreateServiceData, UpdateServiceData, Category, ServiceWithProvider } from '@/types/database'
import { getCurrentUser } from '@/auth'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

// Updated searchServices to include location-based search
export async function searchServices(
  query: string = '',
  category: string = '',
  userLocation?: { lat: number; lng: number },
  radiusKm: number = 50
): Promise<Service[]> {
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

    return results;
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