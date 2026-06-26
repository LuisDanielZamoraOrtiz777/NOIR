-- Esquema de base de datos PostgreSQL para Noir Atelier

-- Tabla de contactos
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de suscripciones al newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de mensajes de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  assistant_reply TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de usuarios (para autenticación y roles)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de sitios partners (páginas hermanas)
CREATE TABLE IF NOT EXISTS sitios_partners (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  url_api TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);
CREATE INDEX IF NOT EXISTS idx_sitios_partners_activo ON sitios_partners(activo);

-- ============================================
-- DATOS SEMILLA (SEED DATA)
-- ============================================

-- Insertar usuario administrador
INSERT INTO users (email, password_hash, rol)
VALUES (
  'daniel@gmail.com',
  '$2b$10$.7AjIg8oydsbm7ixjWc3fO3ewLk4XHU1umkrtL/4jxolf3A2PESJy',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Insertar usuario normal de prueba
INSERT INTO users (email, password_hash, rol)
VALUES (
  'usuario@noiratelier.com',
  '$2b$10$.7AjIg8oydsbm7ixjWc3fO3ewLk4XHU1umkrtL/4jxolf3A2PESJy',
  'user'
)
ON CONFLICT (email) DO NOTHING;

-- Insertar partners de ejemplo
INSERT INTO sitios_partners (nombre, url_api, activo)
VALUES
  (
    'Tienda Hermana Principal',
    'https://api.tienda-hermana-principal.com',
    TRUE
  ),
  (
    'Blog de Moda Colaborador',
    'https://api.blog-moda-colaborador.com',
    TRUE
  ),
  (
    'Outlet Noir',
    'https://api.outlet-noir.com',
    TRUE
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- VISTA ÚTIL PARA CONSULTAS FRECUENTES
-- ============================================

CREATE OR REPLACE VIEW vista_admins AS
SELECT 
  id,
  email,
  rol,
  created_at
FROM users
WHERE rol = 'admin';

-- ============================================
-- FUNCIÓN PARA OBTENER PARTNERS ACTIVOS
-- ============================================

CREATE OR REPLACE FUNCTION obtener_partners_activos()
RETURNS TABLE (
  id INTEGER,
  nombre TEXT,
  url_api TEXT,
  activo BOOLEAN,
  creado_en TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.nombre,
    sp.url_api,
    sp.activo,
    sp.creado_en
  FROM sitios_partners sp
  WHERE sp.activo = TRUE
  ORDER BY sp.creado_en DESC;
END;
$$ LANGUAGE plpgsql;
