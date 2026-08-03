-- ════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Remover columna `stock` y cambiar moneda a MXN
-- ════════════════════════════════════════════════════════════════════════════
-- Dependencias: tabla `productos` ya creada (create_ecommerce_tables.sql ejecutado).
--
-- Qué hace:
--   1. Elimina la columna `stock` de la tabla `productos` (si existe).
--   2. Cambia el valor por defecto de `moneda` a 'MXN'.
--   3. Actualiza los productos existentes que tengan 'USD' a 'MXN'.
--   4. Agrega la columna `client_request_id` a `pedidos` (si no existe).
--
-- Por qué existe:
--   El catálogo de Noir Atelier funciona por COTIZACIÓN (sin cobro en línea
--   ni control de inventario). Todas las cotizaciones se presentan en
--   Pesos Mexicanos (MXN) y se envían por WhatsApp.
--
-- Cómo ejecutarla:
--   psql "postgresql://USER:PASS@HOST/DB?sslmode=require" -f frontend/sql/remove_stock_mxn_migration.sql
--   o pegar en el SQL Editor del dashboard de Neon.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. REMOVER COLUMNA `stock` DE PRODUCTOS (si existe) ──────────
ALTER TABLE productos
  DROP COLUMN IF EXISTS stock;

-- ── 2. CAMBIAR MONEDA POR DEFECTO A MXN ───────────────────────────
ALTER TABLE productos
  ALTER COLUMN moneda SET DEFAULT 'MXN';

-- ── 3. ACTUALIZAR PRODUCTOS EXISTENTES DE USD A MXN ───────────────
UPDATE productos SET moneda = 'MXN' WHERE moneda = 'USD';

-- ── 4. AGREGAR client_request_id A PEDIDOS (si no existe) ────────
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS client_request_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_pedidos_client_request_id
  ON pedidos(client_request_id);

-- ════════════════════════════════════════════════════════════════════════════
-- Verificación
-- ════════════════════════════════════════════════════════════════════════════
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'productos'
ORDER BY ordinal_position;

SELECT 'Migración completada: stock removido, moneda cambiada a MXN.' as info;