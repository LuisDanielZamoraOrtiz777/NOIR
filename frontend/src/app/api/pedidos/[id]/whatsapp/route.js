import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const id = params.id;
    await query(
      "UPDATE pedidos SET whatsapp_enviado_en = NOW() WHERE id = $1 AND whatsapp_enviado_en IS NULL",
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marcando envío de WhatsApp:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
