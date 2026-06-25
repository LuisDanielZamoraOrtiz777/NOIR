# Documentación del DOM del sitio web Noir Atelier

## 1. ¿Qué es el DOM?
El DOM (Document Object Model) es la representación estructurada del documento HTML en forma de árbol de nodos. Cada etiqueta, texto y elemento se convierte en un nodo que puede ser leído y modificado con JavaScript.

## 2. Relación entre React, Next.js y DOM
React construye la interfaz a través de componentes y realiza actualizaciones eficientes del DOM. Next.js usa React para organizar rutas y páginas. En este proyecto se agrega una sección especial llamada "Laboratorio DOM" donde se demuestra manipulación directa del DOM con JavaScript.

> En proyectos reales con React no siempre se recomienda manipular el DOM directamente, porque React gestiona el estado de la interfaz. Aquí se hace con fines académicos para mostrar los métodos nativos.

## 3. Elementos principales del DOM del sitio
- `html`
- `body`
- `header`
- `nav`
- `main`
- `section`
- `article`
- `form`
- `button`
- `footer`

## 4. Identificadores usados en el DOM
| Elemento | ID o clase | Función | Método JavaScript relacionado |
|---|---|---|---|
| Título DOM | `#dom-title` | Mostrar título dinámico | `getElementById` |
| Tarjetas | `.dom-card` | Seleccionar varias tarjetas | `querySelectorAll` |
| Lista de favoritos | `#favorites-list` | Agregar elementos nuevos | `appendChild` |
| Caja dinámica | `#dynamic-box` | Cambiar contenido HTML | `innerHTML` |
| Botón de título | `button` | Cambiar texto del título | `textContent` |
| Tarjeta individual | `.dom-card` | Cambiar estilos visuales | `style` |

## 5. Métodos JavaScript implementados

### getElementById
Se usa para obtener el elemento con ID `dom-title` y actualizar su texto.

```js
const title = document.getElementById("dom-title");
title.textContent = "DOM actualizado con JavaScript";
```

### querySelector
Se usa para obtener la primera tarjeta con clase `.dom-card` y aplicar estilos.

```js
const firstCard = document.querySelector(".dom-card");
firstCard.style.backgroundColor = "#111";
```

### querySelectorAll
Se usa para obtener todas las tarjetas `.dom-card` y aplicarles un borde.

```js
const cards = document.querySelectorAll(".dom-card");
cards.forEach((card) => {
  card.style.border = "1px solid black";
});
```

### createElement
Se usa para crear un nuevo elemento `<li>` que representa un favorito.

```js
const newItem = document.createElement("li");
newItem.textContent = "Look agregado a favoritos";
```

### appendChild
Se usa para agregar el nuevo elemento creado a la lista de favoritos.

```js
const list = document.getElementById("favorites-list");
list.appendChild(newItem);
```

### innerHTML
Se usa para modificar el contenido HTML de la caja dinámica `#dynamic-box`.

```js
const box = document.getElementById("dynamic-box");
box.innerHTML = "<strong>Contenido HTML modificado</strong> con <em>JavaScript</em>.";
```

### textContent
Se usa para actualizar solo el texto del título sin cambiar la estructura HTML.

```js
const title = document.getElementById("dom-title");
title.textContent = "DOM actualizado con JavaScript";
```

### style
Se usa para cambiar estilos directamente en un elemento.

```js
firstCard.style.backgroundColor = "#111";
firstCard.style.color = "#fff";
```

## 6. Evidencia esperada
- Captura del sitio cargado en navegador.
- Captura de la página Laboratorio DOM.
- Captura antes de ejecutar los botones.
- Captura después de cambiar el título con `textContent`.
- Captura después de modificar contenido con `innerHTML`.
- Captura después de cambiar estilos con `.style`.
- Captura después de agregar un favorito con `createElement` y `appendChild`.
- Captura después de aplicar cambios a varias tarjetas con `querySelectorAll`.

## 7. Conclusión del DOM
El DOM permite modificar dinámicamente el contenido, la estructura y los estilos del sitio sin recargar la página. En este laboratorio se demuestra que JavaScript nativo puede interactuar con React cuando se controla dentro de un componente cliente.
