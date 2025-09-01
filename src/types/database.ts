export interface ServiceLocation {
  latitude: number
  longitude: number
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
}

export interface Service {
  id: string
  title: string
  description?: string
  main_image?: string
  min_price: number
  max_price: number
  provider_id: string
  status: boolean
  gallery: string[] // Array of image URLs stored as JSONB
  category?: string
  //location fields
  latitude: number | null
  longitude: number | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null

  created_at: string
  updated_at: string
}

export interface ServiceWithProvider extends Service {
  provider: {
    id: string
    email: string
    raw_user_meta_data: {
      sub: string 
      "email": string 
      "email_verified": boolean
      "phone_verified": boolean
    }
  }
}

export interface CreateServiceData {
  title: string
  description?: string
  main_image?: string
  category?: string
  min_price: number
  max_price: number
  gallery?: string[]
  provider_id: string
  status?: boolean
  location?: ServiceLocation
}

export interface UpdateServiceData {
  title?: string
  description?: string
  main_image?: string
  gallery?: string[]
  min_price?: number
  max_price?: number
  status?: boolean
  category?: string
  location?: ServiceLocation
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}