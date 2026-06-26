import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL no definida." }, { status: 500 });
    }
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, titulo, autor, fecha, categoria, resumen, contenido, imagen_url
      FROM editoriales
      WHERE publicado = true
      ORDER BY fecha DESC, created_at DESC
    `;
    return NextResponse.json({ status: "success", total: rows.length, data: rows });
  } catch (err) {
    console.error("[GET /api/editoriales/publicas]", err.message);
    if (err.message?.includes("does not exist")) {
      return NextResponse.json({ status: "success", total: 0, data: [] });
    }
    return NextResponse.json({ error: "No se pudieron cargar las editoriales." }, { status: 500 });
  }
}
