import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const useSSL = process.env.DB_SSL === "true";

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

export const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] ${text.slice(0, 50)}... ${duration}ms`);
    return res;
  } catch (error) {
    console.error("[DB ERROR]", error);
    throw error;
  }
}