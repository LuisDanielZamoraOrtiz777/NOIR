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
      const r = await fetch(`${API}/api/editor/editoriales`, { headers: authHeaders(), cache: "no-store" });
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_rol");
        window.location.href = "/acceso";
        return;
      }
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
    const url    = editandoId ? `${API}/api/editor/editoriales/${editandoId}` : `${API}/api/editor/editoriales`;
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
      const r = await fetch(`${API}/api/editor/editoriales/${id}`, { method: "DELETE", headers: authHeaders(), cache: "no-store" });
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
            <strong>⚠️ La tabla "editoriales" no existe en la base de datos.</strong><br/>
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
//  TAB: COTIZACIONES (PEDIDOS)
// ════════════════════════════════════════
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
      if (!r.ok) throw new Error(j.detail || j.error || "Error al cargar cotizaciones");
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

      <div className="card border-0" style={{ background: "#1a1a1a" }}>
        <div className="card-header border-secondary">
          <h5 className="mb-0 text-white">Cotizaciones ({lista.length})</h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-light" /></div>
          ) : lista.length === 0 ? (
            <p className="text-muted text-center py-4">No hay cotizaciones registradas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead><tr>
                  <th className="text-muted fw-normal small">#</th>
                  <th className="text-muted fw-normal small">Cliente</th>
                  <th className="text-muted fw-normal small">Teléfono</th>
                  <th className="text-muted fw-normal small">Email</th>
                  <th className="text-muted fw-normal small">Total</th>
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

      {/* Detalle de items por cotización */}
      {lista.length > 0 && (
        <div className="mt-4">
          <h6 className="text-light mb-3">Detalle de artículos por cotización</h6>
          {lista.map((p) => {
            const items = p.items || [];
            if (items.length === 0) return null;
            return (
              <div key={`detalle-${p.id}`} className="card border-0 mb-2" style={{ background: "#1a1a1a" }}>
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

// ════════════════════════════════════════
//  DASHBOARD PRINCIPAL — EDITOR
// ════════════════════════════════════════
export default function EditorDashboard() {
  const router          = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab]   = useState("editoriales");

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
    <RouteProtector tokenKey="user_token" requiredRole={["editor", "administrador", "admin"]} redirectTo="/acceso">
      <div className="min-vh-100 bg-dark text-light py-4">
        <div className="container-fluid" style={{ maxWidth: 1200 }}>
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
            <div>
              <h1 className="h3 fw-bold text-white mb-0">Panel de Editor</h1>
              <p className="text-muted small mb-0">Noir Atelier · Gestión de editoriales y cotizaciones</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              {user?.email && <span className="text-muted small">{user.email}</span>}
              <button className="btn btn-sm btn-outline-danger" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>

          <ul className="nav nav-tabs mb-4 admin-tabs">
            {[
              { key: "editoriales", label: "📝 Editoriales" },
              { key: "cotizaciones", label: "📦 Cotizaciones" },
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

          {tab === "editoriales" && <TabEditoriales />}
          {tab === "cotizaciones" && <TabPedidos />}
        </div>
      </div>
    </RouteProtector>
  );
}