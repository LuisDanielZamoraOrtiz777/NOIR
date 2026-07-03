import { query } from "@/lib/db";
import { authenticateJWT } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const result = await query("SELECT * FROM sitios_partners ORDER BY creado_en DESC");
    return Response.json({
      status: "success",
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error en GET /api/admin/partners:", error);
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

    const { nombre, url_api } = await request.json();

    if (!nombre?.trim()) {
      return Response.json(
        { error: "Datos inválidos", detail: "El campo 'nombre' es obligatorio" },
        { status: 400 }
      );
    }
    if (!url_api?.trim()) {
      return Response.json(
        { error: "Datos inválidos", detail: "El campo 'url_api' es obligatorio" },
        { status: 400 }
      );
    }

    try {
      new URL(url_api);
    } catch {
      return Response.json(
        { error: "URL inválida", detail: "url_api debe ser una URL válida (ej: https://ejemplo.com)" },
        { status: 400 }
      );
    }

    const existe = await query("SELECT id FROM sitios_partners WHERE url_api = $1", [url_api.trim()]);
    if (existe.rows.length > 0) {
      return Response.json(
        { error: "Conflicto", detail: "Ya existe un partner registrado con esa URL" },
        { status: 409 }
      );
    }

    const result = await query(
      "INSERT INTO sitios_partners (nombre, url_api, activo, creado_en) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [nombre.trim(), url_api.trim(), true]
    );

    revalidatePath("/");
    revalidatePath("/revistas");

    return Response.json(
      { status: "success", message: "Partner registrado exitosamente", data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/admin/partners:", error);
    return Response.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}