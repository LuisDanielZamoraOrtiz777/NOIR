import { NextResponse } from "next/server";

export async function POST() {
  try {
    // En el futuro se podría invalidar el token en la base de datos
    // Por ahora solo retornamos éxito
    return NextResponse.json({ status: "success", message: "Sesión cerrada" });
  } catch (error) {
    console.error("Error en logout:", error);
    return NextResponse.json({ status: "success", message: "Sesión cerrada" });
  }
}