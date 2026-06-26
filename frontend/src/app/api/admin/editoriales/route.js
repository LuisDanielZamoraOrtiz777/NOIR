import { query } from "@/lib/db";
import { authenticateJWT } from "@/lib/auth";

export async function GET(request) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const result = await query("SELECT * FROM editoriales ORDER BY fecha DESC");
    return Response.json({
      status: "success",
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error en GET /api/admin/editoriales:", error);
    return Response.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado } = await request.json();

    if (!titulo?.trim()) {
      return Response.json(
        { error: "Datos inválidos", detail: "El título es obligatorio" },
        { status: 400 }
      );
    }
    if (!resumen?.trim()) {
      return Response.json(
        { error: "Datos inválidos", detail: "El resumen es obligatorio" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO editoriales (titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        titulo.trim(),
        autor?.trim() || "Equipo Editorial Noir",
        fecha || new Date().toISOString().split("T")[0],
        categoria?.trim() || "Editorial",
        resumen.trim(),
        contenido?.trim() || "",
        imagen_url?.trim() || null,
        publicado === true || publicado === "true"
      ]
    );

    return Response.json(
      { status: "success", message: "Editorial creada", data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/admin/editoriales:", error);
    return Response.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}