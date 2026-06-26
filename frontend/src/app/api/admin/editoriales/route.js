import { neon } from "@neondatabase/serverless";
import { authenticateJWT } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida");
  }
  return neon(process.env.DATABASE_URL);
}

// ── GET /api/admin/editoriales ────────────────────────────────────────────────
export async function GET(request) {
  const auth = authenticateJWT(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM editoriales ORDER BY fecha DESC, created_at DESC
    `;
    return NextResponse.json({ status: "success", total: rows.length, data: rows });
  } catch (err) {
    console.error("[GET /api/admin/editoriales]", err.message);
    // Si la tabla no existe, devolver mensaje claro
    if (err.message?.includes("does not exist")) {
      return NextResponse.json(
        { error: "La tabla 'editoriales' no existe. Visita /api/admin/setup para crearla." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

// ── POST /api/admin/editoriales ───────────────────────────────────────────────
export async function POST(request) {
  const auth = authenticateJWT(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado } = body;

    if (!titulo?.trim()) {
      return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
    }
    if (!resumen?.trim()) {
      return NextResponse.json({ error: "El resumen es obligatorio." }, { status: 400 });
    }

    const sql = getSql();
    const rows = await sql`
      INSERT INTO editoriales (titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado)
      VALUES (
        ${titulo.trim()},
        ${autor?.trim() || "Equipo Editorial Noir"},
        ${fecha || null},
        ${categoria?.trim() || "Editorial"},
        ${resumen.trim()},
        ${contenido?.trim() || ""},
        ${imagen_url?.trim() || null},
        ${publicado === true || publicado === "true"}
      )
      RETURNING *
    `;

    return NextResponse.json(
      { status: "success", message: "Editorial creada", data: rows[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/editoriales]", err.message);
    if (err.message?.includes("does not exist")) {
      return NextResponse.json(
        { error: "La tabla 'editoriales' no existe. Visita /api/admin/setup para crearla." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Error interno del servidor.", detail: err.message }, { status: 500 });
  }
}
