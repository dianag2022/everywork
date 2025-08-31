'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const { signIn, user, loading, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SignIn useEffect - pathname:', pathname, 'user:', !!user, 'loading:', loading);
    console.log('SignIn useEffect - user object:', user);
    console.log('SignIn useEffect - session object:', session);
    
    // Solo redirigir si estamos en la página de signin
    if (user && !loading && pathname === '/auth/signin') {
      const callbackUrl = searchParams.get('callbackUrl');
      console.log('SIGNIN PAGE: User authenticated, redirecting to:', callbackUrl || '/');
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push('/');
      }
    }
  }, [user, loading, router, searchParams, pathname]);

  useEffect(() => {
    // Mostrar errores de la URL si los hay
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }
  }, [searchParams]);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth_callback_error':
        return 'Error durante la autenticación. Por favor, intenta de nuevo.';
      case 'unknown_error':
        return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      default:
        return 'Ocurrió un error. Por favor, intenta de nuevo.';
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      const callbackUrl = searchParams.get('callbackUrl');
      await signIn('google', callbackUrl || undefined);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accede a tu cuenta para continuar
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}