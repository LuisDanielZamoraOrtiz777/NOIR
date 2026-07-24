# Práctica: Administración de cuentas de usuario en un Sistema Operativo

Esta práctica está implementada dentro del propio panel de administración de
**Noir Atelier** (`/admin/os-accounts`). Permite crear, modificar, habilitar,
deshabilitar, eliminar y simular el inicio de sesión de cuentas de SO, con
auditoría completa de cada cambio.

> **Contexto**: tu proyecto corre en Windows pero la app es la misma
> (PostgreSQL/Neon en el backend). Toda la lógica es portable y replica los
> conceptos del módulo de cuentas de Windows / `net user` / `net localgroup`.

## 1. Cómo se cumplió cada requerimiento

| # | Requerimiento de la práctica | Dónde se evidencia en la app |
|---|---|---|
| 1 | Crear tres usuarios (alumno1, alumno2, invitado) con la misma contraseña | Seed en `backend/server/scripts/migracion_os_accounts.sql`. Botón **Crear cuenta** en `/admin/os-accounts` (tab Cuentas) |
| 2 | Identificar: nombre completo, estado, fecha de creación, último inicio de sesión, grupos, requiere cambio de contraseña | Tabla principal del tab **Cuentas** muestra los 6 campos por usuario |
| 3 | Tabla con columnas: usuario / habilitado / grupo / cambio de contraseña | Misma tabla, columnas "Username", "Estado", "Grupos" y badge "Cambio pwd" |
| 4 | Deshabilitar uno de los dos usuarios del mismo nivel y verificar | Botón **Deshabilitar** sobre `alumno2`. Después usa el tab **Simular login** para comprobar que no entra |
| 5 | Volver a habilitar y comprobar que ya puede iniciar sesión | Botón **Habilitar** sobre la misma cuenta. Repite la simulación de login |
| 6 | Pruebas de ejecución de comandos para deshabilitar | Las llamadas HTTP `POST /api/admin/os/users/:id/disable` equivalen al comando `net user alumno2 /active:no` de Windows. Se registran en la bitácora (`os_audit_log`) |
| 7 | Tabla: Deshabilitar vs eliminar (información, login, recuperabilidad) | Botones diferenciados **Deshabilitar** vs **Eliminar**; el tab Bitácora muestra la diferencia de acción |

## 2. Pasos para ejecutarlo en tu servidor (Neon + Vercel)

1. **Aplicar la migración en Neon** (SQL Editor):
   ```
   -- Pega el contenido de backend/server/scripts/migracion_os_accounts.sql
   ```
   Esto crea las tablas `os_users`, `os_groups`, `os_user_groups`,
   `os_login_attempts`, `os_audit_log` y siembra las 3 cuentas de práctica.

2. **Desplegar backend y frontend** (ambos repos ya están en sus servidores).
   El backend ya monta las rutas en `/api/admin/os/*` y el frontend expone
   la página `/admin/os-accounts`.

3. **Inicia sesión como administrador** y entra a `https://tu-dominio/admin/os-accounts`.

## 3. Comandos equivalentes en Windows (referencia)

| Acción en la app | Equivalente PowerShell / CMD | Equivalente en la app Noir |
|---|---|---|
| Crear cuenta | `net user alumno3 Clave123 /add` | Botón **Crear cuenta** |
| Deshabilitar | `net user alumno2 /active:no`  | Botón **Deshabilitar** |
| Habilitar   | `net user alumno2 /active:yes` | Botón **Habilitar** |
| Eliminar    | `net user alumno2 /delete`     | Botón **Eliminar** |
| Ver info    | `net user alumno1`             | Tabla del tab **Cuentas** |
| Cambiar grupo | `net localgroup Usuarios alumno1 /add` | Editar cuenta → checkbox grupos |
| Ver intentos fallidos | `Get-WinEvent -LogName Security` | Tab **Bitácora** → Intentos de login |

## 4. Credenciales de práctica (seed)

- **Usuarios**: `alumno1`, `alumno2`, `invitado`
- **Contraseña común**: `P@ssw0rd2026`
- **Grupos**: `alumno1` y `alumno2` → grupo `Usuarios`; `invitado` → grupo `Invitados`

## 5. Capturas recomendadas para tu reporte

1. `/admin/os-accounts` con las 3 cuentas recién creadas.
2. Click en **Deshabilitar** sobre `alumno2` y la fila cambia a "Deshabilitado".
3. Tab **Simular login** con intento sobre `alumno2` → "La cuenta del usuario está deshabilitada".
4. Click en **Habilitar** sobre `alumno2` y vuelve a "Habilitado".
5. Tab **Simular login** con credenciales correctas → "Inicio de sesión exitoso".
6. Tab **Bitácora** mostrando los registros `disable`, `enable` y los intentos de login.
