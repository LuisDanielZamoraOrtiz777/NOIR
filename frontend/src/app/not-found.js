import Link from "next/link";

export const metadata = {
  title: "Página no encontrada",
  description: "La página que buscas no existe o fue movida.",
};

export default function NotFound() {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 25%), linear-gradient(135deg, #06070b 0%, #151a2d 50%, #090b12 100%)",
      }}
    >
      <div className="text-center text-white" style={{ maxWidth: 520 }}>
        <p className="text-uppercase small tracking-wide mb-2" style={{ letterSpacing: "0.2em", color: "#a78bfa" }}>
          Error 404
        </p>
        <h1 className="display-4 fw-bold mb-3">Página no encontrada</h1>
        <p className="text-light-emphasis mb-4">
          La ruta que intentas abrir no existe, fue movida o ya no está disponible.
          Vuelve al inicio o explora nuestras secciones editoriales.
        </p>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <Link
            href="/"
            className="btn btn-lg rounded-pill border-0 px-4"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              color: "#fff",
            }}
          >
            Ir al inicio
          </Link>
          <Link href="/editoriales" className="btn btn-lg btn-outline-light rounded-pill px-4">
            Ver editoriales
          </Link>
          <Link href="/contacto" className="btn btn-lg btn-outline-secondary rounded-pill px-4">
            Contacto
          </Link>
        </div>
      </div>
    </div>
  );
}
