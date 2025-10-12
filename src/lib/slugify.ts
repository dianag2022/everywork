import type { Service } from '@/types/database';

export function generateServiceSlug(service: Service): string {
  // Take first 8 characters of UUID for uniqueness
  const shortUuid = service.id.split('-')[0];
  
  // Build location string from available fields
  const locationParts = [
    service.city,
    service.state,
    service.country
  ].filter(Boolean); // Remove null/undefined values
  
  const location = locationParts.join(' ') || 'Colombia';
  
  // Create slug from service title and location
  const slug = `${service.title}-${location}`
    .toLowerCase()
    .normalize('NFD') // Normalize accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
  
  return `${slug}-${shortUuid}`;
}

export function extractUuidFromSlug(slug: string): string {
  // Extract the short UUID from the end of the slug
  const parts = slug.split('-');
  const shortUuid = parts[parts.length - 1];
  return shortUuid;
}

// Helper function to get location string for display
export function getLocationString(service: Service): string {
  const parts = [
    service.city,
    service.state,
    service.country
  ].filter(Boolean);
  
  return parts.join(', ') || 'Colombia';
}