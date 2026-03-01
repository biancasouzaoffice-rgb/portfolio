const { pool } = require("../db/pool");

const ORDER_STATUSES = ["pending", "awaiting_payment", "paid", "cancelled", "shipped"];

function toMoney(cents) {
  return Number((cents / 100).toFixed(2));
}

function toCents(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return null;
  }
  return Math.round(number * 100);
}

function ensureText(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    const error = new Error(`Campo obrigatorio: ${fieldName}.`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function serializeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    price: toMoney(row.price_cents),
    stock: row.stock,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeOrder(orderRow, itemRows = []) {
  return {
    id: orderRow.id,
    customerName: orderRow.customer_name,
    customerEmail: orderRow.customer_email,
    shippingAddress: orderRow.shipping_address,
    status: orderRow.status,
    subtotal: toMoney(orderRow.subtotal_cents),
    total: toMoney(orderRow.total_cents),
    paymentProvider: orderRow.payment_provider,
    paymentSessionId: orderRow.payment_session_id,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    items: itemRows.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: toMoney(item.unit_price_cents),
      totalPrice: toMoney(item.total_price_cents)
    }))
  };
}

async function listPublicProducts() {
  const result = await pool.query(
    "SELECT * FROM products WHERE active = true ORDER BY created_at DESC"
  );
  return result.rows.map(serializeProduct);
}

async function listProducts(includeInactive = true) {
  const query = includeInactive
    ? "SELECT * FROM products ORDER BY created_at DESC"
    : "SELECT * FROM products WHERE active = true ORDER BY created_at DESC";
  const result = await pool.query(query);
  return result.rows.map(serializeProduct);
}

async function createProduct(input) {
  const name = ensureText(input.name, "name");
  const description = ensureText(input.description, "description");
  const imageUrl =
    typeof input.imageUrl === "string" && input.imageUrl.trim() ? input.imageUrl.trim() : null;
  const stock = Number.parseInt(input.stock, 10);
  const priceCents = toCents(input.price);

  if (!Number.isInteger(stock) || stock < 0) {
    const error = new Error("Stock invalido.");
    error.status = 400;
    throw error;
  }
  if (!Number.isInteger(priceCents)) {
    const error = new Error("Preco invalido.");
    error.status = 400;
    throw error;
  }

  const created = await pool.query(
    `
      INSERT INTO products (name, description, image_url, price_cents, stock, active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `,
    [name, description, imageUrl, priceCents, stock]
  );
  return serializeProduct(created.rows[0]);
}

async function updateProduct(productId, input) {
  const id = Number.parseInt(productId, 10);
  if (!Number.isInteger(id)) {
    const error = new Error("Produto invalido.");
    error.status = 400;
    throw error;
  }

  const current = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
  if (current.rowCount === 0) {
    const error = new Error("Produto nao encontrado.");
    error.status = 404;
    throw error;
  }

  const base = current.rows[0];
  const name = typeof input.name === "string" ? input.name.trim() : base.name;
  const description = typeof input.description === "string" ? input.description.trim() : base.description;
  const imageUrl = typeof input.imageUrl === "string" ? input.imageUrl.trim() || null : base.image_url;
  const active = typeof input.active === "boolean" ? input.active : base.active;

  const priceCents =
    Object.prototype.hasOwnProperty.call(input, "price") && input.price !== undefined
      ? toCents(input.price)
      : base.price_cents;
  const stock =
    Object.prototype.hasOwnProperty.call(input, "stock") && input.stock !== undefined
      ? Number.parseInt(input.stock, 10)
      : base.stock;

  if (!name) {
    const error = new Error("Nome do produto e obrigatorio.");
    error.status = 400;
    throw error;
  }
  if (!description) {
    const error = new Error("Descricao do produto e obrigatoria.");
    error.status = 400;
    throw error;
  }
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    const error = new Error("Preco invalido.");
    error.status = 400;
    throw error;
  }
  if (!Number.isInteger(stock) || stock < 0) {
    const error = new Error("Stock invalido.");
    error.status = 400;
    throw error;
  }

  const updated = await pool.query(
    `
      UPDATE products
      SET name = $1,
          description = $2,
          image_url = $3,
          price_cents = $4,
          stock = $5,
          active = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `,
    [name, description, imageUrl, priceCents, stock, active, id]
  );

  return serializeProduct(updated.rows[0]);
}

async function deactivateProduct(productId) {
  const id = Number.parseInt(productId, 10);
  if (!Number.isInteger(id)) {
    const error = new Error("Produto invalido.");
    error.status = 400;
    throw error;
  }

  const updated = await pool.query(
    "UPDATE products SET active = false, updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  if (updated.rowCount === 0) {
    const error = new Error("Produto nao encontrado.");
    error.status = 404;
    throw error;
  }
  return serializeProduct(updated.rows[0]);
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Carrinho vazio.");
    error.status = 400;
    throw error;
  }

  const merged = new Map();
  for (const item of items) {
    const productId = Number.parseInt(item.productId, 10);
    const quantity = Number.parseInt(item.quantity, 10);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
      const error = new Error("Item de carrinho invalido.");
      error.status = 400;
      throw error;
    }
    const prev = merged.get(productId) || 0;
    merged.set(productId, prev + quantity);
  }

  return Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

