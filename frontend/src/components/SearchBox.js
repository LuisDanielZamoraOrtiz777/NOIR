"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    router.push("/tendencias");
  }

  return (
    <form className="search-box" id="search-form" data-element="buscador" onSubmit={handleSubmit}>
      <label htmlFor="search-input" className="sr-only">
        Buscar artículos
      </label>
      <input
        id="search-input"
        type="search"
        placeholder="Buscar moda..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Buscar</button>
    </form>
  );
}
