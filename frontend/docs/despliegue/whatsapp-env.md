# Configurar `NEXT_PUBLIC_WHATSAPP_NUMBER` en producción (Vercel)

> Estado: **PENDIENTE** — esta variable NO está configurada todavía en producción.
> Si no se configura antes de la defensa, el botón "Enviar pedido por WhatsApp" abre un
> enlace roto del tipo `https://wa.me/undefined?text=...`. Es exactamente el tipo de
> error que rompe una demo en vivo.

## Por qué existe esta variable

`frontend/src/components/OrderSuccess.js` (línea 76) y `frontend/src/app/carrito/page.js`
deshabilitan el botón si la variable está vacía:

```jsx
disabled={!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
```

El código construye el link así:

```js
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
window.open(whatsappUrl, "_blank");
```

Si `phoneNumber` es `undefined`, el link queda malformado.

## Cómo obtener el número correcto

1. Abrir WhatsApp en el teléfono del negocio.
2. Ajustes → Cuenta → "Mi número" confirma el código de país.
3. El valor a guardar es **el número en formato internacional, sin el signo `+`, sin
   espacios, sin guiones**. Por ejemplo, para México +52 55 1234 5678 el valor es
   `525512345678`.

## Configurar en Vercel

1. Ir a https://vercel.com/dashboard
2. Seleccionar el proyecto (frontend de Noir Atelier).
3. Pestaña **Settings** → sección **Environment Variables**.
4. Botón **Add New**:
   - **Name**: `NEXT_PUBLIC_WHATSAPP_NUMBER`
   - **Value**: el número sin `+` (ej. `525512345678`)
5. Marcar las casillas:
   - ☑ Production
   - ☑ Preview
6. Save.
7. **Importante**: las variables `NEXT_PUBLIC_*` no requieren redeploy para el build,
   pero Next.js sí necesita un nuevo deployment para que el cliente vea el cambio.
   Ir a **Deployments** → tres puntos del último deployment → **Redeploy**.

## Verificar localmente (opcional pero recomendado antes de defender)

1. En `frontend/.env.local` (NO subir a git), agregar:
   ```
   NEXT_PUBLIC_WHATSAPP_NUMBER=525512345678
   ```
2. Reiniciar el dev server (`npm run dev`).
3. Completar un pedido de prueba.
4. Click en "Enviar pedido por WhatsApp" → debe abrir `https://wa.me/525512345678?text=...`.

## Lo que NO hacer

- ❌ NO poner el número con `+`, espacios o guiones: `+52 55 1234-5678` no funciona.
- ❌ NO usar un número personal que no esté abierto a recibir pedidos del negocio.
- ❌ NO omitir el paso de redeploy después de guardar la variable.

## Tiempo estimado

5 minutos. **Hacer antes de la defensa.**