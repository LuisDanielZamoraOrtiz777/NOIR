import { query } from "@/lib/db";
import { authenticateJWT } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const auth = authenticateJWT(request);
    if (auth.status !== 200) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const id = params.id;
    const result = await query(
      "UPDATE sitios_partners SET activo = true WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "No encontrado", detail: `No existe un partner con id ${id}` }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/revistas");

    return Response.json({ status: "success", message: "Partner activado", data: result.rows[0] });
  } catch (error) {
    console.error("Error en PATCH /api/admin/partners/[id]/activar:", error);
    return Response.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
