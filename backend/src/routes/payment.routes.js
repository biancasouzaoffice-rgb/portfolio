const express = require("express");
const { getOrderById, linkPaymentSession, updateOrderStatus } = require("../services/order.service");
const { createCheckoutForOrder, parseStripeWebhook } = require("../services/stripe.service");

const router = express.Router();

router.post("/checkout-session", async (req, res, next) => {
  try {
    const orderId = req.body?.orderId;
    const order = await getOrderById(orderId);

    if (order.status === "cancelled" || order.status === "shipped") {
      return res.status(409).json({ error: "Pedido em estado invalido para pagamento." });
    }

    const checkout = await createCheckoutForOrder(order);
    await linkPaymentSession(order.id, checkout.provider, checkout.sessionId);

    return res.json({
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/mock-confirm", async (req, res, next) => {
  try {
    const orderId = req.body?.orderId;
    const order = await updateOrderStatus(orderId, "paid");
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
});

async function stripeWebhookHandler(req, res, next) {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Header stripe-signature ausente." });
    }

    const event = parseStripeWebhook(req.body, signature);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = Number.parseInt(session.metadata?.orderId, 10);
      if (Number.isInteger(orderId)) {
        await updateOrderStatus(orderId, "paid");
      }
    }

    return res.json({ received: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  paymentRoutes: router,
  stripeWebhookHandler
};
