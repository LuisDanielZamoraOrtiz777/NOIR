# Preguntas probables del profesor + respuestas sugeridas

> Este documento se arma después de leer el código real y los commits del proyecto.
> Las preguntas están agrupadas por el área del stack. La idea es que el estudiante
> pueda leer cada respuesta en voz alta, sin tener que improvisar, y que pueda
> defender cualquier decisión técnica que tomó.

## Arquitectura general

### P1. "¿Por qué Next.js API routes Y un backend Express separado?"

**Respuesta sugerida**:

Empezamos el proyecto con Express porque era lo que veníamos usando en prácticas
anteriores. A medida que el módulo de e-commerce creció, vimos que las rutas de
Next.js ya tenían todo lo necesario (middleware, validación, autenticación con JWT,
acceso a la base de datos vía `@/lib/db`) y mantener dos servicios separados
significaba duplicar lógica de autenticación, manejo de errores y migraciones de
base de datos.

Consolidamos en Next.js y dejamos el Express solo para lo legacy que aún no hemos
migrado. La decisión está documentada en el plan `enchanted-tumbling-sphinx.md`
sección C3. La ventaja concreta es que ahora hay una sola forma de hablar con la
base de datos (`@/lib/db` con `pg.Pool`) y un solo lugar donde corre la lógica de
autorización (`@/lib/auth`).

### P2. "¿Qué pasa si tu frontend se cae pero la DB sigue arriba?"

**Respuesta sugerida**:

Las rutas API de Next.js (`frontend/src/app/api/...`) y la DB Neon están en
proveedores distintos. Si Vercel tiene un outage, la DB sigue accesible pero el
sitio no responde. Si Neon tiene un outage, el sitio responde 500 desde las rutas
API. Ninguno de los dos escenarios corrompe datos porque todas las operaciones
de escritura (crear pedido, descontar stock) están dentro de transacciones
Postgres con `BEGIN`/`COMMIT`/`ROLLBACK`.

### P3. "¿Por qué App Router y no Pages Router?"

**Respuesta sugerida**:

App Router es lo recomendado oficialmente desde Next.js 13. La diferencia práctica
para nosotros fue: server components por defecto (mejor performance, menos JS al
cliente), `revalidatePath` para invalidar caché después de mutaciones (lo usamos
en `api/admin/productos/route.js`), y route handlers que viven como `route.js` en
la misma carpeta que la página (más fácil de mantener).

## Seguridad

### P4. "¿Cómo guardas las contraseñas?"

**Respuesta sugerida**:

Con bcrypt, cost factor 10. Ver `backend/server/scripts/generate-hash.js` y el
script `generate-hash.js` en el repo. Bcrypt es el estándar porque es lento a
propósito (los hashes toman ~100ms cada uno), lo que hace que un atacante con
acceso a la DB no pueda probar millones de contraseñas por segundo.

### P5. "¿Por qué no MD5 o SHA1?"

**Respuesta sugerida**:

Porque son funciones de hashing rápido, diseñadas para verificar integridad, no
para guardar contraseñas. Un atacante con una DB robada puede calcular miles de
millones de hashes MD5 por segundo con una GPU moderna y crackear cualquier
contraseña corta. Bcrypt tiene un cost factor ajustable: a medida que las
computadoras se vuelven más rápidas, subimos el cost y listo.

### P6. "¿Cómo proteges las rutas de admin?"

**Respuesta sugerida**:

Doble capa:

1. **Cliente** (`frontend/src/components/RouteProtector.js`): si el usuario no
   tiene sesión o su rol no está en la lista permitida, redirige a `/acceso` o
   muestra "Acceso denegado". Esto es UX, no seguridad.
2. **Servidor** (`frontend/src/lib/auth.js`): cada ruta API protegida llama
   `authenticateJWT(request)` o `authenticateEditor(request)` que valida el token
   JWT contra la firma y el rol. Si el token no es válido, devuelve 401 o 403
   ANTES de tocar la base de datos.

