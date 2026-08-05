"use client";
import { useEffect, useState } from "react";

export default function ContactForm() {
  const [userData, setUserData] = useState(null); // { nombre, email } leídos de user_data
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("mensaje"); // mensaje | colaboracion
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("user_data");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const emailFromStorage = data?.email || "";
      setUserData({
        nombre: data?.nombre || data?.name || "",
        email: emailFromStorage,
      });
      if (emailFromStorage) {
        setEmail(emailFromStorage);
      }
    } catch (error) {
      console.warn("No se pudo parsear user_data en ContactForm:", error);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    if (!message.trim()) {
      setStatus("error");
      setErrorMessage("El mensaje no puede estar vacío.");
      return;
    }

    const safeEmail = (userData?.email || email || "").trim();
    if (!safeEmail) {
      setStatus("error");
      setErrorMessage("Escribe tu correo electrónico para que podamos responder.");
      return;
    }

    const headers = { "Content-Type": "application/json" };
    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: safeEmail, message, tipo }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("ok");
        setMessage("");
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.detail || "Error al enviar el mensaje.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("Error de red. Intenta de nuevo más tarde.");
    }
  }

  return (
    <form className="contact-form" id="contact-form" onSubmit={handleSubmit}>
      {userData?.email ? (
        <div className="contact-form-sender mb-3 p-3 rounded" style={{ background: "#faf9f6", border: "1px solid #e6e4df" }}>
          <p className="mb-1 small text-muted text-uppercase" style={{ letterSpacing: "0.1em" }}>
            Enviando como
          </p>
          <p className="mb-0 fw-semibold" style={{ color: "#0b0b0b" }}>
            {userData?.nombre || "Usuario"}
            <span className="text-muted fw-normal small ms-2">&lt;{userData.email}&gt;</span>
          </p>
        </div>
      ) : (
        <div className="mb-3">
          <label htmlFor="contact-email">Correo electrónico</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            placeholder="tu@correo.com"
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            required
          />
        </div>
      )}

      <label htmlFor="contact-tipo">Tipo</label>
      <select
        id="contact-tipo"
        className="form-select mb-3"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        disabled={status === "loading"}
        style={{ border: "1px solid #ccc", padding: "12px 14px", borderRadius: "4px" }}
      >
        <option value="mensaje">Mensaje general</option>
        <option value="colaboracion">Propuesta de colaboración</option>
      </select>

      <label htmlFor="message">Mensaje</label>
      <textarea
        id="message"
        rows={5}
        placeholder={
          tipo === "colaboracion"
            ? "Cuéntanos tu propuesta de colaboración, presupuesto estimado y plazos."
            : "Escribe tu mensaje"
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        disabled={status === "loading"}
        maxLength={5000}
      ></textarea>

      <button type="submit" className="button" disabled={status === "loading"}>
        {status === "loading" ? "Enviando..." : "Enviar mensaje"}
      </button>

      {status === "ok" && (
        <p className="success" role="status">
          Mensaje enviado. El equipo editorial lo revisará pronto.
        </p>
      )}
      {status === "error" && (
        <p className="error" role="alert">
          {errorMessage || "Error al enviar. Intenta más tarde."}
        </p>
      )}
    </form>
  );
}