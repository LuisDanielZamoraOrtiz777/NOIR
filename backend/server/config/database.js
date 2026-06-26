const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

console.log("🔍 DATABASE_URL cargada:", connectionString || "NO DEFINIDA - Usando default");

if (!connectionString) {
  console.warn("ADVERTENCIA: DATABASE_URL no está definida. Usando configuración por defecto.");
  console.warn("Crea un archivo .env con DATABASE_URL=postgres://usuario:password@localhost:5432/noir_atelier");
}

const pool = new Pool({
  connectionString: connectionString || "postgres://postgres:12345678@localhost:5432/noir_atelier",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Verificar conexión
pool.on("connect", () => {
  console.log("✅ Conectado a PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Error en la conexión a PostgreSQL:", err);
});

module.exports = pool;