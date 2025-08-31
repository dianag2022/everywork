-- Crear usuarios de prueba para los servicios
-- Estos usuarios se crearán en auth.users solo si no existen

-- Usuario 1: Desarrollador Web
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'desarrollador@ejemplo.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Carlos Rodríguez", "profesion": "Desarrollador Web", "ubicacion": "Madrid, España"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Usuario 2: Diseñador Gráfico
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'disenador@ejemplo.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Ana García", "profesion": "Diseñadora Gráfica", "ubicacion": "Barcelona, España"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Usuario 3: Marketer Digital
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'marketer@ejemplo.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Luis Martínez", "profesion": "Marketing Digital", "ubicacion": "Valencia, España"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Usuario 4: Consultor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  'consultor@ejemplo.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "María López", "profesion": "Consultora Empresarial", "ubicacion": "Sevilla, España"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Usuario 5: Redactor de Contenido
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  'redactor@ejemplo.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nombre": "Pedro Sánchez", "profesion": "Redactor de Contenido", "ubicacion": "Bilbao, España"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;
