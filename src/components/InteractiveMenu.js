"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const menuItems = [
  {
    key: "discover",
    label: "Explorar",
    description: "Navega nuestra colección de estilo y editorial.",
    links: [
      { href: "/editoriales", label: "Editoriales" },
      { href: "/looks", label: "Looks" },
      { href: "/opinion", label: "Opinión" },
      { href: "/comunidad", label: "Comunidad" },
    ],
  },
  {
    key: "servicios",
    label: "Servicios",
    description: "Accede a colaboraciones, coaching y publicaciones premium.",
    links: [
      { href: "/contacto", label: "Consultoría editorial" },
      { href: "/contacto", label: "Propuestas de colaboración" },
    ],
  },
];

export default function InteractiveMenu() {
  const [openKey, setOpenKey] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenKey(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const handleEnter = (key) => setOpenKey(key);
  const handleLeave = () => setOpenKey(null);
  const handleTouch = (key) => setOpenKey(openKey === key ? null : key);

  return (
    <div className="interactive-menu" ref={containerRef}>
      {menuItems.map((item) => (
        <div
          className="interactive-menu-item"
          key={item.key}
          onMouseEnter={() => handleEnter(item.key)}
          onMouseLeave={handleLeave}
        >
          <button
            type="button"
            className="interactive-menu-trigger"
            aria-haspopup="true"
            aria-expanded={openKey === item.key}
            onTouchStart={() => handleTouch(item.key)}
          >
            {item.label}
          </button>

          <div
            className={`interactive-menu-panel ${openKey === item.key ? "is-open" : ""}`}
            role="menu"
            aria-hidden={openKey !== item.key}
          >
            <p className="menu-description">{item.description}</p>
            <ul>
              {item.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="menu-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
