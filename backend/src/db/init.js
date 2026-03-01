const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");
const { env } = require("../config/env");
const { hashPassword } = require("../utils/password");

async function initDb() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schemaSql);
}

async function ensureAdmin() {
  const email = env.adminEmail.toLowerCase();
  const check = await pool.query("SELECT id FROM admins WHERE email = $1 LIMIT 1", [email]);

  if (check.rowCount > 0) {
    return;
  }

  const passwordHash = await hashPassword(env.adminPassword);
  await pool.query(
    "INSERT INTO admins (email, password_hash) VALUES ($1, $2)",
    [email, passwordHash]
  );
}

module.exports = { initDb, ensureAdmin };
