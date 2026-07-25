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
  // Authenticate user and check for editor or admin role
  const auth = authenticateEditor(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    let query = `
      SELECT 
        p.id,
        p.client_name AS cliente_nombre,
        p.client_phone AS cliente_telefono,
        p.client_email AS cliente_email,
        p.total,
        p.estado,
        p.canal,
        p.notas,
        p.created_at AS creado_en,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pi.id,
            'product_id', pi.product_id,
            'product_name', pi.product_name,
            'unit_price', pi.unit_price,
            'quantity', pi.quantity,
            'subtotal', pi.subtotal
          )
        ) AS items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
    `;

    const queryParams = [];
    if (estado) {
      query += " WHERE p.estado = $1";
      queryParams.push(estado);
    }

    query += `
      GROUP BY p.id, p.client_name, p.client_phone, p.client_email, p.total, p.estado, p.canal, p.notas, p.created_at
      ORDER BY p.created_at DESC
    `;

    const result = await sql(query, queryParams);
    const orders = result.rows.map(row => ({
      ...row,
      items: row.items || [], // Ensure items is an array
    }));

    return NextResponse.json({ status: "success", total: orders.length, data: orders });
  } catch (err) {
    console.error("[GET /api/admin/pedidos]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor.", detail: err.message },
      { status: 500 }
    );
  }
}
