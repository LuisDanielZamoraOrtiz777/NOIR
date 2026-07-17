"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Componente que protege rutas verificando el token de usuario
 * @param {Object} props
 * @param {string} props.tokenKey - Clave en localStorage donde se guarda el token ('user_token' o 'admin_token')
 * @param {string} props.redirectTo - Ruta a redirigir si no hay token
 * @param {React.ReactNode} props.children - Contenido a proteger
 */
export default function RouteProtector({ tokenKey, redirectTo = "/acceso", children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem(tokenKey);
    
    if (!token) {
      // No hay token, mostrar pantalla de acceso
      setIsLoading(false);
    } else {
      // Hay token, verificar que sea válido
      verifyToken(token);
    }
  }, [router, tokenKey, redirectTo]);

  const verifyToken = async (token) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";
      const endpoint = tokenKey === "admin_token" ? "/api/admin/verify" : "/api/auth/verify";
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        // Token inválido o expirado, limpiar
        localStorage.removeItem(tokenKey);
        if (tokenKey === "admin_token") {
          localStorage.removeItem("admin_user");
        } else {
          localStorage.removeItem("user_data");
        }
        setIsAuthorized(false);
      } else {
        // Token válido
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error("Error verificando token:", error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="text-center">
          <div className="spinner-border text-light mb-3" role="status"></div>
          <p className="text-light">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autorizado, mostrar pantalla de acceso
  if (!isAuthorized) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="text-center">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden" style={{
            background: "rgba(15, 23, 42, 0.95)",
            color: "#fff",
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.45)",
            maxWidth: "400px",
            margin: "0 auto"
          }}>
            <div className="card-body p-5">
              <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #f8fafc 0%, #8b5cf6 100%)",
                color: "#111827",
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="fw-bold mb-3">Acceso Requerido</h2>
              <p className="text-light-emphasis small mb-4">
                Necesitas iniciar sesión para acceder a esta página
              </p>
              <div className="d-grid gap-2">
                <Link href={redirectTo} className="btn btn-lg rounded-pill border-0" style={{
                  background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
                  color: "#fff",
                }}>
                  Iniciar Sesión / Registrarse
                </Link>
                <Link href="/" className="btn btn-outline-light btn-sm">
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostrar el contenido
  return <>{children}</>;
}
