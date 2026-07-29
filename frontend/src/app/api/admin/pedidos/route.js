import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { authenticateEditor } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida");
  }
  return neon(process.env.DATABASE_URL);
}

export async function GET(request) {
  const auth = authenticateEditor(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    // Use Spanish column names matching the schema (cliente_nombre, cliente_telefono, etc.)
    let result;
    if (estado) {
      result = await sql`
        SELECT 
          p.id,
          p.cliente_nombre,
          p.cliente_telefono,
          p.cliente_email,
          p.total,
          p.estado,
          p.canal,
          p.notas,
          p.creado_en
        FROM pedidos p
        WHERE p.estado = ${estado}
        ORDER BY p.creado_en DESC
      `;
    } else {
      result = await sql`
        SELECT 
          p.id,
          p.cliente_nombre,
          p.cliente_telefono,
          p.cliente_email,
          p.total,
          p.estado,
          p.canal,
          p.notas,
          p.creado_en
        FROM pedidos p
        ORDER BY p.creado_en DESC
      `;
    }

    // Fetch items for each order using Spanish column names
    const orders = await Promise.all(
      (result || []).map(async (row) => {
        const items = await sql`
          SELECT id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal
          FROM pedido_items
          WHERE pedido_id = ${row.id}
          ORDER BY id ASC
        `;
        return { ...row, items: items || [] };
      })
    );

    return NextResponse.json({ status: "success", total: orders.length, data: orders });
  } catch (err) {
    console.error("[GET /api/admin/pedidos]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor.", detail: err.message },
      { status: 500 }
    );
  }
}