"use client";
import { useEffect, useState } from "react";

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";
  if (!base) return "";
  const normalized = base.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
}

export default function OpinionPage() {
  const API_BASE = getApiBase();

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
          <p className="text-muted small mb-3">Tus sugerencias llegarán al equipo administrativo.</p>
          <SendToAdmin />
        </div>
      </section>
    </main>
  );
}

function SendToAdmin() {
  const API_BASE = getApiBase();
  const [messageText, setMessageText] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [sender, setSender] = useState({ name: "Anónimo", email: "no-reply@noiratelier.com" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedUser = localStorage.getItem("user_data");
    if (savedUser) {
      try {
        const data = JSON.parse(savedUser);
        const name = data?.nombre || data?.email || "Anónimo";
        const email = data?.email || "no-reply@noiratelier.com";
        setSender({ name, email });
      } catch (error) {
        console.warn("No se pudo parsear user_data en Opinion:", error);
      }
    }
  }, []);

  const send = async (e) => {
    e && e.preventDefault();
    if (!messageText.trim()) return setStatus({ type: "danger", text: "El mensaje no puede estar vacío" });
    setLoadingMsg(true); setStatus({ type: "", text: "" });

    let name = "Anónimo";
    let email = "no-reply@noiratelier.com";

    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user_data");
      if (savedUser) {
        try {
          const data = JSON.parse(savedUser);
          name = data?.nombre || data?.email || name;
          email = data?.email || email;
        } catch (error) {
          console.warn("No se pudo parsear user_data al enviar mensaje:", error);
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: messageText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || "Error al enviar mensaje");
      setStatus({ type: "success", text: "Mensaje enviado. Gracias por tu sugerencia." });
      setMessageText("");
    } catch (err) {
      setStatus({ type: "danger", text: err.message || "No se pudo enviar el mensaje." });
    } finally { setLoadingMsg(false); }
  };

  return (
    <form onSubmit={send}>
      {status.text && (
        <div className={`alert alert-${status.type} alert-dismissible`}>
          {status.text}
          <button type="button" className="btn-close" onClick={() => setStatus({ type: "", text: "" })}></button>
        </div>
      )}
      <div className="mb-3">
        <label className="form-label text-light small">Mensaje</label>
        <textarea className="form-control bg-dark text-white border-secondary" rows={4} value={messageText} onChange={(e) => setMessageText(e.target.value)} required disabled={loadingMsg} />
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-primary" type="submit" disabled={loadingMsg}>{loadingMsg ? "Enviando..." : "Enviar al admin"}</button>
        <button className="btn btn-outline-light" type="button" onClick={() => setMessageText("")}>Limpiar</button>
      </div>
    </form>
  );
}
