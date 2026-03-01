CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('pending', 'awaiting_payment', 'paid', 'cancelled', 'shipped')),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  payment_provider TEXT,
  payment_session_id TEXT,
  stock_committed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

INSERT INTO products (name, description, image_url, price_cents, stock)
SELECT * FROM (
  VALUES
    ('Camiseta Minimal', 'Camiseta premium algodao 100% com corte unissex.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 9900, 30),
    ('Tenis Urbano', 'Tenis casual com sola reforcada para uso diario.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', 24990, 18),
    ('Mochila Tech', 'Mochila impermeavel com compartimento para notebook 16".', 'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7', 18990, 22),
    ('Fone Bluetooth', 'Fone sem fio com cancelamento de ruido ativo.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', 32990, 15)
) AS seed(name, description, image_url, price_cents, stock)
WHERE NOT EXISTS (SELECT 1 FROM products);
