import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "Token no proporcionado." },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "noir_atelier_secret_2025"
      );

      return Response.json({
        status: "success",
        user: { id: decoded.id, email: decoded.email, rol: decoded.rol },
      });
    } catch (jwtError) {
      return Response.json(
        { error: "Token inválido o expirado." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error en /api/admin/verify:", error);
    return Response.json(
      { error: "Error en el servidor." },
      { status: 500 }
    );
  }
}