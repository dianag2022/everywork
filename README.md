# EveryWork Marketplace

Un marketplace de servicios construido con Next.js y Supabase.

## Características

- 🔐 **Autenticación con Google** usando Supabase Auth
- 🛡️ **Protección de rutas** con middleware
- 📱 **Diseño responsive** con Tailwind CSS
- 🗄️ **Base de datos** con Supabase
- ⚡ **Rendimiento optimizado** con Next.js 15

## Configuración Rápida

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Configurar autenticación

1. Ve a tu proyecto de Supabase
2. Habilita Google OAuth en Authentication > Providers
3. Configura las credenciales de Google OAuth
4. Configura las URLs de redirección

### 4. Verificar configuración

```bash
npm run verify-auth
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   ├── services/          # Páginas de servicios
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticación
│   ├── header/           # Componentes del header
│   └── services/         # Componentes de servicios
├── hooks/                # Custom hooks
├── lib/                  # Utilidades y configuración
└── types/                # Tipos de TypeScript
```

## Autenticación

El proyecto usa **Supabase Auth** para la autenticación con las siguientes características:

- ✅ Login con Google OAuth
- ✅ Protección de rutas automática
- ✅ Middleware para rutas protegidas
- ✅ Estado de autenticación global
- ✅ Redirección automática

### Rutas Protegidas

- `/dashboard/*`
- `/profile/*`
- `/services/new`

### Uso en Componentes

```tsx
import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, signIn, signOut, isAuthenticated } = useAuth();

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

## Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linting del código
- `npm run verify-auth` - Verificar configuración de autenticación

## Documentación

Para más detalles sobre la configuración de autenticación, consulta [AUTH_SETUP.md](./AUTH_SETUP.md).

## Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilos**: Tailwind CSS
- **Autenticación**: Supabase Auth
- **Base de datos**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recomendado)

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
