"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Un pequeño retraso permite que el DOM de la nueva ruta se monte por completo
    const timeoutId = setTimeout(() => {
      const selector = '[data-element]';
      const els = Array.from(document.querySelectorAll(selector)).filter(
        (el) => !el.closest("header") && !el.closest("footer") && !el.closest(".dom-lab")
      );

      if (!els.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 }
      );

      els.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]); // Se vuelve a ejecutar cuando cambia la ruta

  return null;
}