async function createOrder(payload) {
  const customerName = ensureText(payload.customerName, "customerName");
  const customerEmail = ensureText(payload.customerEmail, "customerEmail");
  const shippingAddress = ensureText(payload.shippingAddress, "shippingAddress");
  const normalizedItems = normalizeItems(payload.items);

  const productIds = normalizedItems.map((item) => item.productId);
  const products = await pool.query("SELECT * FROM products WHERE id = ANY($1::int[])", [productIds]);
  const byId = new Map(products.rows.map((row) => [row.id, row]));

  let subtotalCents = 0;
  const resolvedItems = normalizedItems.map((item) => {
    const product = byId.get(item.productId);
    if (!product || !product.active) {
      const error = new Error(`Produto ${item.productId} indisponivel.`);
      error.status = 400;
      throw error;
    }
    if (product.stock < item.quantity) {
      const error = new Error(`Stock insuficiente para ${product.name}.`);
      error.status = 400;
      throw error;
    }

    const lineTotal = product.price_cents * item.quantity;
    subtotalCents += lineTotal;
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPriceCents: product.price_cents,
      totalPriceCents: lineTotal
    };
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderInsert = await client.query(
      `
        INSERT INTO orders (
          customer_name,
          customer_email,
          shipping_address,
          status,
          subtotal_cents,
          total_cents
        )
        VALUES ($1, $2, $3, 'awaiting_payment', $4, $4)
        RETURNING *
      `,
      [customerName, customerEmail, shippingAddress, subtotalCents]
    );
    const order = orderInsert.rows[0];

    for (const item of resolvedItems) {
      await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price_cents,
            total_price_cents
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [order.id, item.productId, item.quantity, item.unitPriceCents, item.totalPriceCents]
      );
    }

    await client.query("COMMIT");
    return getOrderById(order.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getOrderById(orderId) {
  const id = Number.parseInt(orderId, 10);
  if (!Number.isInteger(id)) {
    const error = new Error("Pedido invalido.");
    error.status = 400;
    throw error;
  }

  const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
  if (orderResult.rowCount === 0) {
    const error = new Error("Pedido nao encontrado.");
    error.status = 404;
    throw error;
  }

  const itemResult = await pool.query(
    `
      SELECT
        oi.id,
        oi.product_id,
        p.name AS product_name,
        oi.quantity,
        oi.unit_price_cents,
        oi.total_price_cents
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC
    `,
    [id]
  );

  return serializeOrder(orderResult.rows[0], itemResult.rows);
}

async function listOrders(limit = 50) {
  const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 200) : 50;
  const result = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT $1",
    [safeLimit]
  );

  const orders = [];
  for (const row of result.rows) {
    const order = await getOrderById(row.id);
    orders.push(order);
  }
  return orders;
}

async function linkPaymentSession(orderId, provider, sessionId) {
  const id = Number.parseInt(orderId, 10);
  if (!Number.isInteger(id)) {
    const error = new Error("Pedido invalido.");
    error.status = 400;
    throw error;
  }

  await pool.query(
    `
      UPDATE orders
      SET payment_provider = $1,
          payment_session_id = $2,
          updated_at = NOW()
      WHERE id = $3
    `,
    [provider, sessionId || null, id]
  );
}

async function reserveStockForOrder(client, orderId) {
  const itemsResult = await client.query(
    "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
    [orderId]
  );

  for (const item of itemsResult.rows) {
    const updated = await client.query(
      `
        UPDATE products
        SET stock = stock - $2,
            updated_at = NOW()
        WHERE id = $1 AND stock >= $2
        RETURNING id
      `,
      [item.product_id, item.quantity]
    );
    if (updated.rowCount === 0) {
      const error = new Error("Nao foi possivel confirmar pagamento por falta de stock.");
      error.status = 409;
      throw error;
    }
  }
}

async function updateOrderStatus(orderId, status) {
  const id = Number.parseInt(orderId, 10);
  if (!Number.isInteger(id)) {
    const error = new Error("Pedido invalido.");
    error.status = 400;
    throw error;
  }
  if (!ORDER_STATUSES.includes(status)) {
    const error = new Error("Status de pedido invalido.");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const currentResult = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
    if (currentResult.rowCount === 0) {
      const error = new Error("Pedido nao encontrado.");
      error.status = 404;
      throw error;
    }

    const current = currentResult.rows[0];
    const shouldCommitStock = status === "paid" && !current.stock_committed;
    if (shouldCommitStock) {
      await reserveStockForOrder(client, id);
    }

    await client.query(
      `
        UPDATE orders
        SET status = $1,
            stock_committed = CASE WHEN $1 = 'paid' THEN true ELSE stock_committed END,
            updated_at = NOW()
        WHERE id = $2
      `,
      [status, id]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getOrderById(id);
}

module.exports = {
  ORDER_STATUSES,
  createOrder,
  createProduct,
  deactivateProduct,
  getOrderById,
  linkPaymentSession,
  listOrders,
  listProducts,
  listPublicProducts,
  updateOrderStatus,
  updateProduct
};
