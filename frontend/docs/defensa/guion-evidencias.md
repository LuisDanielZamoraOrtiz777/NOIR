# Guión de capturas y evidencias para la defensa (práctica 9-10 + e-commerce)

> Documento de apoyo para que el estudiante arme las evidencias que pide la cátedra
> y el módulo de e-commerce. No incluye las capturas — sólo la receta y el orden.
> Las capturas se toman en producción o en `localhost:3000` después de los cambios
> del plan `enchanted-tumbling-sphinx.md`.

## 1. Sistema de autenticación y roles (práctica 9-10)

### Captura 1.1 — Modelo entidad-relación

- **Qué capturar**: diagrama ER de las tablas `usuarios`, `roles`, `permisos`,
  `usuario_rol`, `rol_permiso`.
- **De dónde sale**: el SQL vive en `backend/server/migracion_roles_permisos.sql` y
  `backend/server/schema.sql`. Exportar el diagrama desde DBeaver / pgAdmin / dbdiagram.io.
- **Cómo tomar la captura**: PNG / SVG. Guardar en `docs/capturas/01-modelo-er.png`.

### Captura 1.2 — Pantalla de login

- URL: `/acceso`
- Antes de capturar: loguearse con un usuario administrador (`admin@noiratelier.com`
  o el que esté configurado) en otra ventana para que se vea el contraste "sin
  sesión vs. con sesión".
- **Qué capturar**: pantalla de `/acceso` vacía + pantalla de `/acceso` con un
  error de "credenciales inválidas" (probar 1 password incorrecto a propósito para
  mostrar que no filtra si el usuario existe o no).

### Captura 1.3 — Hash de contraseñas (seguridad)

- **Qué capturar**: terminal con la salida de
  `node backend/server/scripts/generate-hash.js <password>` mostrando que el hash
  es bcrypt con cost 10.
- **Por qué**: el profesor valora que sepas justificar por qué no MD5 ni SHA1.

### Captura 1.4 — Registro y validación

- URL: `/registro`
- **Qué capturar**: pantalla con un email duplicado → mensaje de error visible.

### Captura 1.5 — Control de acceso por rol

- URL: `/admin`
- **Qué capturar**: tres estados lado a lado:
  1. Sin sesión → redirige a `/acceso`.
  2. Sesión como `usuario` → "Acceso denegado" (no redirige a `/acceso`,
     muestra el mensaje de rol insuficiente).
  3. Sesión como `editor` o `administrador` → dashboard completo.

### Captura 1.6 — Cierre de sesión

- **Qué capturar**: tras hacer click en "Cerrar sesión", el token se borra y un
  intento de volver a `/admin` redirige a `/acceso`.

## 2. Módulo e-commerce (catálogo + carrito + pedido por WhatsApp)

### Captura 2.1 — Catálogo cargando desde la DB real

- URL: `/tienda`
- Antes: confirmar que la tabla `productos` tiene al menos 4-5 productos con
  `activo = true` y stock distinto (alguno `0` para que se vea "Agotado",
  alguno con `stock <= 5` para que se vea "¡Solo quedan N!").
- **Qué capturar**: catálogo completo, modo desktop (1280px) y modo móvil (375px).

### Captura 2.2 — Detalle de producto (hover en desktop, toque en móvil)

- **Qué capturar**: una tarjeta con hover mostrando `+ Añadir al carrito` (esto
  ya no es hover-only — verificar). En móvil, hacer screenshot con el botón
  visible sin hover.

### Captura 2.3 — Carrito con productos y total calculado

- URL: `/carrito` después de agregar 2 productos distintos.
- **Qué capturar**: el carrito con:
  - 2 ítems en líneas separadas.
  - Subtotal por línea.
  - Total general.
  - Resumen a la derecha (sticky aside).
- Modo: escritorio 1280px y móvil 375px.

### Captura 2.4 — Validación del formulario de checkout

- **Qué capturar**: formulario con teléfono vacío → mensaje "El teléfono es
  obligatorio" debajo del campo. Después con teléfono mal escrito (`abc`) →
  mensaje "Formato de teléfono inválido".

### Captura 2.5 — Mensaje de WhatsApp generado (antes de enviarlo)

- **Qué capturar**: el modal o el alert del navegador con el mensaje completo
  que se va a mandar. Idealmente con acentos y emojis para probar
  `encodeURIComponent`.

### Captura 2.6 — Tabla `pedidos` en Neon con el registro recién creado

