// ==================== src/app/auth/callback/page.tsx ====================
// Página para manejar el callback de OAuth
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          router.push('/login?error=auth_error');
          return;
        }

        if (data.session) {
          // Usuario autenticado exitosamente
          router.push('/dashboard'); // O donde quieras redirigir
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Completing authentication...</p>
      </div>
    </div>
  );
}