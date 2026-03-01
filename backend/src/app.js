const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { env } = require("./config/env");
const { authRoutes } = require("./routes/auth.routes");
const { productRoutes } = require("./routes/product.routes");
const { orderRoutes } = require("./routes/order.routes");
const { paymentRoutes, stripeWebhookHandler } = require("./routes/payment.routes");
const { adminRoutes } = require("./routes/admin.routes");
const { errorHandler } = require("./middleware/error-handler");

const app = express();

app.use(
  cors({
    origin: env.corsOrigin.split(",").map((origin) => origin.trim()),
    credentials: false
  })
);
app.use(helmet());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ecommerce-api" });
});

app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Rota nao encontrada." });
});
app.use(errorHandler);

module.exports = { app };
