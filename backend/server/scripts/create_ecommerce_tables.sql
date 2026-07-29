-- ============================================================
-- MIGRACIÓN: Tablas para módulo e-commerce (tienda hermana)
-- Noir Atelier — Proyecto de grado
-- Ejecutar en Neon: copiar y pegar en el SQL Editor de Neon
-- ============================================================

-- ── 1. TABLA PRODUCTOS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  moneda      TEXT NOT NULL DEFAULT 'USD',
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  imagen_url  TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para productos activos
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- ── 2. TABLA PEDIDOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id),  -- NULL si es invitado sin cuenta
  cliente_nombre    TEXT NOT NULL,
  cliente_telefono  TEXT NOT NULL,
  cliente_email     TEXT,
  total             NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  estado            TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'contactado' | 'completado' | 'cancelado'
  canal             TEXT NOT NULL DEFAULT 'whatsapp',
  notas             TEXT,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_creado_en ON pedidos(creado_en);

-- ── 3. TABLA PEDIDO_ITEMS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_items (
  id              SERIAL PRIMARY KEY,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos(id),
  nombre_producto TEXT NOT NULL,          -- copia del nombre al momento de comprar
  precio_unitario NUMERIC(10,2) NOT NULL, -- copia del precio al momento de comprar
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  subtotal        NUMERIC(10,2) NOT NULL
);

-- Índice para items por pedido
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);

-- ============================================
-- DATOS SEMILLA (SEED DATA) - OPCIONAL
-- ============================================
-- Insertar algunos productos de ejemplo para probar
INSERT INTO productos (nombre, categoria, descripcion, precio, moneda, stock, imagen_url, activo)
VALUES
  (
    'Cuaderno de Bordes Dorados',
    'Papelería',
    'Cuaderno de tapa dura con detalles dorados y papel crema premium.',
    12.50,
    'USD',
    100,
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    TRUE
  ),
  (
    'Juego de Plumas de Tinta Negra',
    'Escritura',
    'Pack de tres plumas estilográficas finas para notas elegantes.',
    18.00,
    'USD',
    50,
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600',
    TRUE
  ),
  (
    'Set de Pegatinas Artísticas',
    'Accesorios',
    'Colección de pegatinas para personalizar agendas, cartas y diarios.',
    9.75,
    'USD',
    20,
    'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600',
    TRUE
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Productos creados:' as info, count(*) as total FROM productos WHERE activo = TRUE;
SELECT 'Tablas e-commerce creadas exitosamente.' as info;

