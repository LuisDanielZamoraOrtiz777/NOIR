const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

function generarHash(password) {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

// Si se ejecuta desde línea de comandos: node generate-hash.js "mi_password"
const password = process.argv[2];

if (!password) {
  console.log("Uso: node generate-hash.js <password>");
  console.log("Ejemplo: node generate-hash.js 'MiPasswordSeguro123'");
  process.exit(1);
}

const hash = generarHash(password);
console.log("\n========================================");
console.log("Hash bcrypt generado:");
console.log("========================================");
console.log(hash);
console.log("========================================");
console.log("\nCopia este hash y reemplázalo en:");
console.log("1. backend/server/schema.sql (en el seed data)");
console.log("2. backend/server/routes/auth.js (en usuarioSimulado.password_hash)");
console.log("\nPara actualizar un usuario existente en PostgreSQL:");
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@noiratelier.com';`);