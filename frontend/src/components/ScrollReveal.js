"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.02 }
    );

    const observeElements = () => {
      const els = document.querySelectorAll("[data-element]:not(.is-visible)");
      els.forEach((el) => {
        if (!el.closest("header") && !el.closest("footer") && !el.closest(".dom-lab")) {
          observer.observe(el);
        }
      });
    };

    // Run initially
    observeElements();

    // Watch for dynamic DOM changes (API loaded content, hydration, etc)
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
