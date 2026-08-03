# Arquitectura del Proyecto — Noir Atelier

Este proyecto ha sido optimizado para utilizar una **arquitectura de backend unificado** bajo Next.js (App Router).

## Decisiones de Arquitectura

1. **Backend Unificado (Next.js Standalone)**:
   - Anteriormente coexistían un backend de Next.js (`frontend/src/app/api/...`) y un servidor Express separado (`backend/server/`).
   - Para evitar duplicación, simplificar el despliegue (en Vercel) y prevenir inconsistencias con variables de entorno (`DATABASE_URL`, `JWT_SECRET`, etc.), **hemos consolidado todo en las API Routes nativas de Next.js**.
   - El servidor Express en `backend/server` ha quedado descontinuado de la arquitectura de producción.

2. **Llamadas Relativas en el Frontend**:
   - `NEXT_PUBLIC_API_BASE` se deja vacío (`""`). Esto hace que todas las llamadas `fetch` sean relativas (ej. `/api/productos`), resolviéndose automáticamente en el mismo servidor/dominio y eliminando de raíz problemas de CORS.

3. **Base de Datos Serverless (Neon/PostgreSQL)**:
   - Las rutas de Next.js conectan directamente con Neon usando la librería `pg` y la utilería centralizada `frontend/src/lib/db.js`.

4. **Catálogo de Cotización sin Stock (MXN + WhatsApp)**:
   - El catálogo funciona por **COTIZACIÓN** (sin cobro en línea ni control de inventario).
   - Todas las cotizaciones se presentan en **Pesos Mexicanos (MXN)**.
   - No existe la columna `stock` en la tabla `productos`.
   - Las cotizaciones se envían por **WhatsApp** usando `encodeURIComponent` para codificar el mensaje.
   - Si `NEXT_PUBLIC_WHATSAPP_NUMBER` no está configurado, se muestra una advertencia visible en la UI del carrito.

5. **Sistema de Favoritos Híbrido**:
   - Si el usuario está autenticado, los favoritos se persisten en la base de datos (tabla `favoritos`).
   - Si el usuario es anónimo, los favoritos se guardan en cookies como fallback.
   - El estado se sincroniza en el frontend mediante el evento `favorites-updated`.

6. **Dashboard de Cotizaciones para Admins y Editores**:
   - El panel de administración (`/admin/dashboard`) incluye una pestaña de **Cotizaciones** con protección de ruta.
   - El panel de editor (`/editor/dashboard`) también incluye una pestaña de **Cotizaciones** con protección de ruta.
   - Ambos paneles permiten filtrar por estado (`pendiente`, `contactado`, `cotizado`, `cancelado`) y actualizar el estado de las cotizaciones.

## Variables de Entorno (`frontend/.env.local`)

El proyecto requiere las siguientes variables de entorno:

- `DATABASE_URL`: URL de conexión a la base de datos Postgres de Neon.
- `DB_SSL`: `false` en entornos de desarrollo local, `true` en producción.
- `JWT_SECRET`: Clave secreta para firmar y verificar tokens de autenticación de clientes y administradores.
- `NEXT_PUBLIC_API_BASE`: Debe estar vacío (`""`) para que las llamadas fetch sean relativas.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: Número internacional de WhatsApp para recibir cotizaciones (formato: `521XXXXXXXXXX` sin signos).

## Migraciones SQL

Las migraciones se encuentran en:
- `backend/server/scripts/create_ecommerce_tables.sql` — Crea las tablas `productos`, `pedidos`, `pedido_items` y `favoritos` (sin stock, moneda MXN por defecto, con `client_request_id` para idempotencia).
- `frontend/sql/ecommerce_v2.sql` — Agrega la columna `client_request_id` a `pedidos` (ya incluida en `create_ecommerce_tables.sql`).
- `frontend/sql/remove_stock_mxn_migration.sql` — Migra una base de datos existente: remueve la columna `stock`, cambia la moneda a MXN y agrega `client_request_id`.
- `backend/server/scripts/migration_product_favorites.sql` — Extiende la tabla `favoritos` para soportar productos (además de posts).

## Endpoints de API

### Catálogo de Cotización
- `GET /api/productos` — Lista los productos activos (sin stock, en MXN).
- `POST /api/pedidos` — Registra una cotización usando transacciones Postgres sin validación de stock. Valida teléfono con RegExp `/^\+?[\d\s-]{7,20}$/`.
- `GET /api/sister-store/products` — Lista los productos activos para el catálogo de la tienda hermana.

### Administración
- `GET /api/admin/productos` — Lista todos los productos (admin).
- `POST /api/admin/productos` — Crea un producto (admin, sin stock, en MXN).
- `PATCH/DELETE /api/admin/productos/[id]` — Actualiza/desactiva un producto (admin).
- `GET /api/admin/pedidos` — Lista todas las cotizaciones (admin/editor).
- `PATCH /api/admin/pedidos/[id]` — Actualiza el estado de una cotización (admin/editor).

### Favoritos
- `GET /api/favoritos` — Lista los favoritos del usuario autenticado (posts + productos).
- `POST /api/favoritos` — Agrega un favorito (post o producto).
- `DELETE /api/favoritos` — Elimina un favorito (por `post_id` o `product_id`).

### Páginas Hermanas
- `GET /api/partners/publicos` — Lista las páginas hermanas activas. Retorna error 500 visible si la conexión a la base de datos falla.