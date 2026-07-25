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
  // Authenticate user and check for editor or admin role
  const auth = authenticateEditor(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = params;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { error: "ID de pedido inválido" },
      { status: 400 }
    );
  }

  try {
    const sql = getSql();
    const body = await request.json();
    const { estado } = body;

    if (!estado) {
      return NextResponse.json(
        { error: "El estado es requerido" },
        { status: 400 }
      );
    }

    // Validate estado value
    const allowedEstados = ["pendiente", "contactado", "completado", "cancelado"];
    if (!allowedEstados.includes(estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Debe ser uno de: ${allowedEstados.join(", ")}` },
        { status: 400 }
      );
    }

    // Update the order
    const result = await sql`
      UPDATE pedidos
      SET estado = ${estado}
      WHERE id = ${id}
      RETURNING id, estado
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        id: result[0].id,
        estado: result[0].estado,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/pedidos/[id]]", err.message || err);
    return NextResponse.json(
      { error: "Error interno del servidor.", detail: err.message },
      { status: 500 }
    );
  }
}
