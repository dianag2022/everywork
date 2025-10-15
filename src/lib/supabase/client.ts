import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente de Supabase para el browser
export const supabaseClient = createClientComponentClient();

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

// Funciones para el CLIENTE solamente
export async function getCurrentUserClient() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

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

export async function getSessionClient() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

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

// Helper para obtener token para API calls
export async function getSupabaseToken(): Promise<string | null> {
  try {

    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting Supabase token:', error);
    return null;
  }
}