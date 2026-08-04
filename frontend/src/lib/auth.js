import jwt from "jsonwebtoken";

const JWT_SECRET = () => process.env.JWT_SECRET || "noir_atelier_secret_2025";

/**
 * Decodifica y valida un JWT del header Authorization.
 * Devuelve { user } si el token es válido, o { error, status } si no.
 * Acepta cualquier rol autenticado (admin, editor, usuario).
 */
export function authenticateUser(request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Token no proporcionado.", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    return { user: decoded, status: 200 };
  } catch (jwtError) {
    return { error: "Token inválido o expirado.", status: 401 };
  }
}

export function authenticateJWT(request) {
  const auth = authenticateUser(request);
  if (auth.status !== 200) return auth;

  if (auth.user.rol !== "admin" && auth.user.rol !== "administrador") {
    return { error: "No tienes permisos de administrador.", status: 403 };
  }

  return { user: auth.user, status: 200 };
}

/**
 * Verifica que el JWT sea válido y que el rol sea editor o admin.
 */
export function authenticateEditor(request) {
  const auth = authenticateUser(request);
  if (auth.status !== 200) return auth;

  if (auth.user.rol !== "editor" && auth.user.rol !== "admin" && auth.user.rol !== "administrador") {
    return { error: "No tienes permisos de editor o administrador.", status: 403 };
  }

  return { user: auth.user, status: 200 };
}