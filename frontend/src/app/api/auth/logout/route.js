import { NextResponse } from "next/server";
import { revokeSessionByToken } from "@/lib/sessionUtils";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      await revokeSessionByToken(token);
    }

    return NextResponse.json({ status: "success", message: "Sesión cerrada" });
  } catch (error) {
    console.error("Error en logout:", error);
    return NextResponse.json({ status: "success", message: "Sesión cerrada" });
  }
}