"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import DarkToggle from "@/components/DarkToggle";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/editoriales", label: "Editoriales" },
  { href: "/tendencias", label: "Tendencias" },
  { href: "/opinion", label: "Opinión" },
  { href: "/revistas", label: "Revistas" },
  { href: "/registro", label: "Registro" },
  { href: "/editor", label: "Editor" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("admin_token");
    if (token) {
      setHasSession(true);
      try {
        const user = JSON.parse(localStorage.getItem("admin_user") || "{}");
        setUserEmail(user.email || "");
      } catch {}
    }
  }, []);

  const handleLogout = async () => {
    if (!confirm("¿Cerrar sesión?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" } });
    } catch {}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setHasSession(false);
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
            {hasSession ? (
              <>
                <span className="text-muted small me-2 d-none d-md-inline">{userEmail}</span>
                <button className="btn btn-sm btn-outline-danger ms-2" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link href="/admin/login" className="btn btn-sm btn-outline-dark ms-2">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
