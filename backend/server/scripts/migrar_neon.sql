-- ========================================
-- NOIR ATELIER - Base de datos completa
-- Para migrar a Neon PostgreSQL
-- ========================================

-- Tabla: users (con rol de admin)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: sitios_partners (páginas hermanas)
CREATE TABLE IF NOT EXISTS sitios_partners (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  url_api TEXT NOT NULL UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: editoriales
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

-- Tabla: contacts (formulario de contacto)
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: newsletter_subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla: chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  assistant_reply TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- ÍNDICES
-- ========================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);

-- Partners
CREATE INDEX IF NOT EXISTS idx_partners_activo ON sitios_partners(activo);
CREATE INDEX IF NOT EXISTS idx_partners_creado ON sitios_partners(creado_en);

-- Editoriales
CREATE INDEX IF NOT EXISTS idx_editoriales_fecha ON editoriales(fecha);
CREATE INDEX IF NOT EXISTS idx_editoriales_publicado ON editoriales(publicado);
CREATE INDEX IF NOT EXISTS idx_editoriales_categoria ON editoriales(categoria);

-- Contactos
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at);

-- Newsletter
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);

-- ========================================
-- DATOS SEMILLA
-- ========================================

-- Admin user (password: 12345678)
-- IMPORTANTE: Reemplaza 'PEGA_AQUI_HASH_REAL' con el hash generado por bcrypt
INSERT INTO users (email, password_hash, rol) VALUES
('daniel@gmail.com', '$2b$10$DsmhY11ksPisuaDxumMRvOAjn5q462daGufcPTzlD1Uq5GrAZGJzW', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Partners iniciales
INSERT INTO sitios_partners (nombre, url_api, activo) VALUES
('Harper''s Bazaar', 'https://www.harpersbazaar.com', true),
('Elle', 'https://www.elle.com', true),
('Highsnobiety', 'https://www.highsnobiety.com', true),
('Vogue', 'https://www.vogue.com', true),
('GQ', 'https://www.gq.com', true),
('Vanity Fair', 'https://www.vanityfair.com', true),
('W Magazine', 'https://www.wmagazine.com', true)
ON CONFLICT DO NOTHING;

-- Editoriales iniciales
INSERT INTO editoriales (titulo, autor, fecha, categoria, resumen, contenido, publicado) VALUES
('RICK OWENS', 'OWEN', '2025-02-22', 'Editorial', 'PRUEBA', 'LOREM IMPUSM', true)
ON CONFLICT DO NOTHING;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================