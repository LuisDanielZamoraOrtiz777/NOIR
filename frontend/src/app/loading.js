export default function Loading() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div className="text-center">
        <div className="spinner-border text-light mb-3" role="status" style={{ width: 48, height: 48 }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted small">Cargando contenido...</p>
      </div>
    </div>
  );
}