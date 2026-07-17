import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado
      FROM editoriales
      WHERE publicado = true
      ORDER BY fecha DESC, created_at DESC
    `;
    return new NextResponse(
      JSON.stringify({ status: "success", total: rows.length, data: rows }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err) {
    if (err.message?.includes("does not exist")) {
      return NextResponse.json({ status: "success", total: 0, data: [] });
    }
    return NextResponse.json({ error: "Error al cargar editoriales." }, { status: 500 });
  }
}
