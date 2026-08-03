const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Read DATABASE_URL from .env.local
const envPath = path.join(__dirname, "../../.env.local");
let databaseUrl = "";
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (match) databaseUrl = match[1].trim();
}

if (!databaseUrl) {
  console.error("DATABASE_URL no encontrada en .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: false,
});

const migrationSql = `
-- Drop existing tables to clean up stock fields completely
DROP TABLE IF EXISTS pedido_items CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;

-- ── PRODUCTOS (Catálogo para cotizar) ────────────────────────
CREATE TABLE productos (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL CHECK (precio >= 0), -- Precio de referencia en MXN
  moneda      TEXT NOT NULL DEFAULT 'MXN',
  imagen_url  TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_productos_activo ON productos(activo);

-- ── COTIZACIONES / PEDIDOS ──────────────────────────────────
CREATE TABLE pedidos (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id),  -- NULL si es visitante no autenticado
  cliente_nombre    TEXT NOT NULL,
  cliente_telefono  TEXT NOT NULL,
  cliente_email     TEXT,
  total             NUMERIC(10,2) NOT NULL CHECK (total >= 0), -- Total estimado en MXN
  estado            TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'contactado' | 'cotizado' | 'cancelado'
  canal             TEXT NOT NULL DEFAULT 'whatsapp',
  notas             TEXT,
  client_request_id UUID UNIQUE,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_creado_en ON pedidos(creado_en);

-- ── DETALLE DE COTIZACIÓN ───────────────────────────────────
CREATE TABLE pedido_items (
  id              SERIAL PRIMARY KEY,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos(id),
  nombre_producto TEXT NOT NULL,          -- copia del nombre al momento de cotizar
  precio_unitario NUMERIC(10,2) NOT NULL, -- copia del precio en MXN al cotizar
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  subtotal        NUMERIC(10,2) NOT NULL
);
CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);

-- Insertar productos semilla en MXN
INSERT INTO productos (nombre, categoria, descripcion, precio, moneda, imagen_url, activo)
VALUES
  (
    'Cuaderno de Bordes Dorados',
    'Papelería',
    'Cuaderno de tapa dura con detalles dorados y papel crema premium.',
    250.00,
    'MXN',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    TRUE
  ),
  (
    'Juego de Plumas de Tinta Negra',
    'Escritura',
    'Pack de tres plumas estilográficas finas para notas elegantes.',
    360.00,
    'MXN',
    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600',
    TRUE
  ),
  (
    'Set de Pegatinas Artísticas',
    'Accesorios',
    'Colección de pegatinas para personalizar agendas, cartas y diarios.',
    195.00,
    'MXN',
    'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600',
    TRUE
  );
`;

async function run() {
  try {
    console.log("Iniciando migración de base de datos...");
    await pool.query(migrationSql);
    console.log("Migración completada exitosamente con productos semilla en MXN!");
  } catch (err) {
    console.error("Error en la migración:", err);
  } finally {
    await pool.end();
  }
}

run();
