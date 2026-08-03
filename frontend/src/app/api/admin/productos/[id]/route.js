import { query } from "@/lib/db";
import { authenticateJWT } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const CAMPOS_EDITABLES = ["nombre", "categoria", "descripcion", "precio", "moneda", "imagen_url", "activo"];

export async function PATCH(request, { params }) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const id = params.id;
    const body = await request.json();

    const sets = [];
    const values = [];
    let i = 1;
    for (const campo of CAMPOS_EDITABLES) {
      if (body[campo] !== undefined) {
        if (campo === "precio" && typeof body[campo] === "string") {
          body[campo] = parseFloat(body[campo]);
        }
        if (campo === "precio" && (isNaN(body[campo]) || body[campo] < 0)) {
          return Response.json({ error: "Datos inválidos", detail: "'precio' debe ser un número >= 0 en MXN" }, { status: 400 });
        }
        sets.push(`${campo} = $${i}`);
        values.push(body[campo]);
        i++;
      }
    }
    if (sets.length === 0) {
      return Response.json({ error: "Datos inválidos", detail: "No se envió ningún campo para actualizar" }, { status: 400 });
    }
    values.push(id);

    const result = await query(`UPDATE productos SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (result.rows.length === 0) {
      return Response.json({ error: "No encontrado", detail: `No existe un producto con id ${id}` }, { status: 404 });
    }

    revalidatePath("/tienda");
    return Response.json({ status: "success", message: "Producto actualizado exitosamente", data: result.rows[0] });
  } catch (error) {
    console.error("Error en PATCH /api/admin/productos/[id]:", error);
    return Response.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const id = params.id;
    const result = await query("UPDATE productos SET activo = false WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: "No encontrado", detail: `No existe un producto con id ${id}` }, { status: 404 });
    }

    revalidatePath("/tienda");
    return Response.json({ status: "success", message: "Producto desactivado exitosamente", data: result.rows[0] });
  } catch (error) {
    console.error("Error en DELETE /api/admin/productos/[id]:", error);
    return Response.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}