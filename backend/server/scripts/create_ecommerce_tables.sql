-- ============================================================
-- MIGRACIÓN: Tablas para módulo e-commerce (tienda hermana)
-- Noir Atelier — Proyecto de grado
-- Ejecutar en Neon: copiar y pegar en el SQL Editor de Neon
-- ============================================================
-- NOTA: Esta migración NO incluye la columna `stock` en productos.
--       El catálogo funciona por COTIZACIÓN (sin cobro en línea ni
--       control de inventario). Todas las cotizaciones se presentan
--       en Pesos Mexicanos (MXN) y se envían por WhatsApp.
-- ============================================================

-- ── 1. TABLA PRODUCTOS (sin stock, moneda MXN por defecto) ─────
CREATE TABLE IF NOT EXISTS productos (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  moneda      TEXT NOT NULL DEFAULT 'MXN',
  imagen_url  TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para productos activos
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- ── 2. TABLA PEDIDOS (cotizaciones) ─────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id),  -- NULL si es invitado sin cuenta
  cliente_nombre    TEXT NOT NULL,
  cliente_telefono  TEXT NOT NULL,
  cliente_email     TEXT,
  total             NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  estado            TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'contactado' | 'cotizado' | 'cancelado'
  canal             TEXT NOT NULL DEFAULT 'whatsapp',
  notas             TEXT,
  client_request_id UUID UNIQUE,  -- idempotencia real (patrón Idempotency-Key)
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_creado_en ON pedidos(creado_en);
CREATE INDEX IF NOT EXISTS idx_pedidos_client_request_id ON pedidos(client_request_id);

-- ── 3. TABLA PEDIDO_ITEMS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_items (
  id              SERIAL PRIMARY KEY,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos(id),
  nombre_producto TEXT NOT NULL,          -- copia del nombre al momento de cotizar
  precio_unitario NUMERIC(10,2) NOT NULL, -- copia del precio al momento de cotizar
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  subtotal        NUMERIC(10,2) NOT NULL
);

-- Índice para items por pedido
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);

-- ============================================
-- DATOS SEMILLA (SEED DATA) - OPCIONAL
-- ============================================
-- Insertar algunos productos de ejemplo para probar (en MXN, sin stock)
INSERT INTO productos (nombre, categoria, descripcion, precio, moneda, imagen_url, activo)
VALUES
  (
    'Cuaderno de Bordes Dorados',
    'Papelería',
    'Cuaderno de tapa dura con detalles dorados y papel crema premium.',
    350.00,
    'MXN',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    TRUE
  ),
  (
    'Juego de Plumas de Tinta Negra',
    'Escritura',
    'Pack de tres plumas estilográficas finas para notas elegantes.',
    520.00,
    'MXN',
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600',
    TRUE
  ),
  (
    'Set de Pegatinas Artísticas',
    'Accesorios',
    'Colección de pegatinas para personalizar agendas, cartas y diarios.',
    180.00,
    'MXN',
    'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600',
    TRUE
  )
ON CONFLICT DO NOTHING;

-- ── 4. TABLA FAVORITOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favoritos (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  post_id     TEXT,
  product_id  INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT favoritos_at_least_one_target CHECK (post_id IS NOT NULL OR product_id IS NOT NULL)
);

-- Índices para favoritos por usuario
CREATE INDEX IF NOT EXISTS idx_favoritos_user ON favoritos(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favoritos_user_post
  ON favoritos(user_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_favoritos_user_product
  ON favoritos(user_id, product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favoritos_product
  ON favoritos(product_id) WHERE product_id IS NOT NULL;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Productos creados:' as info, count(*) as total FROM productos WHERE activo = TRUE;
SELECT 'Tablas e-commerce creadas exitosamente.' as info;