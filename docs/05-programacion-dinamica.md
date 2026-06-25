# Programación Dinámica en Sitios Web — Noir Atelier

## 1. Interactividad Directa: Menú Basado en Eventos

### Implementación
Se ha creado el componente `InteractiveMenu` en `src/components/InteractiveMenu.js`. Este menú responde a eventos del puntero y táctiles: `onMouseEnter`, `onMouseLeave` y `onTouchStart`.

- Al pasar el cursor o tocar, el panel asociado se abre dinámicamente.
- Cuando el puntero sale del área o se toca de nuevo, el menú se oculta.
- El DOM se actualiza en el cliente usando estado React (`useState`) sin recargar la página.

### Justificación académica
El menú ejemplifica la programación dinámica porque el contenido se muestra y oculta en tiempo real en función de eventos de usuario, empleando lógica reactiva y estructuras de control. Esto rompe con la web estática, donde las páginas solo se cargan una vez: aquí la interfaz es viva, responde a la interacción y manipula el DOM localmente para crear una experiencia dinámica, adaptativa e incremental.

### Guía de evidencias
Toma capturas de pantalla de:
- Estado inicial: el menú en reposo con los botones de categoría visibles y los paneles cerrados.
- Estado interactivo: al pasar el cursor sobre un botón del menú o tocarlo en móvil, mostrando el panel desplegable con enlaces internos.
- Si es posible, captura el código de `InteractiveMenu` junto a la interfaz activa para mostrar la relación evento-UI.

## 2. Adaptabilidad al Entorno: Interfaz por Evento Calendarizado

### Implementación
Se ha añadido el componente `EventBanner` en `src/components/EventBanner.js`, que usa la fecha actual del sistema para decidir si debe renderizar un banner especial.

- El componente compara la fecha actual con eventos definidos en `eventDefinitions`.
- Si la fecha cae dentro del rango de un evento, la UI cambia automáticamente la clase CSS de fondo y muestra un mensaje especial.
- Esta lógica usa estructuras condicionales (`find`, comparaciones de fechas) para tomar decisiones dinámicas.

### Justificación académica
La web dinámica permite que la interfaz sea sensible al tiempo y actúe como un sistema adaptativo. El banner de evento representa programación dinámica porque utiliza variables temporales (fecha del sistema) y estructuras de control para alterar el renderizado sin intervención manual del desarrollador. Esto transforma la presentación estática en una experiencia dependiente del contexto, demostrando que el sitio puede tomar decisiones automáticas basadas en condiciones lógicas.

### Guía de evidencias
Para documentar el comportamiento, realiza estos pasos:
1. Abre el sitio y captura la pantalla antes de la fecha del evento (no debería aparecer el banner especial).
2. Cambia la fecha del sistema operativo o del navegador a una fecha definida en `EventBanner` (por ejemplo, `2026-07-12` para Semana de Moda Noir).
3. Recarga la página y captura la pantalla durante la fecha del evento, mostrando el banner con estilo especial.
4. Incluye en el reporte la lista de fechas usadas y la comparación entre ambos estados.

## Conclusión
Estas mejoras convierten la página en una web verdaderamente dinámica: reacciona a eventos del usuario y se adapta al tiempo. El código sigue las mejores prácticas de componentes React y refuerza la experiencia profesional y académica.
