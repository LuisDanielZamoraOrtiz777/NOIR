"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import DarkToggle from "@/components/DarkToggle";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/editoriales", label: "Editoriales" },
  { href: "/tendencias", label: "Tendencias" },
  { href: "/opinion", label: "Opinión" },
  { href: "/revistas", label: "Revistas" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const [hasUserSession, setHasUserSession] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Verificar sesión de admin
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      setHasAdminSession(true);
      try {
        const user = JSON.parse(localStorage.getItem("admin_user") || "{}");
        setAdminEmail(user.email || "");
      } catch {}
    }
    
    // Verificar sesión de usuario normal
    const userToken = localStorage.getItem("user_token");
    if (userToken) {
      setHasUserSession(true);
      try {
        const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
        setUserEmail(userData.email || userData.nombre || "");
      } catch {}
    }
  }, []);

  const handleAdminLogout = async () => {
    if (!confirm("¿Cerrar sesión de administrador?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" } });
    } catch {}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setHasAdminSession(false);
    setAdminEmail("");
    window.location.href = "/";
  };

  const handleUserLogout = async () => {
    if (!confirm("¿Cerrar sesión?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" } });
    } catch {}
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_data");
    setHasUserSession(false);
    setUserEmail("");
    window.location.href = "/";
  };

  return (
    <header id="site-header" className="site-header" data-element="header">
      <div className="header-inner">
        <div className="brand" data-element="logo">
          <Link href="/">
            <span className="logo-mark">NA</span>
            <span className="logo-text">Noir Atelier</span>
          </Link>
        </div>

        <button
          type="button"
          className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="sr-only">Abrir menú</span>
          <span aria-hidden="true" />
        </button>

        <div className={`header-menu ${menuOpen ? "is-open" : ""}`}>
          <nav
            id="main-navigation"
            className="main-navigation"
            aria-label="Navegación principal"
            data-element="menu-navegacion"
          >
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions" data-element="header-acciones">
            <SearchBox />
            <DarkToggle />
            {hasAdminSession ? (
              <>
                <span className="text-muted small me-2 d-none d-md-inline">{adminEmail}</span>
                <button className="btn btn-sm btn-outline-danger ms-2" onClick={handleAdminLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : hasUserSession ? (
              <>
                <span className="text-muted small me-2 d-none d-md-inline">{userEmail}</span>
                <button className="btn btn-sm btn-outline-danger ms-2" onClick={handleUserLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/acceso" className="btn btn-sm btn-outline-light ms-2">
                  Acceso
                </Link>
                <Link href="/admin/login" className="btn btn-sm btn-outline-dark ms-2">
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
