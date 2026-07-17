"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Error de página:", error);
  }, [error]);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 25%), linear-gradient(135deg, #06070b 0%, #151a2d 50%, #090b12 100%)",
      }}
    >
      <div className="text-center text-white" style={{ maxWidth: 520 }}>
        <div
          className="d-inline-flex align-items-center justify-content-center mb-4"
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, #f8fafc 0%, #ef4444 100%)",
            color: "#111827",
            fontSize: 28,
          }}
        >
          !
        </div>
        <h1 className="h2 fw-bold mb-3">Algo salió mal</h1>
        <p className="text-light-emphasis mb-4">
          Ocurrió un error inesperado al cargar esta sección. Puedes reintentar
          o volver al inicio.
        </p>
        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="alert alert-danger text-start small mb-4">
            {error.message}
          </div>
        )}
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <button
            type="button"
            className="btn btn-lg rounded-pill border-0 px-4"
            onClick={() => reset()}
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              color: "#fff",
            }}
          >
            Reintentar
          </button>
          <Link href="/" className="btn btn-lg btn-outline-light rounded-pill px-4">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
