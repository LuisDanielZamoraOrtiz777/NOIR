-- ============================================================
-- MIGRACIÓN: Sistema de autenticación con roles y permisos
-- Noir Atelier — Prácticas 9 y 10
-- Ejecutar en Neon: copiar y pegar en el SQL Editor de Neon
-- ============================================================

-- ── 1. ROLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,  -- 'administrador' | 'editor' | 'usuario'
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed roles
INSERT INTO roles (nombre, descripcion) VALUES
  ('administrador', 'Acceso total al sistema: gestión de usuarios, contenido y configuración'),
  ('editor',        'Puede crear, editar y publicar contenido editorial'),
  ('usuario',       'Acceso de solo lectura al contenido público')
ON CONFLICT (nombre) DO NOTHING;

-- ── 2. PERMISOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permisos (
  id          SERIAL PRIMARY KEY,
  clave       TEXT NOT NULL UNIQUE,  -- 'leer' | 'escribir' | 'eliminar' | 'gestionar_usuarios'
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed permisos
INSERT INTO permisos (clave, descripcion) VALUES
  ('leer',               'Ver contenido público del sitio'),
  ('escribir',           'Crear y editar editoriales y contenido'),
  ('eliminar',           'Eliminar editoriales y contenido'),
  ('gestionar_usuarios', 'Ver, crear y modificar usuarios del sistema'),
  ('gestionar_partners', 'Administrar páginas hermanas y partners')
ON CONFLICT (clave) DO NOTHING;

-- ── 3. RELACIÓN ROL ↔ PERMISO ────────────────────────────────
CREATE TABLE IF NOT EXISTS rol_permiso (
  rol_id     INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

-- Asignar permisos a roles
-- Administrador: todos los permisos
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'administrador'
ON CONFLICT DO NOTHING;

-- Editor: leer + escribir + eliminar
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'editor'
  AND p.clave IN ('leer', 'escribir', 'eliminar')
ON CONFLICT DO NOTHING;

-- Usuario: solo leer
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'usuario'
  AND p.clave = 'leer'
ON CONFLICT DO NOTHING;

-- ── 4. TABLA USUARIOS (con rol_id) ───────────────────────────
-- Agrega columna rol_id a la tabla users existente
ALTER TABLE users ADD COLUMN IF NOT EXISTS rol_id INTEGER REFERENCES roles(id);

-- Actualizar usuarios existentes: daniel@gmail.com → administrador
UPDATE users
SET rol_id = (SELECT id FROM roles WHERE nombre = 'administrador')
WHERE email = 'daniel@gmail.com';

-- El resto de usuarios sin rol → usuario por defecto
UPDATE users
SET rol_id = (SELECT id FROM roles WHERE nombre = 'usuario')
WHERE rol_id IS NULL;

-- ── 5. TABLA USUARIO_ROL (historial de roles) ─────────────────
-- Permite que un usuario tenga múltiples roles en el tiempo
CREATE TABLE IF NOT EXISTS usuario_rol (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol_id      INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  asignado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asignado_por INTEGER REFERENCES users(id),
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, rol_id)
);

-- Poblar usuario_rol desde la columna rol_id actual
INSERT INTO usuario_rol (user_id, rol_id, activo)
SELECT u.id, u.rol_id, true FROM users u WHERE u.rol_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ── 6. TABLA SESIONES (para invalidar tokens) ────────────────
CREATE TABLE IF NOT EXISTS sesiones (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,  -- hash del JWT para invalidación
  activa      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  ip          TEXT,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sesiones_token   ON sesiones(token_hash);
CREATE INDEX IF NOT EXISTS idx_sesiones_user    ON sesiones(user_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_activa  ON sesiones(activa);

-- ── 7. TABLA INTENTOS DE LOGIN (rate limiting) ───────────────
CREATE TABLE IF NOT EXISTS login_intentos (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  ip          TEXT,
  exitoso     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_email ON login_intentos(email);
CREATE INDEX IF NOT EXISTS idx_login_ip    ON login_intentos(ip);

-- ── 8. VISTAS ÚTILES ─────────────────────────────────────────
CREATE OR REPLACE VIEW vista_usuarios_roles AS
SELECT
  u.id,
  u.email,
  u.rol            AS rol_legacy,
  r.nombre         AS rol_nombre,
  r.descripcion    AS rol_descripcion,
  u.created_at
FROM users u
LEFT JOIN roles r ON r.id = u.rol_id;

CREATE OR REPLACE VIEW vista_rol_permisos AS
SELECT
  r.nombre  AS rol,
  array_agg(p.clave ORDER BY p.clave) AS permisos
FROM roles r
JOIN rol_permiso rp ON rp.rol_id = r.id
JOIN permisos p ON p.id = rp.permiso_id
GROUP BY r.id, r.nombre;

-- ── 9. FUNCIÓN: verificar si usuario tiene permiso ───────────
CREATE OR REPLACE FUNCTION usuario_tiene_permiso(
  p_user_id INTEGER,
  p_permiso  TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON r.id = u.rol_id
    JOIN rol_permiso rp ON rp.rol_id = r.id
    JOIN permisos p ON p.id = rp.permiso_id
    WHERE u.id = p_user_id
      AND p.clave = p_permiso
  );
END;
$$ LANGUAGE plpgsql;

-- ── VERIFICACIÓN ─────────────────────────────────────────────
SELECT 'Roles creados:' as info, count(*) as total FROM roles;
SELECT 'Permisos creados:' as info, count(*) as total FROM permisos;
SELECT 'Usuarios con rol:' as info, count(*) as total FROM users WHERE rol_id IS NOT NULL;
SELECT * FROM vista_rol_permisos;