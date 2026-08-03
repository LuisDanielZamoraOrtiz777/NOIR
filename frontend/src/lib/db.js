import { Pool } from "pg";

let pool;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  const useSSL = process.env.DB_SSL === "true";

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida en las variables de entorno");
  }

  pool = new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  });

  return pool;
}

export async function query(text, params) {
  const poolInstance = getPool();
  const start = Date.now();
  try {
    const res = await poolInstance.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] ${text.slice(0, 50)}... ${duration}ms`);
    return res;
  } catch (error) {
    console.error("[DB ERROR]", error);
    throw error;
  }
}

/**
 * Obtiene un cliente dedicado del pool para ejecutar transacciones multi-sentencia.
 * El caller es responsable de llamar `client.release()` en un bloque `finally`.
 * Ver uso en `frontend/src/app/api/pedidos/route.js`.
 */
export async function getClient() {
  const poolInstance = getPool();
  return poolInstance.connect();
}