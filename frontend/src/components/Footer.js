"use client";
import { useState } from "react";
import Link from "next/link";
import SocialButtons from "@/components/SocialButtons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubscribe(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("ok");
        setEmail("");
      } else {
        setStatus("error");
        setErrorMessage(data.error || `Error ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") setErrorMessage("La solicitud tardó demasiado. Intenta de nuevo.");
      else setErrorMessage("Error de red. Revisa tu conexión.");
      setStatus("error");
    }
  }

  return (
    <footer id="site-footer" className="site-footer" data-element="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <p className="footer-brand-title">Noir Atelier</p>
            <p className="footer-brand-copy">
              Experiencias editoriales de moda con diseño profesional, servicios creativos y contenidos premium.
            </p>
          </div>

        <div className="footer-nav">
          <h3>Enlaces</h3>
          <ul>
            <li><Link href="/editoriales">Editoriales</Link></li>
            <li><Link href="/looks">Looks</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h3>Contacto</h3>
          <p><a href="mailto:contacto@noiratelier.example">contacto@noiratelier.example</a></p>
          <p><a href="tel:+34123456789">+34 123 456 789</a></p>
          <p>Calle de la Moda 10 · Madrid</p>
        </div>

        <div className="footer-newsletter">
          <h3>Newsletter</h3>
          <p>Suscríbete para recibir lanzamientos exclusivos, eventos y contenido editorial.</p>
          <form onSubmit={handleSubscribe} className="newsletter-form">
            <label htmlFor="newsletter-email">Correo electrónico</label>
            <div className="newsletter-controls">
              <input
                id="newsletter-email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="button" disabled={status === "loading"}>
                {status === "loading" ? "Enviando..." : "Suscribir"}
              </button>
            </div>
            {status === "ok" && <p className="success">Gracias por suscribirte.</p>}
            {status === "error" && <p className="error">{errorMessage || "Error al suscribir. Intenta luego."}</p>}
          </form>
        </div>
      </div>

        <div className="footer-bottom">
          <div className="footer-bottom-links">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos</Link>
          </div>
          <div className="footer-bottom-right">
            <div className="footer-social">
              <SocialButtons />
            </div>
            <p className="footer-note">© 2026 Noir Atelier. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
