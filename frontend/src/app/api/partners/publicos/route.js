import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, nombre, url_api, creado_en
      FROM sitios_partners
      WHERE activo = true
      ORDER BY creado_en ASC
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
    console.error("Error fetching partners:", err);
    return NextResponse.json(
      { status: "error", message: "Error al cargar las páginas hermanas", total: 0, data: [] },
      { status: 500 }
    );
  }
}
