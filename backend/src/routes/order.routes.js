const express = require("express");
const { createOrder, getOrderById } = require("../services/order.service");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const order = await createOrder(req.body || {});
    return res.status(201).json({ order });
  } catch (error) {
    return next(error);
  }
});

router.get("/:orderId", async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.orderId);
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
});

module.exports = { orderRoutes: router };
