"use client";
import { useEffect, useState } from "react";
import AuthRequiredPanel from "@/components/AuthRequiredPanel";

export default function OpinionPage() {
  return (
    <main className="section-block page-content">
      <h1>Opinión</h1>
      <p>Textos críticos sobre la industria de la moda y las nuevas tendencias.</p>
      <article className="text-article">
        <h2>Moda como forma de expresión</h2>
        <p>
          Noir Atelier explora cómo las prendas se convierten en narrativas visuales y culturales.
        </p>
      </article>

      <section className="card border-0 mt-4" style={{ background: "#1a1a1a" }}>
        <div className="card-body p-4 p-md-5">
          <h5 className="text-white mb-3">Enviar mensaje al administrador</h5>
          <p className="text-muted small mb-3">Tus sugerencias o propuestas de colaboración llegarán al equipo editorial.</p>
          <SendToAdmin />
        </div>
      </section>
    </main>
  );
}

function SendToAdmin() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
  const [userData, setUserData] = useState(null);
  const [tipo, setTipo] = useState("mensaje");
  const [messageText, setMessageText] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("user_data");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setUserData({
        nombre: data?.nombre || data?.email || "Usuario",
        email: data?.email || "",
      });
    } catch (error) {
      console.warn("No se pudo parsear user_data en Opinion:", error);
    }
  }, []);

  const send = async (e) => {
    e && e.preventDefault();
    if (!messageText.trim()) {
      setStatus({ type: "danger", text: "El mensaje no puede estar vacío" });
      return;
    }

    const token = localStorage.getItem("user_token");
    if (!token) {
      setStatus({ type: "danger", text: "Tu sesión expiró. Vuelve a iniciar sesión." });
      return;
    }

    setLoadingMsg(true);
    setStatus({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageText, tipo }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || data.error || `Error al enviar mensaje (${res.status})`);
      }

      setStatus({ type: "success", text: "Mensaje enviado. Gracias por tu sugerencia." });
      setMessageText("");
    } catch (err) {
      console.error("/api/contact fetch failed", err);
      setStatus({ type: "danger", text: err.message || "No se pudo enviar el mensaje." });
    } finally {
      setLoadingMsg(false);
    }
  };

  return (
    <AuthRequiredPanel
      heading="Inicia sesión para opinar"
      message="Para enviar mensajes al equipo editorial o proponer una colaboración, necesitamos una cuenta."
    >
      <form onSubmit={send}>
        {status.text && (
          <div className={`alert alert-${status.type} alert-dismissible`} role={status.type === "danger" ? "alert" : "status"}>
            {status.text}
            <button type="button" className="btn-close" onClick={() => setStatus({ type: "", text: "" })} aria-label="Cerrar mensaje"></button>
          </div>
        )}

        {/* Remitente: tomado del JWT, sólo lectura */}
        <div className="mb-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <p className="mb-1 small text-uppercase" style={{ letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)" }}>
            Enviando como
          </p>
          <p className="mb-0 fw-semibold text-white">
            {userData?.nombre || "Usuario"}
            {userData?.email && (
              <span className="ms-2 fw-normal" style={{ color: "rgba(255,255,255,0.6)" }}>
                &lt;{userData.email}&gt;
              </span>
            )}
          </p>
        </div>

        <div className="mb-3">
          <label htmlFor="opinion-tipo" className="form-label text-light small">Tipo</label>
          <select
            id="opinion-tipo"
            className="form-select bg-dark text-white border-secondary"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={loadingMsg}
          >
            <option value="mensaje">Mensaje / opinión</option>
            <option value="colaboracion">Propuesta de colaboración</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="opinion-mensaje" className="form-label text-light small">
            {tipo === "colaboracion" ? "Tu propuesta" : "Mensaje"}
          </label>
          <textarea
            id="opinion-mensaje"
            className="form-control bg-dark text-white border-secondary"
            rows={5}
            placeholder={
              tipo === "colaboracion"
                ? "Describe tu propuesta, presupuesto estimado y plazos."
                : "Escribe tu mensaje u opinión"
            }
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            required
            disabled={loadingMsg}
            maxLength={5000}
          />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={loadingMsg}>
            {loadingMsg ? "Enviando..." : "Enviar al admin"}
          </button>
          <button className="btn btn-outline-light" type="button" onClick={() => setMessageText("")} disabled={loadingMsg}>
            Limpiar
          </button>
        </div>
      </form>
    </AuthRequiredPanel>
  );
}