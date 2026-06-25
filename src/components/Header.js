"use client";
import { useState } from "react";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/editoriales", label: "Editoriales" },
  { href: "/looks", label: "Looks" },
  { href: "/opinion", label: "Opinión" },
  { href: "/comunidad", label: "Comunidad" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="sr-only">Abrir menú</span>
          <span aria-hidden="true" />
        </button>

        <div className={`header-menu ${menuOpen ? "is-open" : ""}`}>
          <nav id="main-navigation" className="main-navigation" aria-label="Navegación principal" data-element="menu-navegacion">
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
          </div>
        </div>
      </div>
    </header>
  );
}
