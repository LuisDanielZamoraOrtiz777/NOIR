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

export async function PATCH(request, { params }) {
  const auth = authenticateEditor(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { estado } = body;

    const estadosValidos = ["pendiente", "contactado", "completado", "cancelado"];
    if (!estado || !estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${estadosValidos.join(", ")}` },
        { status: 400 }
      );
    }

    const sql = getSql();
    const result = await sql`
      UPDATE pedidos
      SET estado = ${estado}
      WHERE id = ${id}
      RETURNING id, cliente_nombre, estado
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      message: `Pedido #${id} actualizado a: ${estado}`,
      data: result[0],
    });
  } catch (err) {
    console.error("[PATCH /api/admin/pedidos/[id]]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor.", detail: err.message },
      { status: 500 }
    );
  }
}