import { neon } from "@neondatabase/serverless";
import { authenticateJWT } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no definida");
  return neon(process.env.DATABASE_URL);
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true" || value === "on") return true;
    if (value === "false") return false;
  }
  return null;
}

function isValidPublicUrl(value) {
  return typeof value === "string" && /^(https?:\/\/)/i.test(value.trim());
}

// ── PATCH /api/admin/editoriales/[id] ────────────────────────────────────────
export async function PATCH(request, { params }) {
  const auth = authenticateJWT(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = await request.json();
    const { titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado } = body;

    if (imagen_url && !isValidPublicUrl(imagen_url)) {
      return NextResponse.json({ error: "La imagen debe ser una URL pública válida." }, { status: 400 });
    }

    const publicadoValue = typeof publicado === "boolean"
      ? publicado
      : publicado === "true"
      ? true
      : publicado === "false"
      ? false
      : null;

    const sql = getSql();
    const rows = await sql`
      UPDATE editoriales SET
        titulo      = COALESCE(${titulo?.trim()     || null}, titulo),
        autor       = COALESCE(${autor?.trim()      || null}, autor),
        fecha       = COALESCE(${fecha              || null}, fecha),
        categoria   = COALESCE(${categoria?.trim()  || null}, categoria),
        resumen     = COALESCE(${resumen?.trim()    || null}, resumen),
        contenido   = COALESCE(${contenido?.trim()  || null}, contenido),
        imagen_url  = COALESCE(${imagen_url?.trim() || null}, imagen_url),
        publicado   = COALESCE(${publicadoValue}, publicado),
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: `No existe editorial con id ${id}.` }, { status: 404 });
    }

    revalidatePath("/editoriales");
    revalidatePath("/");

    return NextResponse.json({ status: "success", message: "Editorial actualizada", data: rows[0] });
  } catch (err) {
    console.error("[PATCH /api/admin/editoriales/[id]]", err.message);
    return NextResponse.json({ error: "Error interno.", detail: err.message }, { status: 500 });
  }
}

// ── DELETE /api/admin/editoriales/[id] ───────────────────────────────────────
export async function DELETE(request, { params }) {
  const auth = authenticateJWT(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const sql = getSql();
    const rows = await sql`DELETE FROM editoriales WHERE id = ${id} RETURNING *`;

    if (rows.length === 0) {
      return NextResponse.json({ error: `No existe editorial con id ${id}.` }, { status: 404 });
    }

    revalidatePath("/editoriales");
    revalidatePath("/");

    return NextResponse.json({ status: "success", message: "Editorial eliminada", data: rows[0] });
  } catch (err) {
    console.error("[DELETE /api/admin/editoriales/[id]]", err.message);
    return NextResponse.json({ error: "Error interno.", detail: err.message }, { status: 500 });
  }
}
