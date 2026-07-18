"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import RouteProtector from "@/components/RouteProtector";
import "bootstrap/dist/css/bootstrap.min.css";

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";
  if (!base) return "";
  const normalized = base.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
}

const API = getApiBase();

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : "";
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
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_rol");
        window.location.href = "/acceso";
        return;
      }
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
function TabContactos() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);
  const [ok, setOk]             = useState("");
  const [err, setErr]           = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/contactos`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_rol");
        window.location.href = "/acceso";
        return;
      }
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al cargar contactos");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <>
      <Alert msg={ok} type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger" onClose={() => setErr("")} />

      <div className="card border-0" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Mensajes de usuarios ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺ Actualizar"}</button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-light" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">No hay mensajes de usuarios.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead><tr>
                  <th className="text-muted fw-normal small">ID</th>
                  <th className="text-muted fw-normal small">Nombre</th>
                  <th className="text-muted fw-normal small">Email</th>
                  <th className="text-muted fw-normal small">Mensaje</th>
                  <th className="text-muted fw-normal small">Enviado</th>
                </tr></thead>
                <tbody>
                  {lista.map((m) => (
                    <tr key={m.id}>
                      <td className="text-muted small">{m.id}</td>
                      <td className="fw-medium" title={m.name}>{m.name || "—"}</td>
                      <td className="text-info small" title={m.email}>{m.email || "—"}</td>
                      <td className="text-break small" style={{ maxWidth: 380 }}>{m.message || "—"}</td>
                      <td className="text-muted small">{m.created_at ? new Date(m.created_at).toLocaleString("es-MX") : "—"}</td>
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
  const [tab, setTab]   = useState("usuarios");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) { router.push("/acceso"); return; }
    try { setUser(JSON.parse(localStorage.getItem("user_data") || "{}")); } catch {}
  }, [router]);

  const logout = async () => {
    if (!confirm("¿Cerrar sesión?")) return;
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("user_token") || ""}`,
        },
      });
    } catch {}
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("user_rol");
    router.push("/acceso");
  };

  return (
    <RouteProtector tokenKey="user_token" requiredRole={["administrador", "admin"]} redirectTo="/acceso">
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
              { key: "contactos", label: "💬 Contactos" },
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

          {tab === "partners"    && <TabPartners />}
          {tab === "usuarios"    && <TabUsuarios />}
          {tab === "contactos"   && <TabContactos />}
        </div>
      </div>
    </RouteProtector>
  );
}
