"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
    ],
  },
  {
    key: "servicios",
    label: "Servicios",
    description: "Accede a colaboraciones, coaching y publicaciones premium.",
    links: [
      { href: "/contacto", label: "Consultoría editorial" },
      { href: "/contacto#colaboracion", label: "Propuestas de colaboración" },
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

    function handleKeyDown(e) {
      if (e.key === "Escape") setOpenKey(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleEnter = useCallback((key) => setOpenKey(key), []);
  const handleLeave = useCallback(() => setOpenKey(null), []);
  const handleTouch = useCallback((key) => setOpenKey((prev) => (prev === key ? null : key)), []);

  const onTriggerKeyDown = useCallback((e, key) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenKey((prev) => (prev === key ? null : key));
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpenKey(key);
      // focusing the first link could be added here if needed
    }
  }, []);

  return (
    <div className="interactive-menu" ref={containerRef}>
      {menuItems.map((item) => (
        <div
          className="interactive-menu-item"
          key={item.key}
          onPointerEnter={() => handleEnter(item.key)}
          onPointerLeave={handleLeave}
        >
          <button
            type="button"
            className="interactive-menu-trigger"
            aria-haspopup="true"
            aria-controls={`panel-${item.key}`}
            aria-expanded={openKey === item.key}
            onPointerDown={() => handleTouch(item.key)}
            onTouchStart={() => handleTouch(item.key)}
            onKeyDown={(e) => onTriggerKeyDown(e, item.key)}
          >
            {item.label}
          </button>

          <div
            id={`panel-${item.key}`}
            className={`interactive-menu-panel ${openKey === item.key ? "is-open" : ""}`}
            role="menu"
            aria-hidden={openKey !== item.key}
            aria-labelledby={undefined}
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
