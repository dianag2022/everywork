import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Cliente de Supabase para el servidor (service role - solo para operaciones admin)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Solo crear el cliente del servidor si tenemos la service key
export const supabaseServer = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Cliente de Supabase para el cliente (browser)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para TypeScript
export interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Funciones de utilidad para autenticación que acceden a las cookies del usuario
export async function getCurrentUser() {
  try {
    // Create a server component client that can access cookies
    const supabase = createServerComponentClient({ cookies });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getSession() {
  try {
    // Create a server component client that can access cookies
    const supabase = createServerComponentClient({ cookies });
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// For API routes, use this function instead
export function createSupabaseServerClient() {
  return createServerComponentClient({ cookies });
}