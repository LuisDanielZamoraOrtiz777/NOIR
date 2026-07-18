import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    const safeName = name?.trim() || "Anónimo";
    const safeEmail = email?.trim() || "no-reply@noiratelier.com";
    const safeMessage = message?.trim() || "";

    if (!safeMessage) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío." },
        { status: 400 }
      );
    }

    console.log("POST /api/contact body:", { name, email, message });

    const result = await query(
      "INSERT INTO contacts(name, email, message, created_at) VALUES($1, $2, $3, NOW()) RETURNING id",
      [safeName, safeEmail, safeMessage]
    );

    console.log("POST /api/contact inserted id:", result.rows[0].id);
    return NextResponse.json({ ok: true, id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Error en /api/contact:", error);
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje.", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}