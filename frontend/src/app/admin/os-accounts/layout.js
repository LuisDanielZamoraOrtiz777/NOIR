"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_BASE?.trim() || "").replace(/\/$/, "").replace(/\/api$/, "");

export default function OSAccountsLayoutGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    const rol = (localStorage.getItem("user_rol") || "").toLowerCase();
    if (!token || (rol !== "admin" && rol !== "administrador")) {
      router.replace("/acceso");
      return;
    }
    // Verificación contra el backend: silenciosa, sólo como candado extra
    fetch(`${API}/api/admin/os/users`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          localStorage.removeItem("user_token");
          localStorage.removeItem("user_data");
          localStorage.removeItem("user_rol");
          router.replace("/acceso");
          return;
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [router]);

  if (!ready) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-light">
        <div className="spinner-border text-light" role="status" />
      </div>
    );
  }

  return <>{children}</>;
}
