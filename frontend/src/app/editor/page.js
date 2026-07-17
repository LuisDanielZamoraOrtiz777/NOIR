"use client";

import { useState } from "react";

export default function EditorPage() {
  const [form, setForm] = useState({ nombre: "", email: "", tipo: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-light">
        <div className="text-center">
          <h1 className="mb-3">Solicitud enviada</h1>
          <p>Nos pondremos en contacto contigo pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark text-light py-5">
      <div className="container" style={{ maxWidth: 600 }}>
        <div className="text-center mb-5">
          <h1 className="fw-bold">Editor</h1>
          <p className="text-muted">Formulario para colaboradores editoriales</p>
        </div>

        <div className="card border-0" style={{ background: "#1a1a1a" }}>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-light">Nombre completo *</label>
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-light">Correo electrónico *</label>
                <input
                  type="email"
                  className="form-control bg-dark text-white border-secondary"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-light">Tipo de colaboración *</label>
                <select
                  className="form-select bg-dark text-white border-secondary"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="articulo">Artículo</option>
                  <option value="editorial">Editorial</option>
                  <option value="columna">Columna</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label text-light">Mensaje o propuesta *</label>
                <textarea
                  className="form-control bg-dark text-white border-secondary"
                  rows="6"
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-light w-100">
                Enviar solicitud
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}