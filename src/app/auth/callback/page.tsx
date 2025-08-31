'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback: Starting auth flow');
        
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        console.log('Auth callback: Session data:', { 
          hasSession: !!data.session, 
          hasUser: !!data.session?.user,
          error: error?.message 
        });
        
        if (error) {
          console.error('Error during auth callback:', error);
          router.push('/auth/signin?error=auth_callback_error');
          return;
        }

        if (data.session?.user) {
          // User authenticated successfully
          console.log('Auth callback: User authenticated successfully');
          
          // Check for callback URL in search params
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl') || urlParams.get('redirectTo');
          
          console.log('Auth callback: Redirecting to:', callbackUrl || '/');
          
          if (callbackUrl) {
            router.push(callbackUrl);
          } else {
            router.push('/');
          }
        } else {
          // No session, redirect to login
          console.log('Auth callback: No session found, redirecting to signin');
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error during auth callback:', error);
        router.push('/auth/signin?error=unknown_error');
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Procesando autenticación...</p>
      </div>
    </div>
  );
}