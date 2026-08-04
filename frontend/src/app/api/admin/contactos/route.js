import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { authenticateJWT } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeUrl(value) {
  if (!value) return "";
  return value.replace(/\/$/, "");
}

function getBackendUrl() {
  const backend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || "";
  const normalized = normalizeUrl(backend);
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  return "";
}

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida");
  }
  return neon(process.env.DATABASE_URL);
}

export async function GET(request) {
  const auth = authenticateJWT(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const backendUrl = getBackendUrl();
  if (backendUrl) {
    try {
      const target = `${backendUrl}/api/admin/contactos`;
      const headers = {};
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
      if (authHeader) headers["Authorization"] = authHeader;

      const res = await fetch(target, { headers });
      const contentType = res.headers.get("content-type") || "application/json";
      const body = await res.text();
      return new NextResponse(body, { status: res.status, headers: { "content-type": contentType } });
    } catch (err) {
      console.error("[GET /api/admin/contactos proxy]", err);
      return NextResponse.json({ error: "Error proxying contactos", detail: err.message }, { status: 502 });
    }
  }

  try {
    const sql = getSql();
    try {
      await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'mensaje'`;
      await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id integer`;
    } catch (schemaErr) {
      console.warn("[GET contactos] No se pudo ampliar esquema:", schemaErr.message);
    }
    const rows = await sql`
      SELECT id, name, email, message, kind, user_id, created_at
      FROM contacts
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ status: "success", total: rows.length, data: rows });
  } catch (err) {
    console.error("[GET /api/admin/contactos]", err.message || err);
    if (err.message?.includes("does not exist")) {
      return NextResponse.json(
        { error: "La tabla 'contacts' no existe. Asegúrate de ejecutar la migración en la base de datos." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Error interno del servidor.", detail: err.message }, { status: 500 });
  }
}
