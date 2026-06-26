-- Crear tabla editoriales
CREATE TABLE IF NOT EXISTS editoriales (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL DEFAULT 'Equipo Editorial Noir',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL DEFAULT 'Editorial',
  resumen TEXT NOT NULL,
  contenido TEXT,
  imagen_url TEXT,
  publicado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_editoriales_fecha ON editoriales(fecha);
CREATE INDEX IF NOT EXISTS idx_editoriales_publicado ON editoriales(publicado);

-- Insertar datos de prueba (opcional)
INSERT INTO editoriales (titulo, autor, fecha, categoria, resumen, contenido, publicado) VALUES
('RICK OWENS', 'OWEN', '2025-02-22', 'Editorial', 'PRUEBA', 'LOREM IMPUSM', true)
ON CONFLICT DO NOTHING;