import crypto from "crypto";
import { neon } from "@neondatabase/serverless";

/**
 * Retorna una instancia de sql conectada a la base de datos.
 * Se inicializa de forma lazy para evitar errores en build time
 * cuando DATABASE_URL no está disponible.
 */
function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está configurada");
  }
  return neon(process.env.DATABASE_URL);
}

export function hashJwtToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function saveSession({ userId, token, expiresAt, ip, userAgent }) {
  if (!userId || !token) return;

  try {
    const sql = getSql();
    const tokenHash = hashJwtToken(token);

    await sql`
      INSERT INTO sesiones (user_id, token_hash, activa, expires_at, ip, user_agent)
      VALUES (${userId}, ${tokenHash}, true, ${expiresAt}, ${ip}, ${userAgent})
    `;
  } catch (error) {
    console.warn("No se pudo guardar sesión en BD:", error.message);
  }
}

export async function revokeSessionByToken(token) {
  if (!token) return;

  try {
    const sql = getSql();
    const tokenHash = hashJwtToken(token);
    await sql`
      UPDATE sesiones
      SET activa = false
      WHERE token_hash = ${tokenHash}
    `;
  } catch (error) {
    console.warn("No se pudo revocar sesión en BD:", error.message);
  }
}
