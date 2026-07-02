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
];

const categoryItems = [
  { href: "/looks?category=hombre", label: "Ropa de hombre" },
  { href: "/looks?category=mujer", label: "Ropa de mujer" },
  { href: "/opinion", label: "Blog" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const toggleCategories = useCallback((event) => {
    event.preventDefault();
    setCategoriesOpen((current) => !current);
  }, []);

  const closeCategories = useCallback(() => setCategoriesOpen(false), []);

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
              <li
                className="nav-item nav-dropdown"
                onPointerEnter={() => setCategoriesOpen(true)}
                onPointerLeave={closeCategories}
              >
                <button
                  type="button"
                  className="nav-link nav-dropdown-trigger"
                  aria-haspopup="true"
                  aria-expanded={categoriesOpen}
                  onTouchStart={toggleCategories}
                >
                  Categorías
                </button>
                <ul className={`dropdown-menu ${categoriesOpen ? "is-open" : ""}`} role="menu">
                  {categoryItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="dropdown-link" onClick={closeCategories}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>

          <div className="header-actions" data-element="header-acciones">
            <SearchBox />
            <DarkToggle />
            <Link href="/admin/login" className="btn btn-sm btn-outline-dark ms-2">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
