-- ============================================================
-- VERIFICACIÓN: Tablas e-commerce en Neon
-- Noir Atelier — Proyecto de grado
-- Ejecutar en Neon SQL Editor para verificar que las tablas existen
-- ============================================================

-- Verificar tabla productos
SELECT 
  'productos' as tabla,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'productos') as existe,
  (SELECT count(*) FROM productos) as total_registros,
  (SELECT count(*) FROM productos WHERE activo = true) as activos;

-- Verificar tabla pedidos
SELECT 
  'pedidos' as tabla,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pedidos') as existe,
  (SELECT count(*) FROM pedidos) as total_registros,
  (SELECT count(*) FROM pedidos WHERE estado = 'pendiente') as pendientes;

-- Verificar tabla pedido_items
SELECT 
  'pedido_items' as tabla,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pedido_items') as existe,
  (SELECT count(*) FROM pedido_items) as total_registros;

-- Verificar tabla favoritos
SELECT 
  'favoritos' as tabla,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favoritos') as existe,
  (SELECT count(*) FROM favoritos) as total_registros;

-- Verificar columnas de la tabla pedidos
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;

-- Verificar columnas de la tabla pedido_items
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pedido_items'
ORDER BY ordinal_position;

-- Verificar columnas de la tabla favoritos
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'favoritos'
ORDER BY ordinal_position;

-- Si alguna tabla no existe, ejecutar create_ecommerce_tables.sql
-- Si las columnas no coinciden con las esperadas (cliente_nombre, producto_id, etc.),
-- puede ser necesario recrear las tablas.