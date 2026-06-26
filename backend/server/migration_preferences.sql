-- ============================================================
-- MIGRACIÓN: Preferencias de usuario (modo oscuro, etc.)
-- Ejecutar en PostgreSQL con: psql -d tu_db -f migration_preferences.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  clave       TEXT NOT NULL,           -- ej: 'theme'
  valor       TEXT NOT NULL,           -- ej: 'dark' | 'light'
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, clave)
);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id);

-- Insertar preferencia de tema oscuro para el admin de ejemplo:
-- INSERT INTO user_preferences (user_id, clave, valor)
-- VALUES (1, 'theme', 'dark')
-- ON CONFLICT (user_id, clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();