La validación crítica es la del servidor, porque el cliente se puede inspeccionar
y modificar en el navegador.

### P7. "¿Qué pasa si alguien copia un JWT y lo usa fuera de mi sesión?"

**Respuesta sugerida**:

Los JWT tienen un campo `exp` (expiración). Cuando expiran, el servidor rechaza
el token. Además, podemos rotar el `JWT_SECRET` periódicamente para invalidar
todos los tokens en circulación. En el futuro podemos implementar una blacklist
de tokens revocados si queremos logout remoto, pero para el alcance del proyecto
la expiración por tiempo es suficiente.

### P8. "¿Cómo previenes SQL injection?"

**Respuesta sugerida**:

Siempre uso queries parametrizadas con `$1`, `$2`, etc. Nunca concateno strings
con input del usuario. Por ejemplo, en `frontend/src/lib/db.js:23`:

```js
export async function query(text, params) {
  const poolInstance = getPool();
  const res = await poolInstance.query(text, params);
  // ...
}
```

El driver `pg` escapa los valores automáticamente. Si alguien manda
`producto_id = "1; DROP TABLE productos"`, el driver lo trata como un string
literal, no como SQL.

### P9. "¿Y XSS?"

**Respuesta sugerida**:

React escapa por defecto cualquier string que renderizamos con `{}`. Si necesito
HTML confiable (por ejemplo, contenido de un editorial escrito por el editor),
uso `dangerouslySetInnerHTML` solo después de sanitizarlo con una librería como
DOMPurify. En el código actual no usamos `dangerouslySetInnerHTML` en ninguna
parte del sitio público.

## Base de datos

### P10. "¿Cómo evitas que dos personas compren el último artículo al mismo tiempo?"

**Respuesta sugerida**:

Con `SELECT ... FOR UPDATE` dentro de una transacción en
`frontend/src/app/api/pedidos/route.js`. Cuando un usuario empieza a procesar
su pedido, Postgres bloquea la fila del producto hasta que la transacción hace
`COMMIT` o `ROLLBACK`. Si una segunda petición llega al mismo producto mientras
la primera está en curso, espera a que la primera termine, lee el stock ya
descontado, y si no alcanza devuelve `409 Stock insuficiente`.

Es exactamente el patrón "lock pesimista" que usan Amazon, Mercado Libre, etc.

### P11. "¿Y si la transacción falla a mitad de camino?"

**Respuesta sugerida**:

`ROLLBACK`. Si la inserción del pedido falla después de descontar stock, el
rollback deshace el descuento automáticamente. Si la inserción de un item falla,
el rollback deshace tanto la inserción del pedido como los descuentos previos.
No queda un pedido a medias ni stock fantasma.

### P12. "¿Por qué guardas `nombre_producto` y `precio_unitario` en `pedido_items`?"

**Respuesta sugerida**:

Para que el histórico del pedido no cambie si después edito el producto en la
tabla `productos`. Si un cliente pidió una camisa a $50, ese es el precio que
pagó, independientemente de que después la suba a $80. Esto es desnormalización
intencional y es la práctica estándar en e-commerce.

### P13. "¿Por qué `client_request_id` UNIQUE?"

**Respuesta sugerida**:

Para idempotencia. Si el usuario hace doble clic en "Crear pedido" o si la red
se corta justo después de crear el pedido y el cliente reintenta, el frontend
genera un UUID v4 (`crypto.randomUUID()`) y lo manda como header
`X-Client-Request-Id`. El servidor chequea: si ya existe un pedido con ese UUID,
devuelve el mismo `order_id` en vez de crear un duplicado.

Es el mismo patrón que usa Stripe con `Idempotency-Key`.

## E-commerce

### P14. "¿Por qué no integrar Mercado Pago o Stripe?"

**Respuesta sugerida**:

