"use client";
import { useState } from "react";

export default function DomLab() {
  const [status, setStatus] = useState("Interactúa con los controles para ver cambios en el DOM.");

  function handleChangeTitle() {
    const title = document.getElementById("dom-title");
    if (title) {
      title.textContent = "DOM actualizado con JavaScript";
      setStatus("Título actualizado con textContent.");
    }
  }

  function handleChangeBox() {
    const box = document.getElementById("dynamic-box");
    if (box) {
      box.innerHTML = "<strong>Contenido HTML modificado</strong> con <em>JavaScript</em>.";
      setStatus("Contenido cambiado con innerHTML.");
    }
  }

  function handleChangeStyle() {
    const firstCard = document.querySelector(".dom-card");
    if (firstCard) {
      firstCard.style.backgroundColor = "#111";
      firstCard.style.color = "#fff";
      firstCard.style.border = "1px solid #000";
      setStatus("Estilos aplicados con style a la primera tarjeta.");
    }
  }

  function handleCreateItem() {
    const newItem = document.createElement("li");
    newItem.textContent = "Look agregado a favoritos";
    newItem.style.padding = "8px";
    newItem.style.borderBottom = "1px solid #ddd";
    const list = document.getElementById("favorites-list");
    if (list) {
      list.appendChild(newItem);
      setStatus("Nuevo elemento creado y añadido con appendChild.");
    }
  }

  function handleSelectAll() {
    const cards = document.querySelectorAll(".dom-card");
    cards.forEach((card) => {
      card.style.border = "1px solid black";
      card.style.padding = "18px";
    });
    setStatus(`${cards.length} tarjetas seleccionadas con querySelectorAll.`);
  }

  function handleClearFavorites() {
    const list = document.getElementById("favorites-list");
    if (list) {
      list.innerHTML = "";
      setStatus("Lista de favoritos limpiada.");
    }
  }

  return (
    <div className="dom-lab" id="dom-lab" data-element="dom-lab">
      <h2 id="dom-title">Laboratorio DOM</h2>
      <p id="dom-description">
        Usa los controles para manipular el DOM con JavaScript directo desde este componente.
      </p>
      <div className="dom-cards">
        <article className="dom-card">Look editorial 01</article>
        <article className="dom-card">Look editorial 02</article>
        <article className="dom-card">Look editorial 03</article>
      </div>
      <div className="dom-controls">
        <button type="button" onClick={handleChangeTitle}>
          Cambiar título
        </button>
        <button type="button" onClick={handleChangeBox}>
          Cambiar contenido
        </button>
        <button type="button" onClick={handleChangeStyle}>
          Cambiar estilo
        </button>
        <button type="button" onClick={handleCreateItem}>
          Crear favorito
        </button>
        <button type="button" onClick={handleSelectAll}>
          Seleccionar tarjetas
        </button>
        <button type="button" onClick={handleClearFavorites}>
          Limpiar favoritos
        </button>
      </div>
      <div className="dom-box" id="dynamic-box">
        Esta caja cambia su contenido con <code>innerHTML</code>.
      </div>
      <div className="favorites-panel">
        <h3>Favoritos</h3>
        <ul id="favorites-list"></ul>
      </div>
      <p className="dom-status">{status}</p>
    </div>
  );
}
