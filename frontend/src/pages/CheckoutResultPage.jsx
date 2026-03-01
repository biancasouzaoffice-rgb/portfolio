import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useCart } from "../state/CartContext";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CheckoutResultPage({ mode }) {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function resolveOrder() {
      const orderId = searchParams.get("orderId");
      const isMock = searchParams.get("mock") === "true";
      if (!orderId) {
        if (alive) {
          setLoading(false);
          setError("Pedido nao encontrado no retorno do checkout.");
        }
        return;
      }

      try {
        if (mode === "success") {
          if (isMock) {
            await api.confirmMockPayment(orderId);
          }
          clearCart();
        }
        const response = await api.getOrder(orderId);
        if (alive) {
          setOrder(response.order);
        }
      } catch (err) {
        if (alive) {
          setError(err.message);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    resolveOrder();
    return () => {
      alive = false;
    };
  }, [clearCart, mode, searchParams]);

  if (loading) {
    return <p>Consultando status do pedido...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="section-stack">
      <div className="section-head">
        <h1>{mode === "success" ? "Pagamento concluido" : "Pagamento cancelado"}</h1>
        <p>Status atual: <strong>{order?.status || "indefinido"}</strong></p>
      </div>

      {order ? (
        <article className="card">
          <h2>Pedido #{order.id}</h2>
          <p>
            <strong>Cliente:</strong> {order.customerName}
          </p>
          <p>
            <strong>Email:</strong> {order.customerEmail}
          </p>
          <p>
            <strong>Endereco:</strong> {order.shippingAddress}
          </p>
          <hr />
          <ul className="order-items">
            {order.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.productName} x{item.quantity}
                </span>
                <strong>{money.format(item.totalPrice)}</strong>
              </li>
            ))}
          </ul>
          <p className="total-row">
            Total: <strong>{money.format(order.total)}</strong>
          </p>
        </article>
      ) : null}

      <Link className="inline-link" to="/">
        Voltar para a loja
      </Link>
    </section>
  );
}
