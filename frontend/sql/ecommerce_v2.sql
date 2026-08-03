-- ════════════════════════════════════════════════════════════════════════════
-- Migración: idempotencia real para pedidos
-- ════════════════════════════════════════════════════════════════════════════
-- Dependencias: tabla `pedidos` ya creada (create_ecommerce_tables.sql ejecutado).
--
-- Qué hace:
--   1. Agrega la columna `client_request_id UUID UNIQUE` a `pedidos`.
--   2. Crea un índice para acelerar la búsqueda de duplicados.
--
-- Por qué existe:
--   Antes de esta migración, el handler de POST /api/pedidos usaba una heurística
--   (cliente_telefono + total + creado_en < 2 min) para detectar reintentos. Esa
--   heurística podía tratar como duplicados dos pedidos legítimos del mismo
--   cliente en menos de 2 minutos.
--
--   Ahora el frontend genera un UUID v4 por submit y lo manda en el header
--   `X-Client-Request-Id`. El backend busca ese UUID en esta columna UNIQUE.
--   Si existe, devuelve el mismo `order_id` (idempotencia real, igual que el
--   patrón `Idempotency-Key` de Stripe).
--
-- Cómo ejecutarla:
--   psql "postgresql://USER:PASS@HOST/DB?sslmode=require" -f frontend/sql/ecommerce_v2.sql
--   o pegar en el SQL Editor del dashboard de Neon.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS client_request_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_pedidos_client_request_id
  ON pedidos(client_request_id);

-- ════════════════════════════════════════════════════════════════════════════
-- Rollback (no ejecutar a menos que sepas lo que haces):
--   DROP INDEX IF EXISTS idx_pedidos_client_request_id;
--   ALTER TABLE pedidos DROP COLUMN IF EXISTS client_request_id;
-- ════════════════════════════════════════════════════════════════════════════