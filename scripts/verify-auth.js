#!/usr/bin/env node

/**
 * Script para verificar la configuración de autenticación con Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de autenticación...\n');

// Verificar variables de entorno
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ Archivo .env.local no encontrado');
  console.log('📝 Crea un archivo .env.local con las siguientes variables:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key');
  console.log('\n📖 Consulta AUTH_SETUP.md para más detalles');
  process.exit(1);
}

console.log('✅ Archivo .env.local encontrado');

// Verificar dependencias
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  '@supabase/supabase-js',
  '@supabase/auth-ui-react',
  '@supabase/auth-helpers-nextjs'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('❌ Dependencias faltantes:', missingDeps.join(', '));
  console.log('💡 Ejecuta: npm install ' + missingDeps.join(' '));
  process.exit(1);
}

console.log('✅ Todas las dependencias están instaladas');

// Verificar archivos principales
const requiredFiles = [
  'src/auth.ts',
  'src/hooks/useAuth.ts',
  'src/components/auth/AuthButton.tsx',
  'src/app/auth/signin/page.tsx',
  'src/app/auth/callback/page.tsx',
  'src/middleware.ts'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.log('❌ Archivos faltantes:', missingFiles.join(', '));
  process.exit(1);
}

console.log('✅ Todos los archivos principales están presentes');



console.log('\n🎉 Configuración de autenticación verificada correctamente!');
console.log('\n📋 Próximos pasos:');
console.log('1. Configura Google OAuth en Supabase Dashboard');
console.log('2. Configura las URLs de redirección en Google Cloud Console');
console.log('3. Ejecuta: npm run dev');
console.log('4. Ve a /auth/signin para probar la autenticación');
console.log('\n📖 Consulta AUTH_SETUP.md para instrucciones detalladas');
