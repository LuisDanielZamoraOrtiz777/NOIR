import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Si hay un backend, podrías llamarlo aquí para invalidar el token
    // const backendUrl = process.env.NEXT_PUBLIC_API_BASE?.trim();
    // if (backendUrl) {
    //   await fetch(`${backendUrl}/api/auth/logout`, { method: "POST" });
    // }

    return NextResponse.json({ status: "success", message: "Sesión cerrada" });
  } catch (error) {
    console.error("Error en logout:", error);
    return NextResponse.json({ status: "success", message: "Sesión cerrada" });
  }
}