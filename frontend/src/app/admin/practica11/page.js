"use client";
import { useState } from "react";

export default function Practica11Page() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return setStatus("Selecciona un archivo JSON de evidencia antes de subir.");
    setStatus("Subiendo...");
    const fd = new FormData();
    fd.append("evidence", file);
    const res = await fetch('/api/practica11/upload', { method: 'POST', body: fd });
    if (res.ok) setStatus("Evidencia subida correctamente."); else setStatus("Error al subir.");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Práctica 11 — Administración de cuentas</h1>
      <p>Instrucciones rápidas:</p>
      <ol>
        <li>Descarga el script para tu sistema operativo desde <code>frontend/scripts/</code>.</li>
        <li>Ejecútalo en tu máquina con privilegios de administrador para crear los usuarios y generar el JSON de evidencia.</li>
        <li>Sube el archivo JSON generado aquí como evidencia.</li>
      </ol>

      <p>Scripts en el repo:</p>
      <ul>
        <li>Windows PowerShell: <code>frontend/scripts/create_practica11_windows.ps1</code></li>
        <li>Linux Bash: <code>frontend/scripts/create_practica11_linux.sh</code></li>
      </ul>

      <form onSubmit={upload}>
        <label>Archivo JSON de evidencia: <input type="file" accept="application/json" onChange={(e) => setFile(e.target.files[0])} /></label>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Subir evidencia</button>
        </div>
      </form>
      <p>{status}</p>
    </div>
  );
}
