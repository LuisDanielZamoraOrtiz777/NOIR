"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // No proteger la página de login
    if (pathname === "/admin/login") {
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("admin_token");
    
    if (!token) {
      // No autenticado, redirigir a login
      router.push("/admin/login");
    } else {
      // Autenticado
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router, pathname]);

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-700 border-t-white mb-4"></div>
          <p className="text-neutral-400 text-sm">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (se redirige)
  if (!isAuthenticated && pathname !== "/admin/login") {
    return null;
  }

  return children;
}