Por alcance y por decisión de producto. El brief del cliente era un catálogo
consultivo: el cliente arma el carrito, manda el pedido por WhatsApp, y el
negocio coordina el pago y el envío manualmente. Agregar una pasarela
significaba implementar webhooks, manejo de pagos rechazados, devoluciones,
facturación, y un montón de borde cases que no entraban en la práctica.

Si el negocio decide escalar, el módulo de carrito ya está estructurado para
agregar un paso 4 de "Pago" entre "Checkout" y "WhatsApp" sin romper la
arquitectura actual.

### P15. "¿Cómo funciona el mensaje de WhatsApp?"

**Respuesta sugerida**:

El frontend construye un string con el detalle del pedido (productos,
cantidades, total, datos del cliente), lo pasa por `encodeURIComponent` para
escapar acentos, saltos de línea y emojis, y abre
`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}` en una pestaña nueva.
Esto abre la app de WhatsApp en móvil o WhatsApp Web en escritorio, con el
mensaje prellenado. El usuario sólo tiene que dar "Enviar".

### P16. "¿Y si la persona no tiene WhatsApp?"

**Respuesta sugerida**:

El botón sigue funcionando, abre `https://wa.me/...` en el navegador, que ofrece
descargar WhatsApp si no está instalado. No bloqueamos la compra porque eso
sería peor UX — peor dejar al cliente intentar que bloquearlo preventivamente.

## Frontend

### P17. "¿Por qué migraste de `checkout-*` a `cart-*`?"

**Respuesta sugerida** (si aplica):

En realidad descubrimos durante la auditoría que el CSS ya existía bajo
`checkout-*` y que migrar a `cart-*` no aportaba valor. Documentamos el
descubrimiento en el plan y decidimos no romper un CSS probado en producción.
La nomenclatura quedó como estaba. (Ver `enchanted-tumbling-sphinx.md` sección I2.)

### P18. "¿Cómo manejas el modo oscuro?"

**Respuesta sugerida**:

Con una clase `html.dark` en el elemento raíz, activada por `DarkToggle.js` que
guarda la preferencia en `localStorage`. Cada regla que necesita variante oscura
tiene su contraparte con prefijo `html.dark`. Ejemplo en `globals.css`:

```css
.general-error { color: #c62828; background: #fbe9e7; }
html.dark .general-error { color: #ef9a9a; background: rgba(198,40,40,0.12); }
```

### P19. "¿El sitio es responsive?"

**Respuesta sugerida**:

Sí. Los breakpoints están en `globals.css` con `@media (max-width: 768px)` y
`(max-width: 640px)`. La navegación colapsa a menú hamburguesa, las grids de
producto y de editoriales pasan a una columna, el carrito apila el resumen
debajo del formulario. Verificado en iPhone SE (375px), iPad (768px) y
escritorio (1280px).

## Defensa en general

### P20. "¿Qué fue lo más difícil del proyecto?"

**Respuesta sugerida** (personalizar):

Una respuesta honesta podría ser: "Manejar la concurrencia en el módulo de
e-commerce. La primera versión validaba stock y después insertaba el pedido, lo
que permitía vender el mismo artículo dos veces. Lo arreglé con `SELECT ...
FOR UPDATE` dentro de una transacción, pero entender por qué la heurística
anterior fallaba me llevó un par de horas de lectura."

### P21. "¿Qué cambiarías si tuvieras más tiempo?"

**Respuesta sugerida**:

- Mover favoritos de cookie a base de datos ligada al usuario autenticado.
- Implementar búsqueda full-text en el catálogo.
- Agregar panel de métricas para el admin (pedidos por día, productos más
  vendidos).
- Tests automatizados con Vitest + Playwright para los flujos críticos.

---

**Tip final**: si no sabes la respuesta exacta, dilo honestamente. El profesor
valora más la honestidad y la capacidad de investigar en vivo que una respuesta
memorizada. "No lo recuerdo de memoria pero puedo verlo en el código en 30
segundos" es una mejor respuesta que inventar algo.