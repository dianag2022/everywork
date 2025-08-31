# Configuración de Autenticación con Supabase Auth

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Pasos para Configurar

### 1. Configurar Google OAuth en Supabase

1. Ve a tu proyecto de Supabase
2. Navega a "Authentication" > "Providers"
3. Habilita Google como proveedor
4. Configura las credenciales de Google OAuth:
   - **Client ID**: Tu Google OAuth Client ID
   - **Client Secret**: Tu Google OAuth Client Secret
5. Configura las URLs de redirección autorizadas:
   - `http://localhost:3000/auth/callback` (desarrollo)
   - `https://tu-dominio.com/auth/callback` (producción)

### 2. Configurar Google OAuth en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ 
4. Ve a "Credentials" y crea un nuevo "OAuth 2.0 Client ID"
5. Configura las URIs de redirección autorizadas:
   - `http://localhost:3000/auth/callback` (desarrollo)
   - `https://tu-dominio.com/auth/callback` (producción)
6. Copia el Client ID y Client Secret a Supabase

### 3. Configurar Supabase

1. Ve a tu proyecto de Supabase
2. En "Settings" > "API", copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Estructura de la Aplicación

### Archivos Principales

- `src/auth.ts` - Configuración de clientes de Supabase
- `src/hooks/useAuth.ts` - Hook personalizado para autenticación
- `src/components/auth/AuthButton.tsx` - Componente de botón de autenticación
- `src/app/auth/signin/page.tsx` - Página de inicio de sesión
- `src/app/auth/callback/page.tsx` - Página de callback después del login
- `src/middleware.ts` - Middleware para proteger rutas

### Funcionalidades

- **Autenticación con Google**: Login directo con Google OAuth
- **Protección de rutas**: Middleware que protege rutas específicas
- **Estado de autenticación**: Hook que maneja el estado global de autenticación
- **Redirección automática**: Usuarios autenticados son redirigidos apropiadamente

## Uso en Componentes

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, signIn, signOut, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <p>Hola, {user?.user_metadata?.full_name}</p>
        <button onClick={() => signOut()}>Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <button onClick={() => signIn('google')}>
      Iniciar Sesión con Google
    </button>
  );
}
```

## Protección de Rutas

El middleware protege automáticamente las siguientes rutas:
- `/dashboard/*`
- `/profile/*`
- `/services/new`

Los usuarios no autenticados serán redirigidos a `/auth/signin`.

## Verificación

1. Inicia el servidor de desarrollo: `npm run dev`
2. Ve a `/auth/signin`
3. Inicia sesión con Google
4. Verifica en Supabase Dashboard > Authentication > Users que el usuario aparezca

## Notas Importantes

- Los usuarios se almacenan automáticamente en `auth.users` en Supabase
- Las sesiones se manejan completamente por Supabase Auth
- El `SUPABASE_SERVICE_ROLE_KEY` debe mantenerse seguro y nunca exponerse al cliente
- La autenticación es completamente manejada por Supabase, sin dependencias externas