- **Qué capturar**: vista de Neon (panel web) o de `psql` con:
  ```sql
  SELECT * FROM pedidos ORDER BY creado_en DESC LIMIT 1;
  ```
  Mostrando la fila con el `client_request_id`, el total y el estado `pendiente`.

### Captura 2.7 — Tabla `pedido_items` mostrando el detalle

- **Qué capturar**:
  ```sql
  SELECT * FROM pedido_items WHERE pedido_id = <id>;
  ```
  Mostrando `nombre_producto` y `precio_unitario` copiados (para que se vea que
  el histórico no se altera si después cambia el producto original).

### Captura 2.8 — Stock decrementado en `productos`

- **Qué capturar**:
  ```sql
  SELECT id, nombre, stock FROM productos ORDER BY id;
  ```
  Mostrando que el `stock` del producto comprado bajó respecto a la captura 2.1.

### Captura 2.9 — Panel admin mostrando el pedido y cambio de estado

- URL: `/admin` → pestaña "Pedidos".
- **Qué capturar**:
  1. Lista de pedidos con el recién creado arriba.
  2. Cambio de estado `pendiente` → `contactado` (botón o dropdown según la
     implementación final).
  3. Confirmación visual.

### Captura 2.10 — Caso de prueba concurrente

- **Qué capturar**: dos pestañas del navegador abiertas con el mismo producto,
  `stock = 1`. Ambas intentan comprar. Solo una recibe `201`, la otra `409`
  con mensaje de "stock insuficiente".
- **Cómo hacerlo**: en una ventana de Neon, ejecutar
  `UPDATE productos SET stock = 1 WHERE id = X;` y luego abrir dos pestañas
  y enviar el pedido casi simultáneamente.

## 3. Evidencias transversales (práctica 5-7)

### Captura 3.1 — Menú interactivo basado en eventos de puntero

- **Qué capturar**: el menú principal desplegado en `hover` sobre un ítem,
  mostrando la animación y la sub-lista.

### Captura 3.2 — Evento de calendario / temporada

- **Qué capturar**: el banner o fondo cambiando según la temporada. Si se puede
  forzar la fecha (cambiando el sistema o un flag de dev), capturar las dos
  variantes (verano / invierno).

### Captura 3.3 — Hover destacado en cards

- **Qué capturar**: un `PostCard` o `ProductCard` con `hover`, mostrando la
  sombra/elevación y el cambio de borde que ya está implementado en
  `globals.css:947`.

## 4. Estructura del entregable final

```
docs/
├── capturas/
│   ├── 01-modelo-er.png
│   ├── 02-login.png
│   ├── 03-bcrypt-hash.png
│   ├── 04-registro-error.png
│   ├── 05-acceso-denegado.png
│   ├── 06-admin-dashboard.png
│   ├── 07-catalogo-tienda.png
│   ├── 08-carrito-con-productos.png
│   ├── 09-validacion-checkout.png
│   ├── 10-pedido-en-neon.png
│   ├── 11-pedido-items.png
│   ├── 12-stock-decrementado.png
│   ├── 13-admin-pedidos.png
│   └── 14-concurrencia-409.png
├── 07-evidencia-e-commerce.md (resumen de las capturas 2.x con narrativa)
└── 08-preguntas-defensa.md (preguntas probables + respuestas)
```

## 5. Video demostrativo (práctica 9-10 pide uno de máx. 5 min)

### Storyboard sugerido

1. **0:00–0:30** — Portada + URL en producción.
2. **0:30–1:00** — Diagrama ER (captura 1.1).
3. **1:00–2:00** — Registro + login + control de acceso por rol (capturas 1.4, 1.5).
4. **2:00–3:30** — Compra completa de un producto: catálogo → carrito → checkout →
   mensaje WhatsApp → registro en Neon (capturas 2.1–2.9).
5. **3:30–4:30** — Caso de prueba concurrente (captura 2.10).
6. **4:30–5:00** — Cierre con panel admin cambiando el estado del pedido.

Herramientas recomendadas: OBS Studio (grabación), Loom (más rápido), o
`ffmpeg` desde la terminal si se prefiere automatizar.

## 6. Checklist final antes de la defensa

- [ ] Todas las capturas en `docs/capturas/` con nombres claros.
- [ ] El video demostrativo subido a Drive/YouTube y enlace en el README.
- [ ] `docs/08-preguntas-defensa.md` con al menos 15 preguntas y respuestas.
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` configurado en Vercel (ver `whatsapp-env.md`).
- [ ] Migración `client_request_id` ejecutada en Neon de producción.
- [ ] Probado el flujo completo 1 vez en producción (no sólo localhost).