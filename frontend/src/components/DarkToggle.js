"use client";

import { useTheme } from "@/context/ThemeContext";

export default function DarkToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="dark-toggle"
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
