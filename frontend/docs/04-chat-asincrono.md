# Comunicación asíncrona en Noir Atelier

## Introducción
En Noir Atelier se implementa un chat asíncrono para permitir la comunicación directa con los usuarios. Este componente simula el envío y la recepción de mensajes mediante una llamada a la API interna.

## Cómo funciona
- El usuario escribe un mensaje en el área de chat.
- El mensaje se envía al endpoint interno `/api/chat` usando `fetch` y `POST`.
- La respuesta se recibe de forma asíncrona y se muestra en la ventana de chat.
- Este flujo demuestra una comunicación cliente-servidor dentro de un sitio Next.js.

## Elementos principales
- `ChatWidget` (componente cliente)
- `src/app/api/chat/route.js` (endpoint API)
- `textarea` para escribir mensajes
- `button` para enviar mensajes
- `chat-window` para mostrar la conversación

## Documentación técnica
El componente `ChatWidget` usa:
- `useState` para manejar mensajes, entrada y estado de envío.
- `fetch` para enviar el mensaje al servidor.
- Un `POST` a `/api/chat` con JSON.
- Respuesta asíncrona mostrada en la interfaz.

## Ejemplo de código
```js
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: trimmed }),
});
const data = await response.json();
```

## Evidencia esperada
- Captura del chat abierto en la página de contacto.
- Captura después de enviar un mensaje.
- Captura de la respuesta recibida en el chat.

## Conclusión
Esta función asíncrona permite simular una atención directa al usuario sin salir de la interfaz. Es un ejemplo práctico de comunicación cliente-servidor en Next.js.
