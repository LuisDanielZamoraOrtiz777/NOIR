// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

function Alert({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type} alert-dismissible`} role="alert">
      {msg}
      <button type="button" className="btn-close" onClick={onClose} />
    </div>
  );
}

// ══════════════════════════════════════════
//  TAB: PÁGINAS HERMANAS
// ══════════════════════════════════════════
function TabPartners() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ nombre: "", url_api: "" });

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

      <div className="card border-0 mb-4" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary">
          <h5 className="mb-0 text-white">Registrar nueva página hermana</h5>
        </div>
        <div className="card-body">
          <form onSubmit={agregar}>
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label small">Nombre *</label>
                <input className="form-control admin-form-control" placeholder="Ej: Vogue España"
                  value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required disabled={saving} />
              </div>
              <div className="col-md-5">
                <label className="form-label small">URL *</label>
                <input type="url" className="form-control admin-form-control" placeholder="https://..."
                  value={form.url_api} onChange={(e) => setForm({ ...form, url_api: e.target.value })} required disabled={saving} />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-light w-100" disabled={saving}>{saving ? "…" : "Agregar"}</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Páginas hermanas ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺"}</button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-dark" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">Sin partners registrados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table mb-0">
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

// ══════════════════════════════════════════
//  TAB: USUARIOS
// ══════════════════════════════════════════
function TabUsuarios() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
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

      <div className="card border-0" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Usuarios registrados ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺ Actualizar"}</button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-dark" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">Sin usuarios registrados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table mb-0">
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
                            className="form-select form-select-sm admin-form-control"
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

// ══════════════════════════════════════════
//  TAB: PEDIDOS
// ══════════════════════════════════════════
function TabPedidos() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const cargar = useCallback(async (estadoFiltro = filtroEstado) => {
    setLoading(true);
    try {
      let url = `/api/admin/pedidos`;
      if (estadoFiltro) url += `?estado=${encodeURIComponent(estadoFiltro)}`;
      const r = await fetch(url, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_rol");
        window.location.href = "/acceso";
        return;
      }
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al cargar pedidos");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id, nuevoEstado) => {
    setUpdatingId(id); setErr(""); setOk("");
    try {
      const r = await fetch(`/api/admin/pedidos/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al actualizar estado");
      setOk(j.message || `Cotización #${id} actualizada ✓`);
      cargar();
    } catch (e) { setErr(e.message); }
    finally { setUpdatingId(null); }
  };

  const getEstadoBadge = (estado) => {
    const colors = {
      pendiente: "bg-warning text-dark",
      contactado: "bg-info text-dark",
      cotizado: "bg-primary",
      cancelado: "bg-danger",
    };
    return <span className={`badge ${colors[estado] || "bg-secondary"}`}>{estado}</span>;
  };

  const totalPedidos = lista.length;
  const totalVentas = lista.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

  return (
    <>
      <Alert msg={ok} type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger" onClose={() => setErr("")} />

      {/* Resumen */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 bg-dark text-white text-center p-3">
            <div className="h4 mb-0">{totalPedidos}</div>
            <small className="text-muted">Total cotizaciones</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-dark text-white text-center p-3">
            <div className="h4 mb-0">$ {totalVentas.toFixed(2)} MXN</div>
            <small className="text-muted">Total cotizado</small>
          </div>
        </div>
        <div className="col-md-6">
          <div className="d-flex gap-2 justify-content-end align-items-center h-100">
            <label className="text-muted small me-2">Filtrar:</label>
            <select className="form-select form-select-sm admin-form-control" style={{ width: "auto" }}
              value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); cargar(e.target.value); }}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="contactado">Contactado</option>
              <option value="cotizado">Cotizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <button className="btn btn-sm btn-outline-light" onClick={() => cargar()} disabled={loading}>
              {loading ? "…" : "↺ Actualizar"}
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary">
          <h5 className="mb-0 text-white">Cotizaciones ({lista.length})</h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-dark" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">No hay cotizaciones registradas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table mb-0">
                <thead><tr>
                  <th className="text-muted fw-normal small">#</th>
                  <th className="text-muted fw-normal small">Cliente</th>
                  <th className="text-muted fw-normal small">Teléfono</th>
                  <th className="text-muted fw-normal small">Email</th>
                  <th className="text-muted fw-normal small">Total</th>
                  <th className="text-muted fw-normal small">WhatsApp</th>
                  <th className="text-muted fw-normal small">Estado</th>
                  <th className="text-muted fw-normal small">Items</th>
                  <th className="text-muted fw-normal small">Fecha</th>
                  <th className="text-muted fw-normal small text-end">Acción</th>
                </tr></thead>
                <tbody>
                  {lista.map((p) => {
                    const items = p.items || [];
                    const totalItems = items.reduce((s, i) => s + parseInt(i.cantidad || i.quantity || 0), 0);
                    return (
                      <tr key={p.id}>
                        <td className="text-muted small">{p.id}</td>
                        <td className="fw-medium">{p.cliente_nombre || "—"}</td>
                        <td className="small">{p.cliente_telefono || "—"}</td>
                        <td className="small text-info">{p.cliente_email || "—"}</td>
                        <td className="fw-bold">$ {parseFloat(p.total).toFixed(2)} MXN</td>
                        <td>
                          {p.whatsapp_enviado_en ? (
                            <span className="badge bg-success">✓ Enviado</span>
                          ) : (
                            <span className="badge bg-secondary">— Pendiente</span>
                          )}
                        </td>
                        <td>{getEstadoBadge(p.estado)}</td>
                        <td className="small">{totalItems} artículos</td>
                        <td className="text-muted small">{p.creado_en ? new Date(p.creado_en).toLocaleDateString("es-MX") : "—"}</td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <select className="form-select form-select-sm admin-form-control" style={{ width: "auto", minWidth: 120 }}
                              defaultValue={p.estado}
                              onChange={(e) => cambiarEstado(p.id, e.target.value)}
                              disabled={updatingId === p.id}>
                              <option value="pendiente">Pendiente</option>
                              <option value="contactado">Contactado</option>
                              <option value="cotizado">Cotizado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                            {updatingId === p.id && <span className="text-muted small align-self-center">…</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detalle de items por pedido */}
      {lista.length > 0 && (
        <div className="mt-4">
          <h6 className="text-white mb-3">Detalle de artículos por pedido</h6>
          {lista.map((p) => {
            const items = p.items || [];
            if (items.length === 0) return null;
            return (
              <div key={`detalle-${p.id}`} className="card border-0 mb-2" style={{ background: "#ffffff" }}>
                <div className="card-header border-secondary py-2">
                  <small className="text-muted">Cotización #{p.id} — {p.cliente_nombre || "—"}</small>
                </div>
                <div className="card-body p-2">
                  <table className="table table-dark table-sm mb-0">
                    <thead>
                      <tr>
                        <th className="text-muted fw-normal small">Producto</th>
                        <th className="text-muted fw-normal small text-end">Precio</th>
                        <th className="text-muted fw-normal small text-end">Cant.</th>
                        <th className="text-muted fw-normal small text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="small">{item.nombre_producto || item.product_name}</td>
                          <td className="small text-end">$ {parseFloat(item.precio_unitario || item.unit_price).toFixed(2)} MXN</td>
                          <td className="small text-end">{item.cantidad || item.quantity}</td>
                          <td className="small text-end">$ {parseFloat(item.subtotal).toFixed(2)} MXN</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════
//  TAB: CONTACTOS
// ══════════════════════════════════════════
function TabContactos() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

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

      <div className="card border-0" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Mensajes de usuarios ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺ Actualizar"}</button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-dark" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">No hay mensajes de usuarios.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table mb-0">
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

// ══════════════════════════════════════════
//  TAB: PRODUCTOS (TIENDA)
// ══════════════════════════════════════════
function TabProductos() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ nombre: "", categoria: "", descripcion: "", precio: "", moneda: "MXN", imagen_url: "" });
  const [ediciones, setEdiciones] = useState({}); // { [id]: { precio? } }

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/productos`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_rol");
        window.location.href = "/acceso";
        return;
      }
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al cargar productos");
      setLista(j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/productos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error");
      setOk("Producto agregado exitosamente");
      setForm({ nombre: "", categoria: "", descripcion: "", precio: "", moneda: "MXN", imagen_url: "" });
      cargar();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (producto) => {
    setActionId(producto.id); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/productos/${producto.id}`, {
        method: producto.activo ? "DELETE" : "PATCH",
        headers: authHeaders(),
        body: producto.activo ? undefined : JSON.stringify({ activo: true }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al actualizar producto");
      setOk(j.message || "Estado del producto actualizado ✓");
      cargar();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  const guardarEdicion = async (id) => {
    const cambios = ediciones[id];
    if (!cambios) return;
    setActionId(id); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/productos/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(cambios),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al guardar cambios");
      setOk("Precio actualizado ✓");
      setEdiciones((prev) => { const next = { ...prev }; delete next[id]; return next; });
      cargar();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  return (
    <>
      <Alert msg={ok} type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger" onClose={() => setErr("")} />

      <div className="card border-0 mb-4" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary"><h5 className="mb-0 text-white">Agregar nuevo producto</h5></div>
        <div className="card-body">
          <form onSubmit={agregar}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small">Nombre *</label>
                <input className="form-control admin-form-control" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} required disabled={saving} />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Categoría *</label>
                <input className="form-control admin-form-control" value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })} required disabled={saving} />
              </div>
              <div className="col-md-2">
                <label className="form-label small">Precio *</label>
                <input type="number" step="0.01" min="0" className="form-control admin-form-control" value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })} required disabled={saving} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">URL de imagen</label>
                <input type="url" className="form-control admin-form-control" placeholder="https://..." value={form.imagen_url}
                  onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} disabled={saving} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Descripción</label>
                <input className="form-control admin-form-control" value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })} disabled={saving} />
              </div>
              <div className="col-12">
                <button className="btn btn-light" disabled={saving}>{saving ? "Guardando…" : "Agregar producto"}</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Productos ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>{loading ? "…" : "↺"}</button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-dark" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">Sin productos registrados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table mb-0 align-middle">
                <thead><tr>
                  <th className="text-muted fw-normal small">Nombre</th>
                  <th className="text-muted fw-normal small">Categoría</th>
                  <th className="text-muted fw-normal small">Precio (MXN)</th>
                  <th className="text-muted fw-normal small">Estado</th>
                  <th className="text-muted fw-normal small text-end">Acción</th>
                </tr></thead>
                <tbody>
                  {lista.map((p) => {
                    const edit = ediciones[p.id] || {};
                    return (
                      <tr key={p.id}>
                        <td className="fw-medium">{p.nombre}</td>
                        <td className="text-muted small">{p.categoria}</td>
                        <td style={{ width: 110 }}>
                          <input type="number" step="0.01" min="0" className="form-control form-control-sm admin-form-control"
                            value={edit.precio ?? p.precio}
                            onChange={(e) => setEdiciones((prev) => ({ ...prev, [p.id]: { ...prev[p.id], precio: e.target.value } }))} />
                        </td>
                        <td><span className={`badge ${p.activo ? "bg-success" : "bg-secondary"}`}>{p.activo ? "Activo" : "Inactivo"}</span></td>
                        <td className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            {ediciones[p.id] && (
                              <button className="btn btn-sm btn-outline-info" onClick={() => guardarEdicion(p.id)} disabled={actionId === p.id}>
                                {actionId === p.id ? "…" : "Guardar"}
                              </button>
                            )}
                            <button className={`btn btn-sm ${p.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                              onClick={() => toggle(p)} disabled={actionId === p.id}>
                              {actionId === p.id ? "…" : p.activo ? "Desactivar" : "Reactivar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════
//  TAB: PUBLICADOS (TIENDA PÚBLICA)
// ══════════════════════════════════════════
function TabPublicados() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/sister-store/products`, { headers: authHeaders() });
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_rol");
        window.location.href = "/acceso";
        return;
      }
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al cargar productos publicados");
      setLista(j.products || j.data || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggle = async (producto) => {
    setActionId(producto.id); setErr(""); setOk("");
    try {
      const r = await fetch(`${API}/api/admin/productos/${producto.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Error al actualizar producto");
      setOk(j.message || "Estado del producto actualizado ✓");
      cargar();
    } catch (e) { setErr(e.message); }
    finally { setActionId(null); }
  };

  return (
    <>
      <Alert msg={ok} type="success" onClose={() => setOk("")} />
      <Alert msg={err} type="danger" onClose={() => setErr("")} />

      <div className="card border-0 mb-4" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary"><h5 className="mb-0 text-white">Productos publicados</h5></div>
        <div className="card-body">
          {/* No form for adding products since this is just for viewing published products */}
        </div>
      </div>

      <div className="card border-0" style={{ background: "#ffffff" }}>
        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">Productos publicados ({lista.length})</h5>
          <button className="btn btn-sm btn-outline-light" onClick={cargar} disabled={loading}>
            {loading ? "…" : "↺"}
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-dark" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">No hay productos publicados.</p>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="text-muted fw-normal small">Nombre</th>
                    <th className="text-muted fw-normal small">Categoría</th>
                    <th className="text-muted fw-normal small">Precio (MXN)</th>
                    <th className="text-muted fw-normal small">Estado</th>
                    <th className="text-muted fw-normal small text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-medium">{p.name}</td>
                      <td className="text-muted small">{p.category}</td>
                      <td style={{ width: 110 }}>
                        <input type="number" step="0.01" min="0" className="form-control form-control-sm admin-form-control"
                          value={p.price}
                          readOnly
                        />
                      </td>
                      <td>
                        <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                          {p.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-danger"
                            onClick={() => toggle(p)} disabled={actionId === p.id}>
                            {actionId === p.id ? "…" : "Ocultar"}
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

// ══════════════════════════════════════════
//  DASHBOARD PRINCIPAL
// ══════════════════════════════════════════
export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("usuarios");
  const [user, setUser] = useState(null);

  // Fetch user info when token changes
  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) { router.push("/acceso"); return; }
    try { setUser(JSON.parse(localStorage.getItem("user_data") || "{}")); } catch {}
  }, []);

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
      <div className="admin-shell">
        <div className="container-fluid" style={{ maxWidth: 1200 }}>
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-opacity-25">
            <div>
              <h1 className="h3 fw-bold mb-0">Panel de Administración</h1>
              <p className="text-muted small mb-0">Noir Atelier · Gestión de contenido</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              {user?.email && <span className="text-muted small">{user.email}</span>}
              <button className="btn btn-sm btn-outline-danger" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>

          <ul className="nav nav-tabs mb-4 admin-tabs">
            {[
              { key: "usuarios", label: "👥 Usuarios" },
              { key: "pedidos", label: "📦 Cotizaciones" },
              { key: "os-accounts", label: "🖥️ Cuentas SO" },
              { key: "contactos", label: "💬 Contactos" },
              { key: "partners", label: "🔗 Páginas hermanas" },
              { key: "productos", label: "🛍️ Productos" },
              { key: "publicados", label: "📦 Publicados" },
            ].map(({ key, label }) => (
              <li className="nav-item" key={key}>
                <button
                  className={`nav-link admin-tab ${tab === key ? "active" : ""}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {tab === "partners" && <TabPartners />}
          {tab === "usuarios" && <TabUsuarios />}
          {tab === "pedidos" && <TabPedidos />}
          {tab === "productos" && <TabProductos />}
          {tab === "publicados" && <TabPublicados />}
          {tab === "os-accounts" && (
            <div className="text-center py-5">
              <p className="text-muted mb-3">
                La gestión de cuentas del sistema operativo se abrió en una pestaña dedicada.
              </p>
              <a href="/admin/os-accounts" className="btn btn-outline-light">
                Abrir gestión de cuentas SO →
              </a>
            </div>
          )}
          {tab === "contactos" && <TabContactos />}
        </div>
      </div>
    </RouteProtector>
  );
}