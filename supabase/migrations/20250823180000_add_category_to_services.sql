-- Add category column to services table
ALTER TABLE services ADD COLUMN category VARCHAR(100);

-- Add index for category for better performance
CREATE INDEX idx_services_category ON services(category);

-- Add comment for the new column
COMMENT ON COLUMN services.category IS 'Category of the service (e.g., Photography, Design, Development)';
