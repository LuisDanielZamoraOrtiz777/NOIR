"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import DarkToggle from "@/components/DarkToggle";
import { getCookie } from "@/utils/cookies";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/editoriales", label: "Editoriales" },
  { href: "/tendencias", label: "Tendencias" },
  { href: "/opinion", label: "Opinión" },
  { href: "/revistas", label: "Revistas" },
  { href: "/tienda", label: "Tienda" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const [hasUserSession, setHasUserSession] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [email, setEmail] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // Leer contador del carrito desde la cookie
  useEffect(() => {
    const updateCartCount = () => {
      const cart = getCookie("cart");
      if (cart) {
        try {
          const items = JSON.parse(cart);
          const total = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCartCount(total);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    return () => window.removeEventListener("cart-updated", updateCartCount);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const token = localStorage.getItem("user_token");
      const role = (localStorage.getItem("user_rol") || "").toString().toLowerCase();
      const data = JSON.parse(localStorage.getItem("user_data") || "{}");

      if (token && (role === "admin" || role === "administrador")) {
        setHasAdminSession(true);
        setHasUserSession(false);
        setUserRole(role);
        setEmail(data.email || data.nombre || "");
        return;
      }

      if (token) {
        setHasUserSession(true);
        setHasAdminSession(false);
        setUserRole(role);
        setEmail(data.email || data.nombre || "");
        return;
      }

      setHasAdminSession(false);
      setHasUserSession(false);
      setUserRole("");
      setEmail("");
    };

    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [pathname]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href) => {
    if (href === "/") return pathname === "/" || pathname === "/home";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    if (!confirm("¿Cerrar sesión?")) return;
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("user_token") || ""}` },
      });
    } catch {}
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("user_rol");
    setHasAdminSession(false);
    setHasUserSession(false);
    setEmail("");
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
              {(() => {
                const mainNavLinks = [...navLinks];
                if (hasUserSession && userRole === "editor") mainNavLinks.push({ href: "/editor", label: "Editor" });
                return mainNavLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={isActive(link.href) ? "is-active" : undefined} aria-current={isActive(link.href) ? "page" : undefined}>
                      {link.label}
                    </Link>
                  </li>
                ));
              })()}
            </ul>
          </nav>

          <div className="header-actions" data-element="header-acciones">
            <SearchBox />
            <DarkToggle />
            <Link href="/carrito" className="cart-icon-link" aria-label={`Carrito (${cartCount} artículos)`}>
              <span className="cart-icon">🛒</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            {hasAdminSession ? (
              <>
                <Link href="/admin" className="btn btn-sm btn-outline-warning me-2">Panel</Link>
                <span className="text-muted small me-2 d-none d-md-inline" title={email}>{email}</span>
                <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={handleLogout}>Cerrar sesión</button>
              </>
            ) : hasUserSession ? (
              <>
                <Link href="/perfil" className="btn btn-sm btn-outline-info me-2">Mi Perfil</Link>
                <span className="text-muted small me-2 d-none d-md-inline" title={email}>{email}</span>
                <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={handleLogout}>Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link href="/acceso" className="btn btn-sm btn-outline-light ms-2">Acceso</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
