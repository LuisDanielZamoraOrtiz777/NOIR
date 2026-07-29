"use client";
import { useState, useEffect, useCallback } from "react";
import { getCookie } from "@/utils/cookies";
import posts from "@/data/posts";
import PostCard from "@/components/PostCard";

export default function SavedFavorites() {
  const [favorites, setFavorites] = useState([]);

  const loadFavorites = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;
    let favIds = [];

    if (token) {
      // Authenticated user - fetch from DB
      try {
        const response = await fetch("/api/favoritos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          favIds = data.favorites || [];
        }
      } catch (e) {
        console.error("Error loading favorites from DB:", e);
        // Fallback to cookie
        const favsCookie = getCookie("favorites");
        if (favsCookie) {
          try {
            favIds = JSON.parse(favsCookie);
          } catch {
            favIds = [];
          }
        }
      }
    } else {
      // Non-authenticated user - use cookie
      const favsCookie = getCookie("favorites");
      if (favsCookie) {
        try {
          favIds = JSON.parse(favsCookie);
        } catch {
          favIds = [];
        }
      }
    }

    const filtered = posts.filter((post) => favIds.includes(post.id));
    setFavorites(filtered);
  }, []);

  useEffect(() => {
    loadFavorites();
    window.addEventListener("favorites-updated", loadFavorites);
    return () => {
      window.removeEventListener("favorites-updated", loadFavorites);
    };
  }, [loadFavorites]);

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