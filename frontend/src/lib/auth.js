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
</replace_in_file>
<task_progress>
- [x] Explore project structure
- [x] Find admin and editor dashboard components
- [x] Identify editorial-related code
- [x] Create `isEditor` middleware in auth.js
- [x] Create editor route file with editorial CRUD
- [x] Update index.js to add editor routes
- [x] Remove editorial routes from admin.js
- [x] Create editor dashboard page with editorial management
- [x] Update admin dashboard to remove editorial tab
- [x] Update editor page to use new dashboard
- [ ] Create Next.js API route handlers for editor editoriales
