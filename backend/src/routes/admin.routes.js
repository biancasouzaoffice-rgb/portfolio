const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const {
  ORDER_STATUSES,
  createProduct,
  deactivateProduct,
  listOrders,
  listProducts,
  updateOrderStatus,
  updateProduct
} = require("../services/order.service");

const router = express.Router();

router.use(requireAdmin);

router.get("/products", async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive !== "false";
    const products = await listProducts(includeInactive);
    return res.json({ items: products });
  } catch (error) {
    return next(error);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const product = await createProduct(req.body || {});
    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
});

router.put("/products/:productId", async (req, res, next) => {
  try {
    const product = await updateProduct(req.params.productId, req.body || {});
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

router.delete("/products/:productId", async (req, res, next) => {
  try {
    const product = await deactivateProduct(req.params.productId);
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10);
    const orders = await listOrders(limit);
    return res.json({ items: orders, statuses: ORDER_STATUSES });
  } catch (error) {
    return next(error);
  }
});

router.patch("/orders/:orderId/status", async (req, res, next) => {
  try {
    const status = String(req.body?.status || "");
    const order = await updateOrderStatus(req.params.orderId, status);
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
});

module.exports = { adminRoutes: router };
