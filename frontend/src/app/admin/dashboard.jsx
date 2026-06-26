"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";

// ─── API DIRECTA al backend (bypass CORS) ─────────────────────────────────────
const API = "http://localhost:4000/api";

// ─── helpers ──────────────────────────────────────────────────────────────────
function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-MX", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return d; }
}

// ─── Alerta ───────────────────────────────────────────────────────────────────
function Alert({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type} alert-dismissible`} role="alert">
      {msg}
      <button type="button" className="btn-close" onClick={onClose} />
    </div>
  );
}

// ════════════════════════════════════════
//  TAB: PÁGINAS HERMANAS (PARTNERS)
// ════════════════════════════════════════
function TabPartners() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [actionId, setActionId] = useState(null);
  const [ok, setOk]             = useState("");
  const [err, setErr]           = useState("");
  const [form, setForm]         = useState({ nombre: "", url_api: "" });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/partners`, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error al cargar partners");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/admin/partners`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setOk(j.message || "Partner agregado"); setForm({ nombre: "", url_api: "" }); cargar();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (partner) => {
    setActionId(partner.id); setErr(""); setOk("");
    const url    = partner.activo ? `${API}/admin/partners/${partner.id}` : `${API}/admin/partners/${partner.id}/activar`;
    const method = partner.activo ? "DELETE" : "PATCH";
    try {
      const r = await fetch(url, { method, headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setOk(j.message); cargar();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  return (
    <>
      <Alert msg={ok}  type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger"  onClose={() => setErr("")} />

      {/* Formulario agregar */}
      <div className="card border-0 mb-4" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary">
          <h5 className="mb-0 text-white">Registrar nueva página hermana</h5>
        </div>
        <div className="card-body">
          <form onSubmit={agregar}>
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label text-light small">Nombre</label>
                <input
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Ej: Vogue España"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required disabled={saving}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label text-light small">URL</label>
                <input
                  type="url"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="https://..."
                  value={form.url_api}
                  onChange={(e) => setForm({ ...form, url_api: e.target.value })}
                  required disabled={saving}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-light w-100" disabled={saving}>
                  {saving ? "Guardando…" : "Agregar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla */}
      <div className="card border-0" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Páginas hermanas ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>
            {loading ? "…" : "↺ Actualizar"}
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-light" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">Sin partners registrados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead><tr>
                  <th className="text-muted fw-normal">ID</th>
                  <th className="text-muted fw-normal">Nombre</th>
                  <th className="text-muted fw-normal">URL</th>
                  <th className="text-muted fw-normal">Estado</th>
                  <th className="text-muted fw-normal">Creado</th>
                  <th className="text-muted fw-normal text-end">Acción</th>
                </tr></thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id}>
                      <td className="text-muted">{p.id}</td>
                      <td className="fw-medium">{p.nombre}</td>
                      <td>
                        <a href={p.url_api} target="_blank" rel="noreferrer" className="text-info text-decoration-none">
                          {p.url_api.length > 40 ? p.url_api.slice(0, 40) + "…" : p.url_api}
                        </a>
                      </td>
                      <td>
                        <span className={`badge ${p.activo ? "bg-success" : "bg-secondary"}`}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-muted small">{fmt(p.creado_en)}</td>
                      <td className="text-end">
                        <button
                          className={`btn btn-sm ${p.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                          onClick={() => toggle(p)}
                          disabled={actionId === p.id}
                        >
                          {actionId === p.id ? "…" : p.activo ? "Desactivar" : "Reactivar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════
//  TAB: EDITORIALES
// ════════════════════════════════════════
const FORM_VACIO = {
  titulo: "", autor: "", fecha: "", categoria: "Editorial",
  resumen: "", contenido: "", publicado: false,
};

function TabEditoriales() {
  const [lista, setLista]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [actionId, setActionId]     = useState(null);
  const [ok, setOk]                 = useState("");
  const [err, setErr]               = useState("");
  const [form, setForm]             = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/editoriales`, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error al cargar editoriales");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const iniciarEdicion = (ed) => {
    setEditandoId(ed.id);
    setForm({
      titulo: ed.titulo, autor: ed.autor, fecha: ed.fecha,
      categoria: ed.categoria, resumen: ed.resumen,
      contenido: ed.contenido || "", publicado: ed.publicado,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelar = () => { setEditandoId(null); setForm(FORM_VACIO); };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(""); setOk("");
    const url    = editandoId ? `${API}/admin/editoriales/${editandoId}` : `${API}/admin/editoriales`;
    const method = editandoId ? "PATCH" : "POST";
    try {
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setOk(j.message); cancelar(); cargar();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta editorial?")) return;
    setActionId(id); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/admin/editoriales/${id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setOk(j.message); cargar();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const f = (key) => ({
    value: form[key] || "",
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <>
      <Alert msg={ok}  type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger"  onClose={() => setErr("")} />

      {/* Formulario crear / editar */}
      <div className="card border-0 mb-4" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">
            {editandoId ? `✏️ Editando: ${form.titulo || "…"}` : "➕ Nueva editorial"}
          </h5>
          {editandoId && (
            <button className="btn btn-sm btn-outline-secondary" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </div>
        <div className="card-body">
          <form onSubmit={guardar}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-light small">Título *</label>
                <input className="form-control bg-dark text-white border-secondary"
                  placeholder="Título de la editorial" {...f("titulo")} required disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-light small">Autor</label>
                <input className="form-control bg-dark text-white border-secondary"
                  placeholder="Nombre del autor" {...f("autor")} disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-light small">Categoría</label>
                <select className="form-select bg-dark text-white border-secondary" {...f("categoria")} disabled={saving}>
                  {["Editorial", "Pasarela", "Trend", "Tendencia", "Colaboración", "Opinión"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label text-light small">Fecha</label>
                <input type="date" className="form-control bg-dark text-white border-secondary"
                  {...f("fecha")} disabled={saving} />
              </div>
              <div className="col-md-8">
                <label className="form-label text-light small">Resumen *</label>
                <input className="form-control bg-dark text-white border-secondary"
                  placeholder="Descripción breve visible en la tarjeta" {...f("resumen")} required disabled={saving} />
              </div>
              <div className="col-12">
                <label className="form-label text-light small">Contenido</label>
                <textarea rows={4} className="form-control bg-dark text-white border-secondary"
                  placeholder="Texto completo de la editorial…" {...f("contenido")} disabled={saving} />
              </div>
              <div className="col-12">
                <label className="form-label text-light small">URL de Imagen (opcional)</label>
                <input type="url" className="form-control bg-dark text-white border-secondary"
                  placeholder="https://ejemplo.com/imagen.jpg" {...f("imagen_url")} disabled={saving} />
              </div>
              <div className="col-12 d-flex align-items-center gap-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input" type="checkbox" id="publicado"
                    checked={form.publicado}
                    onChange={(e) => setForm({ ...form, publicado: e.target.checked })}
                    disabled={saving}
                  />
                  <label className="form-check-label text-light" htmlFor="publicado">
                    Publicada (visible en el sitio)
                  </label>
                </div>
                <button type="submit" className="btn btn-light px-4" disabled={saving}>
                  {saving ? "Guardando…" : editandoId ? "Guardar cambios" : "Crear editorial"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Lista */}
      <div className="card border-0" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Editoriales ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>
            {loading ? "…" : "↺ Actualizar"}
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-light" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">Sin editoriales. Crea la primera arriba.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead><tr>
                  <th className="text-muted fw-normal">Título</th>
                  <th className="text-muted fw-normal">Autor</th>
                  <th className="text-muted fw-normal">Categoría</th>
                  <th className="text-muted fw-normal">Fecha</th>
                  <th className="text-muted fw-normal">Estado</th>
                  <th className="text-muted fw-normal text-end">Acciones</th>
                </tr></thead>
                <tbody>
                  {lista.map((ed) => (
                    <tr key={ed.id}>
                      <td className="fw-medium" style={{ maxWidth: 220 }}>
                        <span title={ed.titulo}>
                          {ed.titulo.length > 35 ? ed.titulo.slice(0, 35) + "…" : ed.titulo}
                        </span>
                      </td>
                      <td className="text-muted small">{ed.autor || "—"}</td>
                      <td><span className="badge bg-secondary">{ed.categoria}</span></td>
                      <td className="text-muted small">{fmt(ed.fecha)}</td>
                      <td>
                        <span className={`badge ${ed.publicado ? "bg-success" : "bg-warning text-dark"}`}>
                          {ed.publicado ? "Publicada" : "Borrador"}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-light me-2"
                          onClick={() => iniciarEdicion(ed)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminar(ed.id)}
                          disabled={actionId === ed.id}
                        >
                          {actionId === ed.id ? "…" : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════
//  DASHBOARD PRINCIPAL
// ════════════════════════════════════════
export default function AdminDashboard() {
  const router        = useRouter();
  const [tab, setTab] = useState("editoriales");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { router.push("/admin/login"); return; }
    const u = localStorage.getItem("admin_user");
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
  }, [router]);

  const logout = () => {
    if (confirm("¿Cerrar sesión?")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-vh-100 bg-dark text-light py-4">
      <div className="container-fluid" style={{ maxWidth: 1200 }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <div>
            <h1 className="h3 fw-bold text-white mb-0">Panel de Administración</h1>
            <p className="text-muted small mb-0">Noir Atelier · Gestión de contenido</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            {user && <span className="text-muted small">{user.email}</span>}
            <button className="btn btn-sm btn-outline-danger" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Pestañas */}
        <ul className="nav nav-tabs mb-4 border-secondary">
          {[
            { key: "editoriales", label: "📝 Editoriales" },
            { key: "partners",    label: "🔗 Páginas hermanas" },
          ].map(({ key, label }) => (
            <li className="nav-item" key={key}>
              <button
                className={`nav-link ${tab === key
                  ? "active bg-dark text-white border-secondary border-bottom-0"
                  : "text-muted border-0 bg-transparent"}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {tab === "editoriales" && <TabEditoriales />}
        {tab === "partners"    && <TabPartners />}
      </div>
    </div>
  );
}
