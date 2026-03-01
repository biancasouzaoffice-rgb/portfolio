const express = require("express");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");
const { env } = require("../config/env");
const { verifyPassword } = require("../utils/password");

const router = express.Router();

router.post("/admin/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha sao obrigatorios." });
    }

    const adminResult = await pool.query(
      "SELECT id, email, password_hash FROM admins WHERE email = $1 LIMIT 1",
      [email]
    );

    if (adminResult.rowCount === 0) {
      return res.status(401).json({ error: "Credenciais invalidas." });
    }

    const admin = adminResult.rows[0];
    const validPassword = await verifyPassword(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais invalidas." });
    }

    const token = jwt.sign(
      {
        sub: String(admin.id),
        email: admin.email,
        role: "admin"
      },
      env.jwtSecret,
      { expiresIn: "12h" }
    );

    return res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = { authRoutes: router };
