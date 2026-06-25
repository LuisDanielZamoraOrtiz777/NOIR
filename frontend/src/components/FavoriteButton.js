"use client";
import { useState, useEffect } from "react";
import { getCookie, setCookie } from "@/utils/cookies";

export default function FavoriteButton({ postId }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favs = getCookie("favorites");
    if (favs) {
      try {
        const favList = JSON.parse(favs);
        setIsFavorite(favList.includes(postId));
      } catch (e) {
        setIsFavorite(false);
      }
    }
  }, [postId]);

  const toggleFavorite = (event) => {
    event.preventDefault(); // Prevent link propagation if card click
    let favList = [];
    const favs = getCookie("favorites");
    if (favs) {
      try {
        favList = JSON.parse(favs);
      } catch (e) {
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
    
    // Dispatch custom event to notify other components (like SavedFavorites)
    window.dispatchEvent(new Event("favorites-updated"));
  };

  return (
    <button
      type="button"
      className={`favorite-button ${isFavorite ? "active" : ""}`}
      onClick={toggleFavorite}
      aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
    >
      {isFavorite ? "★ Guardado" : "☆ Guardar"}
    </button>
  );
}
