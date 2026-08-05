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
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="auth-title">{heading}</h1>
        <p className="auth-subtitle">{message}</p>
        <div className="d-grid gap-2">
          <Link href={redirectTo} className="primary-button">
            Iniciar sesión / Registrarme
          </Link>
          <Link href="/" className="auth-switch">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}