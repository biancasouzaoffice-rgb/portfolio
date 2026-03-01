const express = require("express");
const { listPublicProducts } = require("../services/order.service");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const products = await listPublicProducts();
    return res.json({ items: products });
  } catch (error) {
    return next(error);
  }
});

module.exports = { productRoutes: router };
