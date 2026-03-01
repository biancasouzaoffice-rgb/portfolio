const dotenv = require("dotenv");

dotenv.config();

function value(name, fallback = "") {
  const found = process.env[name];
  if (typeof found === "string" && found.trim()) {
    return found.trim();
  }
  return fallback;
}

const env = {
  nodeEnv: value("NODE_ENV", "development"),
  port: Number(value("PORT", "4000")),
  databaseUrl: value("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/ecommerce"),
  jwtSecret: value("JWT_SECRET", "change_this_secret"),
  adminEmail: value("ADMIN_EMAIL", "admin@store.com"),
  adminPassword: value("ADMIN_PASSWORD", "admin123"),
  corsOrigin: value("CORS_ORIGIN", "http://localhost:5173"),
  frontendUrl: value("FRONTEND_URL", "http://localhost:5173"),
  stripeSecretKey: value("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: value("STRIPE_WEBHOOK_SECRET")
};

module.exports = { env };
