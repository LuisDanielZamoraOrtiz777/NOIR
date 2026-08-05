"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthRequiredPanel from "@/components/AuthRequiredPanel";

/**
 * Componente que protege rutas verificando el token de usuario
 * @param {Object} props
 * @param {string} props.tokenKey - Clave en localStorage donde se guarda el token ('user_token' o 'admin_token')
 * @param {string} props.redirectTo - Ruta a redirigir si no hay token
 * @param {React.ReactNode} props.children - Contenido a proteger
 */
export default function RouteProtector({ tokenKey, redirectTo = "/acceso", requiredRole, children }) {
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
  }, [router, tokenKey, redirectTo, requiredRole]);

  const verifyToken = async (token) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";
      // Si la ruta requiere rol admin, verificar contra el endpoint admin.
      const wantsAdmin = requiredRole && (Array.isArray(requiredRole)
        ? requiredRole.map(r => r.toString().toLowerCase()).includes("admin") || requiredRole.map(r => r.toString().toLowerCase()).includes("administrador")
        : [requiredRole.toString().toLowerCase()].includes("admin") || [requiredRole.toString().toLowerCase()].includes("administrador")
      );
      const endpoint = wantsAdmin ? "/api/admin/verify" : (tokenKey === "admin_token" ? "/api/admin/verify" : "/api/auth/verify");
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        clearSession();
        setIsAuthorized(false);
        return;
      }

      const data = await res.json();
      const userRole = data?.user?.rol?.toString()?.toLowerCase() || "";

      if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole)
          ? requiredRole.map((role) => role.toString().toLowerCase())
          : [requiredRole.toString().toLowerCase()];

        if (!allowedRoles.includes(userRole)) {
          clearSession();
          setIsAuthorized(false);
          return;
        }
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Error verificando token:", error);
      clearSession();
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(tokenKey);

    if (tokenKey === "admin_token") {
      localStorage.removeItem("admin_user");
      localStorage.removeItem("admin_rol");
    } else {
      localStorage.removeItem("user_data");
      localStorage.removeItem("user_rol");
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
      <AuthRequiredPanel
        redirectTo={redirectTo}
        heading="Acceso Requerido"
        message="Necesitas iniciar sesión para acceder a esta página"
      />
    );
  }

  // Si está autorizado, mostrar el contenido
  return <>{children}</>;
}
