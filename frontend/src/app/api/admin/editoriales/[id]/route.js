import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { authenticateJWT } from "@/lib/auth";

export async function PATCH(request, { params }) {
  const auth = authenticateJWT(request);
  if (auth.error) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const id = params.id;
    const body = await request.json();

    const {
      titulo,
      autor,
      fecha,
      categoria,
      resumen,
      contenido,
      imagen_url,
      publicado,
    } = body || {};

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
       WHERE id = $9
       RETURNING *`,
      [
        titulo || null,
        autor || null,
        fecha || null,
        categoria || null,
        resumen || null,
        contenido || null,
        imagen_url || null,
        typeof publicado === "boolean" ? publicado : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No encontrado", detail: `No existe editorial ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Editorial actualizada",
      data: result.rows[0],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const auth = authenticateJWT(request);
  if (auth.error) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const id = params.id;

    const result = await query(
      "DELETE FROM editoriales WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No encontrado", detail: `No existe editorial ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Editorial eliminada",
      data: result.rows[0],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Error interno del servidor", detail: err.message },
      { status: 500 }
    );
  }
}
