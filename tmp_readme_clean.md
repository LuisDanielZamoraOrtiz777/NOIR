# Noir Atelier

Noir Atelier es un blog de alta costura con estética minimalista, editorial y vanguardista.

## Tecnología
- Framework: **Next.js** con App Router
- Biblioteca: **React.js**
- Lenguaje: **JavaScript**
- Estilos: **CSS global**

## Por qué Next.js
Next.js ofrece renderizado moderno, rutas integradas y una estructura organizada para crear un sitio web estático y dinámico con componentes reutilizables.

## Cómo ejecutar el proyecto
1. Instala dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre en el navegador:
   ```bash
   http://localhost:3000
   ```

## Páginas del sitio
- `/` - Página de inicio
- `/editoriales` - Editoriales recientes
- `/looks` - Looks destacados
- `/opinion` - Opinión
- `/comunidad` - Comunidad
- `/contacto` - Contacto
- `/privacidad` - Privacidad
- `/terminos` - Términos y condiciones
- `/dom-demo` - Laboratorio DOM

## Componentes
- `Header` - Navegación principal
- `Footer` - Pie de página
- `PostCard` - Tarjetas de artículo
- `SearchBox` - Buscador visual
- `FavoriteButton` - Botón de favorito
- `ContactForm` - Formulario de contacto
- `SocialButtons` - Redes sociales
- `ChatWidget` - Chat asíncrono de comunicación con usuario
- `DomLab` - Laboratorio de manipulación DOM

## Documentación
La documentación está en la carpeta `docs/`.

## Página especial DOM
La página `/dom-demo` muestra un laboratorio de manipulación del DOM con JavaScript y permite probar:
- `document.getElementById`
- `document.querySelector`
- `document.querySelectorAll`
- `document.createElement`
- `appendChild`
- `innerHTML`
- `textContent`
- `style`

## Chat asíncrono
La página `/contacto` incluye un chat asíncrono que envía mensajes al endpoint `/api/chat` y muestra respuestas automáticas.

## Capturas de evidencia
Se debe capturar:
- El sitio cargado en navegador
- La página Laboratorio DOM
- Antes y después de cada interacción DOM
- Cambios en el título, contenido, estilos y lista de favoritos
