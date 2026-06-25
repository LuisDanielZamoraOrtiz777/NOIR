"use client";
import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("ok");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Error al enviar el mensaje.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("Error de red. Intenta de nuevo más tarde.");
    }
  }

  return (
    <form className="contact-form" id="contact-form" onSubmit={handleSubmit}>
      <label htmlFor="name">Nombre</label>
      <input id="name" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required />

      <label htmlFor="email">Correo</label>
      <input id="email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <label htmlFor="message">Mensaje</label>
      <textarea id="message" rows="4" placeholder="Escribe tu mensaje" value={message} onChange={(e) => setMessage(e.target.value)} required></textarea>

      <button type="submit" className="button" disabled={status === "loading"}>
        {status === "loading" ? "Enviando..." : "Enviar mensaje"}
      </button>

      {status === "ok" && <p className="success">Mensaje enviado. Gracias.</p>}
      {status === "error" && <p className="error">{errorMessage || "Error al enviar. Intenta más tarde."}</p>}
    </form>
  );
}
