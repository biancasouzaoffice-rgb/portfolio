const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente." });
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado." });
    }
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalido ou expirado." });
  }
}

module.exports = { requireAdmin };
