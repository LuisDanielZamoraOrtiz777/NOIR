"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Muestra el panel de "Acceso requerido" cuando NO hay token de usuario
 * en localStorage, o los children cuando sí hay sesión activa.
 *
 * A diferencia de RouteProtector, este componente NO redirige: sólo
 * sustituye la región de la página que requiere login, dejando visible
 * el resto del contenido público (hero, info, FAQ, etc.).
 *
 * @param {Object} props
 * @param {string} [props.redirectTo="/acceso"]
 * @param {string} [props.heading="Inicia sesión para continuar"]
 * @param {string} [props.message]
 * @param {string} [props.tokenKey="user_token"] - clave en localStorage
 * @param {React.ReactNode} props.children
 */
export default function AuthRequiredPanel({
  redirectTo = "/acceso",
  heading = "Inicia sesión para continuar",
  message = "Necesitas una cuenta para enviar mensajes al equipo editorial.",
  tokenKey = "user_token",
  children,
}) {
  const [state, setState] = useState("loading"); // loading | authorized | unauthorized

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(tokenKey);
    setState(token ? "authorized" : "unauthorized");
  }, [tokenKey]);

  if (state === "loading") {
    return (
      <div className="d-flex align-items-center justify-content-center py-4">
        <div className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true" />
        <span className="ms-2 small text-muted">Verificando sesión…</span>
      </div>
    );
  }

  if (state === "authorized") {
    return <>{children}</>;
  }

  return (
    <div className="card border-0 rounded-4 overflow-hidden" style={{
      background: "rgba(15, 23, 42, 0.95)",
      color: "#fff",
      boxShadow: "0 25px 80px rgba(0, 0, 0, 0.35)",
      maxWidth: "520px",
      margin: "0 auto",
    }}>
      <div className="card-body p-4 p-md-5 text-center">
        <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{
          width: "60px",
          height: "60px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #f8fafc 0%, #8b5cf6 100%)",
          color: "#111827",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="h5 fw-bold mb-2">{heading}</h3>
        <p className="small mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          {message}
        </p>
        <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
          <Link
            href={redirectTo}
            className="btn btn-lg rounded-pill border-0 px-4"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              color: "#fff",
            }}
          >
            Iniciar sesión / Registrarme
          </Link>
        </div>
      </div>
    </div>
  );
}