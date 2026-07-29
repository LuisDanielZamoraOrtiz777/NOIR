"use client";
import { useState, useEffect, useCallback } from "react";
import { getCookie, setCookie } from "@/utils/cookies";

export default function FavoriteButton({ postId }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check authentication status
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;
    setIsAuthenticated(!!token);
  }, []);

  // Load favorite status
  const loadFavoriteStatus = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;

    if (token) {
      // Authenticated user - fetch from DB
      try {
        const response = await fetch("/api/favoritos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.favorites?.includes(postId) || false);
        }
      } catch (e) {
        console.error("Error loading favorites from DB:", e);
        // Fallback to cookie
        const favs = getCookie("favorites");
        if (favs) {
          try {
            const favList = JSON.parse(favs);
            setIsFavorite(favList.includes(postId));
          } catch {
            setIsFavorite(false);
          }
        }
      }
    } else {
      // Non-authenticated user - use cookie
      const favs = getCookie("favorites");
      if (favs) {
        try {
          const favList = JSON.parse(favs);
          setIsFavorite(favList.includes(postId));
        } catch {
          setIsFavorite(false);
        }
      }
    }
  }, [postId]);

  useEffect(() => {
    loadFavoriteStatus();
  }, [loadFavoriteStatus]);

  const toggleFavorite = async (event) => {
    event.preventDefault(); // Prevent link propagation if card click
    setIsLoading(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;

    if (token) {
      // Authenticated user - use DB
      try {
        if (isFavorite) {
          // Remove from DB
          await fetch(`/api/favoritos?post_id=${encodeURIComponent(postId)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsFavorite(false);
        } else {
          // Add to DB
          await fetch("/api/favoritos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ post_id: postId }),
          });
          setIsFavorite(true);
        }
      } catch (e) {
        console.error("Error toggling favorite in DB:", e);
        // Fallback to cookie
        toggleCookieFavorite();
      }
    } else {
      // Non-authenticated user - use cookie
      toggleCookieFavorite();
    }

    // Dispatch custom event to notify other components (like SavedFavorites)
    window.dispatchEvent(new Event("favorites-updated"));
    setIsLoading(false);
  };

  // Cookie-based fallback
  const toggleCookieFavorite = () => {
    let favList = [];
    const favs = getCookie("favorites");
    if (favs) {
      try {
        favList = JSON.parse(favs);
      } catch {
        favList = [];
      }
    }

    if (favList.includes(postId)) {
      favList = favList.filter((id) => id !== postId);
      setIsFavorite(false);
    } else {
      favList.push(postId);
      setIsFavorite(true);
    }

    setCookie("favorites", JSON.stringify(favList), 30);
  };

  return (
    <button
      type="button"
      className={`favorite-button ${isFavorite ? "active" : ""}`}
      onClick={toggleFavorite}
      disabled={isLoading}
      aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
    >
      {isLoading ? "…" : isFavorite ? "★ Guardado" : "☆ Guardar"}
    </button>
  );
}