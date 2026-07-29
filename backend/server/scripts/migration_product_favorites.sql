-- ============================================================
-- MIGRACIÓN: Extender tabla favoritos para soportar productos
-- Noir Atelier — Proyecto de grado
-- Ejecutar en Neon SQL Editor
-- ============================================================

-- 1. Hacer post_id opcional (porque ahora también puede ser product_id)
ALTER TABLE favoritos
  ALTER COLUMN post_id DROP NOT NULL;

-- 2. Agregar columna product_id
ALTER TABLE favoritos
  ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES productos(id) ON DELETE CASCADE;

-- 3. Asegurar que al menos uno de los dos (post_id, product_id) esté presente
ALTER TABLE favoritos
  ADD CONSTRAINT favoritos_at_least_one_target
  CHECK (post_id IS NOT NULL OR product_id IS NOT NULL);

-- 4. Quitar la constraint única anterior (que solo cubría post_id)
ALTER TABLE favoritos
  DROP CONSTRAINT IF EXISTS favoritos_user_id_post_id_key;

-- 5. Crear constraints únicas parciales para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_favoritos_user_post
  ON favoritos(user_id, post_id) WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_favoritos_user_product
  ON favoritos(user_id, product_id) WHERE product_id IS NOT NULL;

-- 6. Índices para mejorar consultas por product_id
CREATE INDEX IF NOT EXISTS idx_favoritos_product
  ON favoritos(product_id) WHERE product_id IS NOT NULL;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'favoritos'
ORDER BY ordinal_position;

-- Mostrar constraints existentes
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'favoritos'::regclass
ORDER BY conname;

-- Mostrar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'favoritos'
ORDER BY indexname;