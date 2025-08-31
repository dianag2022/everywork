'use client';

import { useAuth } from '@/hooks/useAuth';

export function AuthButton() {
  const { user, signIn, signOut, loading } = useAuth();

  if (loading) {
    return (
      <button className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">
        Cargando...
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Hola, {user.user_metadata?.full_name || user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
    >
      Iniciar Sesión con Google
    </button>
  );
}
