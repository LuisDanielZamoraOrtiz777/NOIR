// /admin/os-accounts — Administración de cuentas de Sistema Operativo
// Página para practicar: crear, modificar, deshabilitar, habilitar y
// eliminar cuentas locales. Cumple los requisitos de la práctica.
"use client";

import { useState, useEffect, useCallback } from "react";
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
  try { return new Date(d).toLocaleString("es-MX"); } catch { return d; }
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

// ════════════════════════════════════════════════════════════════
//  TAB: CUENTAS (usuarios de SO)
// ════════════════════════════════════════════════════════════════
function TabCuentas({ grupos, onChanged }) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    description: "",
    groups: ["Usuarios"],
    must_change_password: true,
  });
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/os/users`, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const crear = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/os/users`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk(`Cuenta '${form.username}' creada ✓`);
      setForm({ username: "", full_name: "", description: "", groups: ["Usuarios"], must_change_password: true });
      cargar(); onChanged?.();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const toggleEnable = async (u) => {
    setActionId(u.id); setErr(""); setOk("");
    const endpoint = u.enabled ? "disable" : "enable";
    try {
      const r = await fetch(`${API}/api/admin/os/users/${u.id}/${endpoint}`, {
        method: "POST", headers: authHeaders(),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk(j.message || "Estado actualizado ✓");
      cargar(); onChanged?.();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar la cuenta '${u.username}'? La información NO se podrá recuperar.`)) return;
    setActionId(u.id); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/os/users/${u.id}`, { method: "DELETE", headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk(j.message || "Cuenta eliminada ✓");
      cargar(); onChanged?.();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const resetPwd = async (u) => {
    if (!confirm(`¿Restablecer la contraseña de '${u.username}' al valor por defecto?`)) return;
    setActionId(u.id); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/os/users/${u.id}/reset-password`, {
        method: "POST", headers: authHeaders(),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk(j.message || "Contraseña restablecida ✓");
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const iniciarEdicion = (u) => {
    setEditId(u.id);
    setEditForm({
      full_name: u.full_name || "",
      description: u.description || "",
      must_change_password: !!u.must_change_password,
      groups: Array.isArray(u.grupos) ? u.grupos : [],
    });
  };

  const guardarEdicion = async () => {
    setActionId(editId); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/os/users/${editId}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(editForm),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk(`Cuenta actualizada ✓`);
      setEditId(null);
      cargar(); onChanged?.();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const toggleGroupInForm = (groupName) => {
    setForm((f) => ({
      ...f,
      groups: f.groups.includes(groupName)
        ? f.groups.filter((g) => g !== groupName)
        : [...f.groups, groupName],
    }));
  };
  const toggleGroupInEdit = (groupName) => {
    setEditForm((f) => ({
      ...f,
      groups: f.groups.includes(groupName)
        ? f.groups.filter((g) => g !== groupName)
        : [...f.groups, groupName],
    }));
  };

  return (
    <>
      <Alert msg={ok} type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger" onClose={() => setErr("")} />

      <div className="card border-0 mb-4" style={{ background: "#ffffff" }}>
        <div className="card-header border-bottom">
          <h5 className="mb-0 text-dark">Crear cuenta de SO</h5>
        </div>
        <div className="card-body">
          <form onSubmit={crear}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label text-muted small">Username *</label>
                <input className="form-control admin-form-control"
                  placeholder="ej. alumno3" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required disabled={saving} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted small">Nombre completo *</label>
                <input className="form-control admin-form-control"
                  placeholder="ej. Alumno Tres" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required disabled={saving} />
              </div>
              <div className="col-md-5">
                <label className="form-label text-muted small">Descripción</label>
                <input className="form-control admin-form-control"
                  placeholder="Comentario o área" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={saving} />
              </div>

              <div className="col-md-8">
                <label className="form-label text-muted small">Grupos</label>
                <div className="d-flex flex-wrap gap-3">
                  {grupos.map((g) => (
                    <label key={g.id} className="form-check-label text-muted small">
                      <input type="checkbox" className="form-check-input me-2"
                        checked={form.groups.includes(g.nombre)}
                        onChange={() => toggleGroupInForm(g.nombre)} />
                      {g.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check">
                  <input id="mcp" type="checkbox" className="form-check-input"
                    checked={form.must_change_password}
                    onChange={(e) => setForm({ ...form, must_change_password: e.target.checked })} />
                  <label htmlFor="mcp" className="form-check-label text-muted small">
                    Requiere cambio de contraseña
                  </label>
                </div>
              </div>

              <div className="col-12">
                <button className="btn btn-light" disabled={saving}>
                  {saving ? "Creando…" : "Crear cuenta (contraseña por defecto: P@ssw0rd2026)"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0" style={{ background: "#ffffff" }}>
        <div className="card-header border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-dark">Cuentas registradas ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>
            {loading ? "…" : "↺ Actualizar"}
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-dark" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">Sin cuentas registradas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="text-muted fw-normal small">Username</th>
                    <th className="text-muted fw-normal small">Nombre completo</th>
                    <th className="text-muted fw-normal small">Estado</th>
                    <th className="text-muted fw-normal small">Grupos</th>
                    <th className="text-muted fw-normal small">Creado</th>
                    <th className="text-muted fw-normal small">Último login</th>
                    <th className="text-muted fw-normal small">Cambio pwd</th>
                    <th className="text-muted fw-normal small text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((u) => (
                    <tr key={u.id}>
                      <td className="fw-medium">{u.username}</td>
                      <td>
                        {editId === u.id ? (
                          <input className="form-control form-control-sm admin-form-control"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                        ) : (u.full_name || "—")}
                      </td>
                      <td>
                        {u.enabled
                          ? <span className="badge bg-success">Habilitado</span>
                          : <span className="badge bg-secondary">Deshabilitado</span>}
                      </td>
                      <td>
                        {editId === u.id ? (
                          <div className="d-flex flex-column gap-1">
                            {grupos.map((g) => (
                              <label key={g.id} className="form-check-label text-muted small">
                                <input type="checkbox" className="form-check-input me-2"
                                  checked={editForm.groups.includes(g.nombre)}
                                  onChange={() => toggleGroupInEdit(g.nombre)} />
                                {g.nombre}
                              </label>
                            ))}
                            <div className="form-check mt-1">
                              <input type="checkbox" className="form-check-input"
                                id={`mcp-${u.id}`}
                                checked={editForm.must_change_password}
                                onChange={(e) => setEditForm({ ...editForm, must_change_password: e.target.checked })} />
                              <label htmlFor={`mcp-${u.id}`} className="form-check-label small">Requiere cambio</label>
                            </div>
                          </div>
                        ) : (
                          <div className="d-flex flex-wrap gap-1">
                            {(u.grupos || []).map((g) => (
                              <span key={g} className="badge bg-info text-dark">{g}</span>
                            ))}
                            {u.must_change_password && (
                              <span className="badge bg-warning text-dark">Cambio pwd</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="text-muted small">{fmt(u.created_at)}</td>
                      <td className="text-muted small">{fmt(u.last_login_at)}</td>
                      <td className="text-muted small">{fmt(u.password_changed_at)}</td>
                      <td className="text-end">
                        {editId === u.id ? (
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-outline-success" onClick={guardarEdicion} disabled={actionId === u.id}>
                              Guardar
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditId(null)}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex gap-2 justify-content-end flex-wrap">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => iniciarEdicion(u)}>
                              Modificar
                            </button>
                            <button
                              className={`btn btn-sm ${u.enabled ? "btn-outline-warning" : "btn-outline-success"}`}
                              onClick={() => toggleEnable(u)} disabled={actionId === u.id}
                              title={u.enabled ? "Deshabilitar la cuenta" : "Habilitar la cuenta"}>
                              {u.enabled ? "Deshabilitar" : "Habilitar"}
                            </button>
                            <button className="btn btn-sm btn-outline-info" onClick={() => resetPwd(u)} disabled={actionId === u.id}>
                              Reset pwd
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(u)} disabled={actionId === u.id}>
                              Eliminar
                            </button>
                          </div>
                        )}
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

// ════════════════════════════════════════════════════════════════
//  TAB: BITÁCORA
// ════════════════════════════════════════════════════════════════
function TabBitacora() {
  const [audit, setAudit] = useState([]);
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [a, l] = await Promise.all([
        fetch(`${API}/api/admin/os/audit`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API}/api/admin/os/login-attempts`, { headers: authHeaders() }).then((r) => r.json()),
      ]);
      setAudit(a.data || []);
      setLogins(l.data || []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <>
      <div className="card border-0 mb-4" style={{ background: "#ffffff" }}>
        <div className="card-header border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-dark">Cambios sobre cuentas (auditoría)</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>↺</button>
        </div>
        <div className="card-body p-0">
          {audit.length === 0 ? (
            <p className="text-muted text-center py-3 small mb-0">Sin cambios registrados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table admin-table-sm mb-0 align-middle">
                <thead><tr>
                  <th className="text-muted fw-normal small">Fecha</th>
                  <th className="text-muted fw-normal small">Actor</th>
                  <th className="text-muted fw-normal small">Acción</th>
                  <th className="text-muted fw-normal small">Cuenta</th>
                  <th className="text-muted fw-normal small">Detalle</th>
                </tr></thead>
                <tbody>
                  {audit.map((row) => (
                    <tr key={row.id}>
                      <td className="text-muted small">{fmt(row.created_at)}</td>
                      <td className="small">{row.actor}</td>
                      <td><span className="badge bg-secondary">{row.action}</span></td>
                      <td className="small">{row.target}</td>
                      <td className="small text-muted" style={{ maxWidth: 320 }}>
                        {row.detail ? <code className="small text-info">{row.detail}</code> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0" style={{ background: "#ffffff" }}>
        <div className="card-header border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-dark">Intentos de inicio de sesión</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>↺</button>
        </div>
        <div className="card-body p-0">
          {logins.length === 0 ? (
            <p className="text-muted text-center py-3 small mb-0">Sin intentos registrados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table admin-table-sm mb-0 align-middle">
                <thead><tr>
                  <th className="text-muted fw-normal small">Fecha</th>
                  <th className="text-muted fw-normal small">Usuario</th>
                  <th className="text-muted fw-normal small">Resultado</th>
                  <th className="text-muted fw-normal small">Motivo</th>
                </tr></thead>
                <tbody>
                  {logins.map((row) => (
                    <tr key={row.id}>
                      <td className="text-muted small">{fmt(row.created_at)}</td>
                      <td className="small">{row.username}</td>
                      <td>
                        {row.exitoso
                          ? <span className="badge bg-success">OK</span>
                          : <span className="badge bg-danger">Fallido</span>}
                      </td>
                      <td className="small text-muted">{row.motivo || "—"}</td>
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

// ════════════════════════════════════════════════════════════════
//  DASHBOARD PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function OSAccountsAdmin() {
  const [tab, setTab] = useState("cuentas");
  const [grupos, setGrupos] = useState([]);

  const cargarGrupos = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/os/groups`, { headers: authHeaders() });
      const j = await r.json();
      if (r.ok) setGrupos(j.data || []);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { cargarGrupos(); }, [cargarGrupos]);

  return (
    <div className="admin-shell">
      <div className="container-fluid" style={{ maxWidth: 1280 }}>
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-opacity-25">
          <div>
            <h1 className="h3 fw-bold mb-0">Cuentas de Sistema Operativo</h1>
            <p className="text-muted small mb-0">
              Práctica: crear, modificar, habilitar, deshabilitar y verificar cuentas (estilo Windows).
            </p>
          </div>
          <a href="/admin" className="btn btn-sm btn-outline-secondary">← Volver al panel</a>
        </div>

        <ul className="nav nav-tabs mb-4 admin-tabs">
          {[
            { key: "cuentas", label: "👥 Cuentas" },
            { key: "audit",   label: "📋 Bitácora" },
          ].map(({ key, label }) => (
            <li className="nav-item" key={key}>
              <button
                className={`nav-link admin-tab ${tab === key ? "active" : ""}`}
                onClick={() => setTab(key)}>
                {label}
              </button>
            </li>
          ))}
        </ul>

        {tab === "cuentas" && <TabCuentas grupos={grupos} onChanged={cargarGrupos} />}
        {tab === "audit"   && <TabBitacora />}
      </div>
    </div>
  );
}
