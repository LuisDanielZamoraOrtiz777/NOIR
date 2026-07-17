"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import RouteProtector from "@/components/RouteProtector";
import "bootstrap/dist/css/bootstrap.min.css";

const API = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
}

function isValidPublicUrl(url) {
  return typeof url === "string" && /^(https?:\/\/)/i.test(url.trim());
}

function notifyEditorialChange() {
  if (typeof window === "undefined") return;
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("noir-editoriales");
    channel.postMessage({ type: "editoriales-updated" });
    channel.close();
    return;
  }
  window.localStorage.setItem("noir-editoriales-refresh", Date.now().toString());
}

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
//  TAB: PÁGINAS HERMANAS
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
      const r = await fetch(`${API}/api/admin/partners`, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al cargar partners");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/partners`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk("Partner agregado exitosamente"); setForm({ nombre: "", url_api: "" }); cargar();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (partner) => {
    setActionId(partner.id); setErr(""); setOk("");
    const method = partner.activo ? "DELETE" : "PATCH";
    const url = partner.activo
      ? `${API}/api/admin/partners/${partner.id}`
      : `${API}/api/admin/partners/${partner.id}/activar`;
    try {
      const r = await fetch(url, { method, headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al actualizar partner");
      setOk(j.message || "Estado de partner actualizado exitosamente ✓");
      cargar();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  return (
    <>
      <Alert msg={ok} type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger" onClose={() => setErr("")} />

      <div className="card border-0 mb-4" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary">
          <h5 className="mb-0 text-white">Registrar nueva página hermana</h5>
        </div>
        <div className="card-body">
          <form onSubmit={agregar}>
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label text-light small">Nombre *</label>
                <input className="form-control bg-dark text-white border-secondary" placeholder="Ej: Vogue España"
                  value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required disabled={saving} />
              </div>
              <div className="col-md-5">
                <label className="form-label text-light small">URL *</label>
                <input type="url" className="form-control bg-dark text-white border-secondary" placeholder="https://..."
                  value={form.url_api} onChange={(e) => setForm({ ...form, url_api: e.target.value })} required disabled={saving} />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-light w-100" disabled={saving}>{saving ? "…" : "Agregar"}</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Páginas hermanas ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺"}</button>
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
                  <th className="text-muted fw-normal small">ID</th>
                  <th className="text-muted fw-normal small">Nombre</th>
                  <th className="text-muted fw-normal small">URL</th>
                  <th className="text-muted fw-normal small">Estado</th>
                  <th className="text-muted fw-normal small">Registrado</th>
                  <th className="text-muted fw-normal small text-end">Acción</th>
                </tr></thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id}>
                      <td className="text-muted small">{p.id}</td>
                      <td className="fw-medium">{p.nombre}</td>
                      <td><a href={p.url_api} target="_blank" rel="noreferrer" className="text-info text-decoration-none small">
                        {p.url_api.length > 35 ? p.url_api.slice(0, 35) + "…" : p.url_api}
                      </a></td>
                      <td><span className={`badge ${p.activo ? "bg-success" : "bg-secondary"}`}>{p.activo ? "Activo" : "Inactivo"}</span></td>
                      <td className="text-muted small">{fmt(p.creado_en)}</td>
                      <td className="text-end">
                        <button className={`btn btn-sm ${p.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                          onClick={() => toggle(p)} disabled={actionId === p.id}>
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
const VACIO = { titulo: "", autor: "", fecha: "", categoria: "Editorial", resumen: "", contenido: "", imagen_url: "", publicado: false };

function TabEditoriales() {
  const [lista, setLista]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [setting, setSetting]       = useState(false);
  const [actionId, setActionId]     = useState(null);
  const [ok, setOk]                 = useState("");
  const [err, setErr]               = useState("");
  const [form, setForm]             = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [tablaFalta, setTablaFalta] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true); setTablaFalta(false);
    try {
      const r = await fetch(`${API}/api/admin/editoriales`, { headers: authHeaders(), cache: "no-store" });
      const j = await r.json();
      if (r.status === 503 || j.error?.includes("no existe")) { setTablaFalta(true); setLista([]); return; }
      if (!r.ok) throw new Error(j.error || "Error al cargar editoriales");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Crear tabla + seed automáticamente
  const runSetup = async () => {
    setSetting(true); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/setup`, { headers: authHeaders(), cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error en setup");
      setOk(j.log?.join(" | ") || "Setup completado");
      cargar();
    } catch (e) { setErr(e.message); }
    finally { setSetting(false); }
  };

  const iniciarEdicion = (ed) => {
    setEditandoId(ed.id);
    setForm({
      titulo: ed.titulo || "",
      autor: ed.autor || "",
      fecha: ed.fecha ? ed.fecha.slice(0, 10) : "",
      categoria: ed.categoria || "Editorial",
      resumen: ed.resumen || "",
      contenido: ed.contenido || "",
      imagen_url: ed.imagen_url || "",
      publicado: Boolean(ed.publicado),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelar = () => { setEditandoId(null); setForm(VACIO); };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(""); setOk("");
    const url    = editandoId ? `${API}/api/admin/editoriales/${editandoId}` : `${API}/api/admin/editoriales`;
    const method = editandoId ? "PATCH" : "POST";
    try {
      const payload = {
        titulo: form.titulo?.trim(),
        autor: form.autor?.trim() || "Equipo Editorial Noir",
        fecha: form.fecha || new Date().toISOString().slice(0, 10),
        categoria: form.categoria?.trim() || "Editorial",
        resumen: form.resumen?.trim(),
        contenido: form.contenido?.trim() || "",
        imagen_url: form.imagen_url?.trim() || null,
        publicado: Boolean(form.publicado),
      };

      if (payload.imagen_url && !isValidPublicUrl(payload.imagen_url)) {
        throw new Error("La imagen debe ser una URL pública válida.");
      }

      console.log("Payload editorial:", payload);

      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload), cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk(j.message || (editandoId ? "Editorial actualizada ✓" : "Editorial creada ✓"));
      cancelar(); cargar();
      notifyEditorialChange();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta editorial permanentemente?")) return;
    setActionId(id); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/editoriales/${id}`, { method: "DELETE", headers: authHeaders(), cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk(j.message || "Editorial eliminada ✓"); cargar();
      notifyEditorialChange();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const campo = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <>
      <Alert msg={ok}  type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger"  onClose={() => setErr("")} />

      {/* Banner: tabla no existe */}
      {tablaFalta && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between gap-3">
          <div>
            <strong>⚠️ La tabla &quot;editoriales&quot; no existe en la base de datos.</strong><br/>
            <span className="small">Haz clic en el botón para crearla y cargar las editoriales de ejemplo.</span>
          </div>
          <button className="btn btn-warning fw-bold flex-shrink-0" onClick={runSetup} disabled={setting}>
            {setting ? "Creando tabla…" : "🛠 Crear tabla y cargar datos"}
          </button>
        </div>
      )}

      {/* Formulario crear / editar */}
      <div className="card border-0 mb-4" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">{editandoId ? `✏️ Editando: ${form.titulo || "…"}` : "➕ Nueva editorial"}</h5>
          {editandoId && <button className="btn btn-sm btn-outline-secondary" onClick={cancelar}>Cancelar</button>}
        </div>
        <div className="card-body">
          <form onSubmit={guardar}>
            <div className="row g-3">
              <div className="col-md-7">
                <label className="form-label text-light small">Título *</label>
                <input className="form-control bg-dark text-white border-secondary" placeholder="Título de la editorial"
                  {...campo("titulo")} required disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-light small">Autor</label>
                <input className="form-control bg-dark text-white border-secondary" placeholder="Nombre del autor"
                  {...campo("autor")} disabled={saving} />
              </div>
              <div className="col-md-2">
                <label className="form-label text-light small">Categoría</label>
                <select className="form-select bg-dark text-white border-secondary" {...campo("categoria")} disabled={saving}>
                  {["Editorial","Pasarela","Trend","Tendencia","Colaboración","Opinión"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-light small">Fecha</label>
                <input type="date" className="form-control bg-dark text-white border-secondary" {...campo("fecha")} disabled={saving} />
              </div>
              <div className="col-md-9">
                <label className="form-label text-light small">Resumen * <span className="text-muted">(visible en tarjeta)</span></label>
                <input className="form-control bg-dark text-white border-secondary" placeholder="Descripción breve…"
                  {...campo("resumen")} required disabled={saving} />
              </div>
              <div className="col-12">
                <label className="form-label text-light small">URL de imagen <span className="text-muted">(opcional)</span></label>
                <input type="url" className="form-control bg-dark text-white border-secondary"
                  placeholder="https://images.unsplash.com/..." {...campo("imagen_url")} disabled={saving} />
                {!isValidPublicUrl(form.imagen_url) && form.imagen_url ? (
                  <p className="form-text text-warning small mt-2">
                    La imagen debe ser una URL pública válida (https://...).
                  </p>
                ) : null}
              </div>
              <div className="col-12">
                <label className="form-label text-light small">Contenido completo</label>
                <textarea rows={4} className="form-control bg-dark text-white border-secondary"
                  placeholder="Texto completo de la editorial…" {...campo("contenido")} disabled={saving} />
              </div>
              <div className="col-12 d-flex align-items-center gap-3 flex-wrap">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="publicado"
                    checked={Boolean(form.publicado)} onChange={(e) => setForm({ ...form, publicado: e.target.checked })} disabled={saving} />
                  <label className="form-check-label text-light" htmlFor="publicado">Publicada (visible en el sitio)</label>
                </div>
                <button type="submit" className="btn btn-light px-4" disabled={saving || tablaFalta}>
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
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺ Actualizar"}</button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-light" /></div>
          ) : lista.length === 0 && !tablaFalta ? (
            <p className="text-muted text-center py-4">Sin editoriales. Crea la primera arriba.</p>
          ) : !tablaFalta && (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead><tr>
                  <th className="text-muted fw-normal small">Título</th>
                  <th className="text-muted fw-normal small">Autor</th>
                  <th className="text-muted fw-normal small">Categoría</th>
                  <th className="text-muted fw-normal small">Fecha</th>
                  <th className="text-muted fw-normal small">Img</th>
                  <th className="text-muted fw-normal small">Estado</th>
                  <th className="text-muted fw-normal small text-end">Acciones</th>
                </tr></thead>
                <tbody>
                  {lista.map((ed) => (
                    <tr key={ed.id}>
                      <td className="fw-medium" style={{ maxWidth: 200 }} title={ed.titulo}>
                        {ed.titulo?.length > 30 ? ed.titulo.slice(0, 30) + "…" : ed.titulo}
                      </td>
                      <td className="text-muted small">{ed.autor || "—"}</td>
                      <td><span className="badge bg-secondary">{ed.categoria}</span></td>
                      <td className="text-muted small">{fmt(ed.fecha)}</td>
                      <td>{ed.imagen_url ? <span className="badge bg-success">✓</span> : <span className="text-muted">—</span>}</td>
                      <td><span className={`badge ${ed.publicado ? "bg-success" : "bg-warning text-dark"}`}>
                        {ed.publicado ? "Publicada" : "Borrador"}
                      </span></td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-light me-2" onClick={() => iniciarEdicion(ed)}>Editar</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(ed.id)} disabled={actionId === ed.id}>
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
//  TAB: USUARIOS
// ════════════════════════════════════════
function TabUsuarios() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);
  const [ok, setOk]             = useState("");
  const [err, setErr]           = useState("");
  const [cambiandoId, setCambiandoId] = useState(null);
  const [nuevoRol, setNuevoRol] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/usuarios`, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al cargar usuarios");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarRol = async (usuario) => {
    setCambiandoId(usuario.id); setErr(""); setOk("");
    const rolSeleccionado = nuevoRol[usuario.id] || usuario.rol || "usuario";
    try {
      const r = await fetch(`${API}/api/admin/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ rol: rolSeleccionado }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al actualizar rol");
      setOk(`Rol actualizado para ${usuario.email} ✓`);
      
      // Limpiar el estado de nuevoRol para este usuario
      const nuevoEstado = { ...nuevoRol };
      delete nuevoEstado[usuario.id];
      setNuevoRol(nuevoEstado);
      
      // Actualizar la lista de usuarios inmediatamente
      cargar();
    } catch (e) { setErr(e.message); }
    finally { setCambiandoId(null); }
  };

  const eliminar = async (id, email) => {
    if (!confirm(`¿Eliminar usuario ${email} permanentemente?`)) return;
    setActionId(id); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/usuarios/${id}`, { method: "DELETE", headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk(j.message || "Usuario eliminado ✓"); cargar();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const getRolBadge = (rol) => {
    const colors = {
      administrador: "bg-danger",
      editor: "bg-warning text-dark",
      usuario: "bg-info text-dark",
    };
    const label = rol || "sin rol";
    return <span className={`badge ${colors[rol] || "bg-secondary"}`}>{label}</span>;
  };

  return (
    <>
      <Alert msg={ok} type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger" onClose={() => setErr("")} />

      <div className="card border-0" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Usuarios registrados ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺ Actualizar"}</button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-light" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">Sin usuarios registrados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead><tr>
                  <th className="text-muted fw-normal small">ID</th>
                  <th className="text-muted fw-normal small">Email</th>
                  <th className="text-muted fw-normal small">Rol</th>
                  <th className="text-muted fw-normal small">Registrado</th>
                  <th className="text-muted fw-normal small text-end">Acciones</th>
                </tr></thead>
                <tbody>
                  {lista.map((u) => (
                    <tr key={u.id}>
                      <td className="text-muted small">{u.id}</td>
                      <td className="fw-medium">{u.email}</td>
                      <td>{getRolBadge(u.rol)}</td>
                      <td className="text-muted small">{fmt(u.creado_en)}</td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end align-items-center">
                          <select
                            className="form-select form-select-sm bg-dark text-white border-secondary"
                            style={{ width: "auto", minWidth: 140 }}
                            value={nuevoRol[u.id] || u.rol || "usuario"}
                            onChange={(e) => setNuevoRol({ ...nuevoRol, [u.id]: e.target.value })}
                            disabled={cambiandoId === u.id}
                          >
                            <option value="administrador">administrador</option>
                            <option value="editor">editor</option>
                            <option value="usuario">usuario</option>
                          </select>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => cambiarRol(u)} disabled={cambiandoId === u.id}>
                            {cambiandoId === u.id ? "…" : "Cambiar"}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(u.id, u.email)} disabled={actionId === u.id}>
                            {actionId === u.id ? "…" : "Eliminar"}
                          </button>
                        </div>
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
//  TAB: SESIONES
// ════════════════════════════════════════
function TabSesiones() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);
  const [ok, setOk]             = useState("");
  const [err, setErr]           = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/sesiones`, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al cargar sesiones");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const revocar = async (sessionId) => {
    if (!confirm("¿Revocar esta sesión? El usuario deberá iniciar sesión nuevamente.")) return;
    setActionId(sessionId); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/sesiones/${sessionId}`, { method: "DELETE", headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al revocar sesión");
      setOk("Sesión revocada exitosamente ✓"); cargar();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const getEstadoBadge = (activa) => {
    return <span className={`badge ${activa ? "bg-success" : "bg-secondary"}`}>{activa ? "Activa" : "Revocada"}</span>;
  };

  return (
    <>
      <Alert msg={ok} type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger" onClose={() => setErr("")} />

      <div className="card border-0" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Sesiones activas ({lista.filter(s => s.activa).length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺ Actualizar"}</button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-light" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">Sin sesiones registradas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead><tr>
                  <th className="text-muted fw-normal small">ID</th>
                  <th className="text-muted fw-normal small">Usuario</th>
                  <th className="text-muted fw-normal small">Token (hash)</th>
                  <th className="text-muted fw-normal small">Estado</th>
                  <th className="text-muted fw-normal small">Expira</th>
                  <th className="text-muted fw-normal small">Creada</th>
                  <th className="text-muted fw-normal small text-end">Acción</th>
                </tr></thead>
                <tbody>
                  {lista.map((s) => (
                    <tr key={s.id}>
                      <td className="text-muted small">{s.id}</td>
                      <td className="fw-medium">{s.email || "—"}</td>
                      <td className="text-muted small font-monospace" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }} title={s.token_hash}>
                        {s.token_hash?.slice(0, 16) || "—"}…
                      </td>
                      <td>{getEstadoBadge(s.activa)}</td>
                      <td className="text-muted small">{s.expires_at ? new Date(s.expires_at).toLocaleString("es-MX") : "—"}</td>
                      <td className="text-muted small">{fmt(s.creado_en)}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => revocar(s.id)} disabled={actionId === s.id || !s.activa}>
                          {actionId === s.id ? "…" : "Revocar"}
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
  const router          = useRouter();
  const [tab, setTab]   = useState("editoriales");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { router.push("/admin/login"); return; }
    try { setUser(JSON.parse(localStorage.getItem("admin_user") || "{}")); } catch {}
  }, [router]);

  const logout = async () => {
    if (!confirm("¿Cerrar sesión?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" } });
    } catch {}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  return (
    <RouteProtector tokenKey="admin_token" redirectTo="/admin/login">
      <div className="min-vh-100 bg-dark text-light py-4">
        <div className="container-fluid" style={{ maxWidth: 1200 }}>
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
            <div>
              <h1 className="h3 fw-bold text-white mb-0">Panel de Administración</h1>
              <p className="text-muted small mb-0">Noir Atelier · Gestión de contenido</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              {user?.email && <span className="text-muted small">{user.email}</span>}
              <button className="btn btn-sm btn-outline-danger" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>

          <ul className="nav nav-tabs mb-4 border-secondary">
            {[
              { key: "usuarios", label: "👥 Usuarios" },
              { key: "sesiones", label: "🔑 Sesiones" },
              { key: "editoriales", label: "📝 Editoriales" },
              { key: "partners", label: "🔗 Páginas hermanas" },
            ].map(({ key, label }) => (
              <li className="nav-item" key={key}>
                <button
                  className={`nav-link ${tab === key ? "active bg-dark text-white border-secondary border-bottom-0" : "text-muted border-0 bg-transparent"}`}
                  onClick={() => setTab(key)}
                >{label}</button>
              </li>
            ))}
          </ul>

          {tab === "editoriales" && <TabEditoriales />}
          {tab === "partners"    && <TabPartners />}
          {tab === "usuarios"    && <TabUsuarios />}
          {tab === "sesiones"    && <TabSesiones />}
        </div>
      </div>
    </RouteProtector>
  );
}
