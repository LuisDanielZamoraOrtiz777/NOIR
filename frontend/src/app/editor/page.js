"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EditorialesManager from "@/components/EditorialesManager";

export default function EditorPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = JSON.parse(localStorage.getItem("user_data") || "{}");
      setUser(stored);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <div className="min-vh-100 bg-dark text-light py-5">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="text-center mb-5">
          <p className="text-uppercase small mb-2" style={{ letterSpacing: "0.15em", color: "#facc15" }}>
            Área exclusiva para editores
          </p>
          <h1 className="fw-bold">Panel de Editor</h1>
          <p className="text-muted mb-0">
            Esta sección está reservada para usuarios con rol <strong>editor</strong>. Si no tienes acceso, solicita el rol en tu perfil.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 h-100" style={{ background: "#151515" }}>
              <div className="card-body">
                <h2 className="h5 text-white mb-3">Tu perfil editorial</h2>
                <p className="text-muted mb-3">
                  Accede a enlaces y recursos pensados para tu rol. Aquí puedes ver tu información de sesión y navegar directamente a contenido relevante.
                </p>
                <dl className="row text-light-emphasis">
                  <dt className="col-4">Nombre</dt>
                  <dd className="col-8">{user?.nombre || "—"}</dd>
                  <dt className="col-4">Email</dt>
                  <dd className="col-8">{user?.email || "—"}</dd>
                  <dt className="col-4">Rol</dt>
                  <dd className="col-8">{user?.rol || "editor"}</dd>
                </dl>
                <div className="d-flex flex-wrap gap-2">
                  <Link href="/perfil" className="btn btn-sm btn-outline-light">
                    Mi perfil
                  </Link>
                  <Link href="/editoriales" className="btn btn-sm btn-light">
                    Ver editoriales
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 h-100" style={{ background: "#151515" }}>
              <div className="card-body">
                <h2 className="h5 text-white mb-3">Recursos del editor</h2>
                <ul className="list-unstyled text-light-emphasis mb-4">
                  <li>• Consulta las últimas editoriales publicadas.</li>
                  <li>• Revisa las propuestas de colaboración.</li>
                  <li>• Solicita soporte editorial desde tu perfil.</li>
                </ul>
                <p className="text-muted">
                  Si necesitas ampliar tus permisos, contacta al administrador para que te asignen el rol adecuado.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Link href="/contacto" className="btn btn-sm btn-outline-info">
                    Contactar soporte
                  </Link>
                  <Link href="/acceso" className="btn btn-sm btn-outline-light">
                    Cambiar cuenta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="card border-0" style={{ background: "#111111" }}>
            <div className="card-body">
              <h2 className="h5 text-white mb-3">¿Eres un editor y necesitas más herramientas?</h2>
              <p className="text-muted mb-3">
                El rol <strong>editor</strong> está pensado para acceso restringido al contenido editorial sin permisos administrativos. Si necesitas ayuda para crear o publicar editoriales, coordina con el equipo administrativo.
              </p>
              <Link href="/editoriales" className="btn btn-sm btn-light me-2">
                Explorar editoriales</Link>
              <Link href="/contacto" className="btn btn-sm btn-outline-light">
                Solicitar apoyo</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <EditorialesManager />
      </div>
