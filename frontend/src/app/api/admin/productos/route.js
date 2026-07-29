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
    const result = await query("SELECT * FROM productos ORDER BY creado_en DESC");
    return Response.json({ status: "success", count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("Error en GET /api/admin/productos:", error);
    return Response.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const { nombre, categoria, descripcion, precio, moneda, stock, imagen_url } = await request.json();

    if (!nombre?.trim()) {
      return Response.json({ error: "Datos inválidos", detail: "El campo 'nombre' es obligatorio" }, { status: 400 });
    }
    if (!categoria?.trim()) {
      return Response.json({ error: "Datos inválidos", detail: "El campo 'categoria' es obligatorio" }, { status: 400 });
    }
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      return Response.json({ error: "Datos inválidos", detail: "'precio' debe ser un número >= 0" }, { status: 400 });
    }
    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      return Response.json({ error: "Datos inválidos", detail: "'stock' debe ser un entero >= 0" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO productos (nombre, categoria, descripcion, precio, moneda, stock, imagen_url, activo, creado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW()) RETURNING *`,
      [nombre.trim(), categoria.trim(), descripcion?.trim() || null, precioNum, moneda?.trim() || "USD", stockNum, imagen_url?.trim() || null]
    );

    revalidatePath("/tienda");
    return Response.json({ status: "success", message: "Producto agregado exitosamente", data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/admin/productos:", error);
    return Response.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}