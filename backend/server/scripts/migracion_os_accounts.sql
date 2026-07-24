-- ============================================================
-- MIGRACIÓN: Administración de cuentas de Sistema Operativo (Windows)
-- Práctica — Creación, modificación, habilitación, deshabilitación
-- y verificación de usuarios a nivel SO (simulado).
-- Ejecutar en Neon: pegar en el SQL Editor.
-- ============================================================

-- ── 1. GRUPOS DEL SISTEMA OPERATIVO ──────────────────────────
CREATE TABLE IF NOT EXISTS os_groups (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,  -- 'Administradores' | 'Usuarios' | 'Invitados' | etc.
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO os_groups (nombre, descripcion) VALUES
  ('Administradores', 'Cuenta con privilegios elevados sobre el sistema'),
  ('Usuarios',        'Cuenta estándar con permisos limitados'),
  ('Invitados',       'Cuenta temporal con acceso restringido al sistema')
ON CONFLICT (nombre) DO NOTHING;

-- ── 2. USUARIOS DEL SISTEMA OPERATIVO ────────────────────────
-- Modela la "cuenta local" tipo Windows: enabled/disabled, must_change_password,
-- ultimo_login, descripcion, etc. Independiente de la tabla users (que es de la app).
CREATE TABLE IF NOT EXISTS os_users (
  id                 SERIAL PRIMARY KEY,
  username           TEXT NOT NULL UNIQUE,        -- 'alumno1', 'alumno2', 'invitado'
  full_name          TEXT NOT NULL,               -- Nombre completo
  description        TEXT,                        -- Descripción / Comentario
  password_hash      TEXT NOT NULL,               -- Hash bcrypt del password
  enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at      TIMESTAMPTZ,                 -- NULL si nunca ha iniciado sesión
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_os_users_enabled ON os_users(enabled);
CREATE INDEX IF NOT EXISTS idx_os_users_username ON os_users(username);

-- ── 3. RELACIÓN USUARIO ↔ GRUPO ──────────────────────────────
CREATE TABLE IF NOT EXISTS os_user_groups (
  user_id    INTEGER NOT NULL REFERENCES os_users(id) ON DELETE CASCADE,
  group_id   INTEGER NOT NULL REFERENCES os_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_os_user_groups_user  ON os_user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_os_user_groups_group ON os_user_groups(group_id);

-- ── 4. INTENTOS DE INICIO DE SESIÓN (simulación) ─────────────
CREATE TABLE IF NOT EXISTS os_login_attempts (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL,
  exitoso     BOOLEAN NOT NULL,
  motivo      TEXT,                            -- 'credenciales_invalidas' | 'cuenta_deshabilitada' | 'ok'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_os_login_username ON os_login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_os_login_created  ON os_login_attempts(created_at DESC);

-- ── 5. BITÁCORA DE AUDITORÍA (cambios sobre las cuentas) ─────
CREATE TABLE IF NOT EXISTS os_audit_log (
  id          SERIAL PRIMARY KEY,
  actor       TEXT NOT NULL,                  -- 'daniel@gmail.com' (admin de la app que ejecuta el cambio)
  action      TEXT NOT NULL,                  -- 'create' | 'enable' | 'disable' | 'delete' | 'change_password' | 'set_groups' | 'set_must_change'
  target      TEXT NOT NULL,                  -- username afectado
  detail      TEXT,                           -- JSON o texto libre con detalles
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_os_audit_target  ON os_audit_log(target);
CREATE INDEX IF NOT EXISTS idx_os_audit_created ON os_audit_log(created_at DESC);

-- ── 6. VISTA ÚTIL: usuario con sus grupos (agregados) ────────
CREATE OR REPLACE VIEW vista_os_users_full AS
SELECT
  u.id,
  u.username,
  u.full_name,
  u.description,
  u.enabled,
  u.must_change_password,
  u.created_at,
  u.last_login_at,
  u.password_changed_at,
  COALESCE(
    (SELECT array_agg(g.nombre ORDER BY g.nombre)
       FROM os_user_groups ug
       JOIN os_groups g ON g.id = ug.group_id
      WHERE ug.user_id = u.id),
    ARRAY[]::TEXT[]
  ) AS grupos
FROM os_users u
ORDER BY u.created_at DESC;

-- ── 7. TRIGGER: mantener updated_at en os_users ──────────────
CREATE OR REPLACE FUNCTION set_os_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_os_users_updated_at ON os_users;
CREATE TRIGGER trg_os_users_updated_at
  BEFORE UPDATE ON os_users
  FOR EACH ROW EXECUTE FUNCTION set_os_users_updated_at();

-- ── 8. SEED: tres cuentas de práctica (alumno1, alumno2, invitado)
-- La contraseña común es: P@ssw0rd2026
-- Hash generado con bcrypt 10 rounds; se actualiza también en la API
-- para que /api/admin/os/login simule autenticación real.
INSERT INTO os_users (username, full_name, description, password_hash, enabled, must_change_password)
VALUES
  ('alumno1',  'Alumno Uno',          'Cuenta de práctica nivel estándar',  '$2b$10$3MpzD3lUw/2WtKsYCutO5uSVu.hDJ0zPUv7FUOPAes3GkwD43yHum', TRUE,  TRUE),
  ('alumno2',  'Alumno Dos',          'Cuenta de práctica nivel estándar',  '$2b$10$3MpzD3lUw/2WtKsYCutO5uSVu.hDJ0zPUv7FUOPAes3GkwD43yHum', TRUE,  TRUE),
  ('invitado', 'Usuario Invitado',    'Cuenta de práctica nivel invitado',  '$2b$10$3MpzD3lUw/2WtKsYCutO5uSVu.hDJ0zPUv7FUOPAes3GkwD43yHum', TRUE,  FALSE)
ON CONFLICT (username) DO NOTHING;

-- Asignar grupos
INSERT INTO os_user_groups (user_id, group_id)
SELECT u.id, g.id
FROM os_users u, os_groups g
WHERE (u.username, g.nombre) IN (
  ('alumno1',  'Usuarios'),
  ('alumno2',  'Usuarios'),
  ('invitado', 'Invitados')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'os_users'        AS tabla, count(*) AS total FROM os_users
UNION ALL SELECT 'os_groups',   count(*) FROM os_groups
UNION ALL SELECT 'os_user_groups', count(*) FROM os_user_groups
UNION ALL SELECT 'os_login_attempts', count(*) FROM os_login_attempts
UNION ALL SELECT 'os_audit_log',  count(*) FROM os_audit_log;

SELECT username, full_name, enabled, must_change_password, grupos
FROM vista_os_users_full
ORDER BY username;
