import { query } from "@/lib/db";
import { authenticateJWT } from "@/lib/auth";

export async function PATCH(request, { params }) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const id = params.id;
    const { titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado } = await request.json();

    const result = await query(
      `UPDATE editoriales SET
        titulo = COALESCE($1, titulo),
        autor = COALESCE($2, autor),
        fecha = COALESCE($3, fecha),
        categoria = COALESCE($4, categoria),
        resumen = COALESCE($5, resumen),
        contenido = COALESCE($6, contenido),
        imagen_url = COALESCE($7, imagen_url),
        publicado = COALESCE($8, publicado)
       WHERE id = $9 RETURNING *`,
      [
        titulo?.trim(),
        autor?.trim(),
        fecha,
        categoria?.trim(),
        resumen?.trim(),
        contenido?.trim(),
        imagen_url?.trim() || null,
        publicado === true || publicado === "true",
        id
      ]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "No encontrado", detail: `No existe editorial ${id}` },
        { status: 404 }
      );
    }

    return Response.json({
      status: "success",
      message: "Editorial actualizada",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error en PATCH /api/admin/editoriales/[id]:", error);
    return Response.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const id = params.id;
    const result = await query("DELETE FROM editoriales WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return Response.json(
        { error: "No encontrado", detail: `No existe editorial ${id}` },
        { status: 404 }
      );
    }

    return Response.json({
      status: "success",
      message: "Editorial eliminada",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error en DELETE /api/admin/editoriales/[id]:", error);
    return Response.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}