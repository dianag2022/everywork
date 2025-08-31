-- Datos de prueba para la tabla services
-- Los provider_id corresponden a usuarios creados en auth.users

-- Insertar servicios de prueba (solo si no existen)
INSERT INTO services (
  title,
  description,
  main_image,
  min_price,
  max_price,
  provider_id,
  status
) VALUES 
-- Servicios de Carlos Rodríguez (Desarrollador Web)
(
  'Desarrollo de Sitio Web Profesional',
  'Creo sitios web modernos y responsivos con las últimas tecnologías. Incluye diseño personalizado, optimización SEO, integración con redes sociales y panel de administración. Perfecto para empresas que quieren destacar en internet.',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
  1500.00,
  3500.00,
  '550e8400-e29b-41d4-a716-446655440001',
  true
),
(
  'Aplicación Web con React y Node.js',
  'Desarrollo de aplicaciones web completas con React en el frontend y Node.js en el backend. Incluye autenticación, base de datos, API REST y despliegue. Ideal para startups y empresas en crecimiento.',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500',
  2000.00,
  5000.00,
  '550e8400-e29b-41d4-a716-446655440001',
  true
),
(
  'Tienda Online con Shopify',
  'Configuración completa de tienda online en Shopify. Incluye diseño personalizado, configuración de pagos, inventario, envíos y capacitación para el cliente. Perfecto para vender productos físicos o digitales.',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500',
  800.00,
  2000.00,
  '550e8400-e29b-41d4-a716-446655440001',
  true
),

-- Servicios de Ana García (Diseñadora Gráfica)
(
  'Diseño de Logo y Identidad Visual',
  'Creo logos únicos y memorables que representen perfectamente tu marca. Incluye diferentes formatos, guía de uso y elementos de identidad visual. Diseño profesional que conecta con tu audiencia.',
  'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500',
  300.00,
  800.00,
  '550e8400-e29b-41d4-a716-446655440002',
  true
),
(
  'Diseño de Material Publicitario',
  'Diseño de folletos, banners, tarjetas de presentación y material promocional. Diseños atractivos que captan la atención y comunican efectivamente tu mensaje. Incluye archivos para impresión y digital.',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500',
  150.00,
  500.00,
  '550e8400-e29b-41d4-a716-446655440002',
  true
),
(
  'Ilustraciones Digitales Personalizadas',
  'Creo ilustraciones únicas para tu proyecto. Desde personajes hasta escenas completas, con estilo personalizado que se adapte a tu marca. Perfecto para libros, juegos, marketing o decoración.',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
  200.00,
  600.00,
  '550e8400-e29b-41d4-a716-446655440002',
  true
),

-- Servicios de Luis Martínez (Marketing Digital)
(
  'Gestión de Redes Sociales',
  'Manejo completo de tus redes sociales: Instagram, Facebook, LinkedIn y Twitter. Incluye creación de contenido, programación de publicaciones, interacción con seguidores y análisis de resultados.',
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500',
  500.00,
  1200.00,
  '550e8400-e29b-41d4-a716-446655440003',
  true
),
(
  'Campañas de Google Ads',
  'Configuración y optimización de campañas publicitarias en Google Ads. Incluye investigación de palabras clave, creación de anuncios, seguimiento de conversiones y optimización continua.',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500',
  400.00,
  1000.00,
  '550e8400-e29b-41d4-a716-446655440003',
  true
),
(
  'Email Marketing y Automatización',
  'Diseño y automatización de campañas de email marketing. Incluye diseño de templates, segmentación de audiencia, automatización de flujos y análisis de métricas para maximizar conversiones.',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500',
  300.00,
  800.00,
  '550e8400-e29b-41d4-a716-446655440003',
  true
),

-- Servicios de María López (Consultora)
(
  'Consultoría en Transformación Digital',
  'Asesoramiento estratégico para la transformación digital de tu empresa. Incluye análisis de procesos, recomendaciones de tecnología, plan de implementación y seguimiento de resultados.',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500',
  2000.00,
  5000.00,
  '550e8400-e29b-41d4-a716-446655440004',
  true
),
(
  'Optimización de Procesos Empresariales',
  'Análisis y mejora de procesos internos de tu empresa. Identifico oportunidades de optimización, implemento mejoras y capacito a tu equipo. Resultados medibles en eficiencia y productividad.',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500',
  1500.00,
  4000.00,
  '550e8400-e29b-41d4-a716-446655440004',
  true
),
(
  'Planificación Estratégica de Negocios',
  'Desarrollo de planes estratégicos para el crecimiento de tu negocio. Incluye análisis de mercado, definición de objetivos, plan de acción y métricas de seguimiento.',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=500',
  1000.00,
  3000.00,
  '550e8400-e29b-41d4-a716-446655440004',
  true
),

-- Servicios de Pedro Sánchez (Redactor)
(
  'Redacción de Contenido Web',
  'Creación de contenido optimizado para SEO que atrae y convierte visitantes. Incluye artículos de blog, páginas web, descripciones de productos y contenido para redes sociales.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500',
  50.00,
  200.00,
  '550e8400-e29b-41d4-a716-446655440005',
  true
),
(
  'Producción de Videos Corporativos',
  'Producción de videos profesionales para tu empresa. Desde videos promocionales hasta contenido educativo, con guión, grabación, edición y post-producción de alta calidad.',
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500',
  800.00,
  2500.00,
  '550e8400-e29b-41d4-a716-446655440005',
  true
),
(
  'Fotografía de Productos',
  'Fotografía profesional de productos para catálogos, sitios web y redes sociales. Incluye iluminación profesional, edición y diferentes ángulos para mostrar tus productos de la mejor manera.',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500',
  100.00,
  300.00,
     '550e8400-e29b-41d4-a716-446655440005',
   true
) ON CONFLICT (id) DO NOTHING;
