const Stripe = require("stripe");
const { env } = require("../config/env");

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

async function createCheckoutForOrder(order) {
  if (!stripe) {
    return {
      provider: "mock",
      sessionId: null,
      checkoutUrl: `${env.frontendUrl}/checkout/success?mock=true&orderId=${order.id}`
    };
  }

  const lineItems = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "brl",
      unit_amount: Math.round(item.unitPrice * 100),
      product_data: {
        name: item.productName
      }
    }
  }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${env.frontendUrl}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendUrl}/checkout/cancel?orderId=${order.id}`,
    metadata: {
      orderId: String(order.id)
    }
  });

  return {
    provider: "stripe",
    sessionId: session.id,
    checkoutUrl: session.url
  };
}

function parseStripeWebhook(rawBody, signature) {
  if (!stripe) {
    const error = new Error("Stripe nao configurado.");
    error.status = 400;
    throw error;
  }

  if (!env.stripeWebhookSecret) {
    const error = new Error("STRIPE_WEBHOOK_SECRET nao definido.");
    error.status = 400;
    throw error;
  }

  return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

module.exports = { createCheckoutForOrder, parseStripeWebhook };
