-- Crear tabla de servicios
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  main_image VARCHAR(500),
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2) NOT NULL,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_created_at ON services(created_at);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at 
  BEFORE UPDATE ON services 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Agregar comentarios a la tabla
COMMENT ON TABLE services IS 'Tabla para almacenar servicios ofrecidos por los usuarios';
COMMENT ON COLUMN services.id IS 'Identificador único del servicio';
COMMENT ON COLUMN services.title IS 'Título del servicio';
COMMENT ON COLUMN services.description IS 'Descripción detallada del servicio';
COMMENT ON COLUMN services.main_image IS 'URL de la imagen principal del servicio';
COMMENT ON COLUMN services.min_price IS 'Precio mínimo del servicio';
COMMENT ON COLUMN services.max_price IS 'Precio máximo del servicio';
COMMENT ON COLUMN services.provider_id IS 'ID del usuario que ofrece el servicio';
COMMENT ON COLUMN services.status IS 'Estado del servicio (activo/inactivo)';
COMMENT ON COLUMN services.created_at IS 'Fecha de creación del servicio';
COMMENT ON COLUMN services.updated_at IS 'Fecha de última actualización del servicio';
