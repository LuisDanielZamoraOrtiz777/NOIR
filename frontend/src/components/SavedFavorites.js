"use client";
import { useState, useEffect } from "react";
import { getCookie } from "@/utils/cookies";
import posts from "@/data/posts";
import PostCard from "@/components/PostCard";

export default function SavedFavorites() {
  const [favorites, setFavorites] = useState([]);

  const loadFavorites = () => {
    const favsCookie = getCookie("favorites");
    if (favsCookie) {
      try {
        const favIds = JSON.parse(favsCookie);
        const filtered = posts.filter((post) => favIds.includes(post.id));
        setFavorites(filtered);
      } catch (e) {
        setFavorites([]);
      }
    } else {
      setFavorites([]);
    }
  };

  useEffect(() => {
    loadFavorites();
    window.addEventListener("favorites-updated", loadFavorites);
    return () => {
      window.removeEventListener("favorites-updated", loadFavorites);
    };
  }, []);

  if (favorites.length === 0) {
    return (
      <section className="favorites-section section-block">
        <h2>Tus Favoritos</h2>
        <div className="favorites-empty">
          <p>Aún no tienes looks o editoriales guardados. Explora el blog y presiona "Guardar" en tus preferidos.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="favorites-section section-block" data-element="favoritos-guardados">
      <h2>Tus Favoritos</h2>
      <div className="card-grid">
        {favorites.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
