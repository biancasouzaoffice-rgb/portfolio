import { useState } from "react";
import { api } from "../api";
import { useCart } from "../state/CartContext";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CheckoutPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const orderPayload = {
        customerName,
        customerEmail,
        shippingAddress,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const orderResponse = await api.createOrder(orderPayload);
      const checkoutResponse = await api.createCheckoutSession(orderResponse.order.id);
      window.location.href = checkoutResponse.checkoutUrl;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <section className="section-stack">
      <div className="section-head">
        <h1>Checkout</h1>
        <p>Revise os itens, preencha seus dados e avance para o pagamento.</p>
      </div>

      {items.length === 0 ? (
        <article className="card empty-state">
          <p>Seu carrinho esta vazio.</p>
        </article>
      ) : (
        <div className="checkout-layout">
          <article className="card">
            <h2>Seu carrinho</h2>
            <div className="cart-list">
              {items.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{money.format(item.price)} cada</p>
                  </div>
                  <div className="qty-controls">
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.productId, event.target.value)}
                    />
                    <button type="button" className="ghost" onClick={() => removeItem(item.productId)}>
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="total-row">
              Subtotal: <strong>{money.format(subtotal)}</strong>
            </p>
          </article>

          <article className="card">
            <h2>Dados de entrega</h2>
            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                Nome
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Endereco
                <textarea
                  rows="3"
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  required
                />
              </label>

              {error ? <p className="error-text">{error}</p> : null}

              <button type="submit" disabled={submitting}>
                {submitting ? "Processando..." : "Finalizar e pagar"}
              </button>
            </form>
          </article>
        </div>
      )}
    </section>
  );
}
