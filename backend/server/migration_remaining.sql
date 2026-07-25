DROP VIEW IF EXISTS vista_usuarios_roles;
CREATE OR REPLACE VIEW vista_usuarios_roles AS
SELECT u.id, u.email, u.rol AS rol_legacy, r.nombre AS rol_nombre, r.descripcion AS rol_descripcion, u.created_at
FROM users u
LEFT JOIN roles r ON r.id = u.rol_id;

DROP VIEW IF EXISTS vista_rol_permisos;
CREATE OR REPLACE VIEW vista_rol_permisos AS
SELECT r.nombre AS rol, array_agg(p.chave ORDER BY p.chave) AS permisos
FROM roles r
JOIN rol_permiso rp ON rp.rol_id = r.id
JOIN permisos p ON p.id = rp.permiso_id
GROUP BY r.id, r.nombre;

CREATE OR REPLACE FUNCTION usuario_tem_permiso(p_user_id INTEGER, p_permiso TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON r.id = u.rol_id
    JOIN rol_permiso rp ON rp.rol_id = r.id
    JOIN permisos p ON p.id = rp.permiso_id
    WHERE u.id = p_user_id
      AND p.chave = p_permiso
  );
END;
$$ LANGUAGE plpgsql;
