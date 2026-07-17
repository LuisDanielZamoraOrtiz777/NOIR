"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import DarkToggle from "@/components/DarkToggle";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/editoriales", label: "Editoriales" },
  { href: "/tendencias", label: "Tendencias" },
  { href: "/opinion", label: "Opinión" },
  { href: "/revistas", label: "Revistas" },
  { href: "/editor", label: "Editor" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const [hasUserSession, setHasUserSession] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSessionState = () => {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        setHasAdminSession(true);
        try {
          const user = JSON.parse(localStorage.getItem("admin_user") || "{}");
          setAdminEmail(user.email || "");
        } catch {
          setAdminEmail("");
        }
      } else {
        setHasAdminSession(false);
        setAdminEmail("");
      }

      const userToken = localStorage.getItem("user_token");
      if (userToken) {
        setHasUserSession(true);
        try {
          const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
          setUserEmail(userData.email || userData.nombre || "");
        } catch {
          setUserEmail("");
        }
      } else {
        setHasUserSession(false);
        setUserEmail("");
      }
    };

    updateSessionState();
    window.addEventListener("storage", updateSessionState);
    return () => window.removeEventListener("storage", updateSessionState);
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/") return pathname === "/" || pathname === "/home";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const handleAdminLogout = async () => {
    if (!confirm("¿Cerrar sesión de administrador?")) return;
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      });
    } catch {}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_rol");
    setHasAdminSession(false);
    setAdminEmail("");
    window.location.href = "/";
  };

  const handleUserLogout = async () => {
    if (!confirm("¿Cerrar sesión?")) return;
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("user_token") || ""}`,
        },
      });
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
          <Link href="/" aria-label="Noir Atelier - Inicio">
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
                  <Link
                    href={link.href}
                    className={isActive(link.href) ? "is-active" : undefined}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions" data-element="header-acciones">
            <SearchBox />
            <DarkToggle />
            {hasAdminSession ? (
              <>
                <Link href="/admin" className="btn btn-sm btn-outline-warning me-2">
                  Panel
                </Link>
                <span className="text-muted small me-2 d-none d-md-inline" title={adminEmail}>
                  {adminEmail}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={handleAdminLogout}
                >
                  Cerrar sesión
                </button>
              </>
            ) : hasUserSession ? (
              <>
                <Link href="/perfil" className="btn btn-sm btn-outline-info me-2">
                  Mi Perfil
                </Link>
                <span className="text-muted small me-2 d-none d-md-inline" title={userEmail}>
                  {userEmail}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={handleUserLogout}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/acceso" className="btn btn-sm btn-outline-light ms-2">
                  Acceso
                </Link>
                <Link href="/registro" className="btn btn-sm btn-outline-secondary ms-2 d-none d-md-inline-flex">
                  Registro
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
