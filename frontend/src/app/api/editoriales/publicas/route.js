import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `SELECT id, titulo, autor, fecha, categoria, resumen, contenido, imagen_url
       FROM editoriales
       WHERE publicado = true
       ORDER BY fecha DESC`
    );
    return Response.json({
      status: "success",
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error en /api/editoriales/publicas:", error);
    return Response.json(
      { error: "No se pudieron cargar las editoriales." },
      { status: 500 }
    );
  }
}