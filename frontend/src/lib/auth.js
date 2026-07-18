import jwt from "jsonwebtoken";

export function authenticateJWT(request) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Token no proporcionado.", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "noir_atelier_secret_2025"
    );

    if (decoded.rol !== "admin" && decoded.rol !== "administrador") {
      return { error: "No tienes permisos de administrador.", status: 403 };
    }

    return { user: decoded, status: 200 };
  } catch (jwtError) {
    return { error: "Token inválido o expirado.", status: 401 };
  }
}

/**
 * Verifica que el JWT sea válido y que el rol sea editor o admin.
 */
export function authenticateEditor(request) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Token no proporcionado.", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "noir_atelier_secret_2025"
    );

    if (decoded.rol !== "editor" && decoded.rol !== "admin" && decoded.rol !== "administrador") {
      return { error: "No tienes permisos de editor o administrador.", status: 403 };
    }

    return { user: decoded, status: 200 };
  } catch (jwtError) {
    return { error: "Token inválido o expirado.", status: 401 };
  }
}