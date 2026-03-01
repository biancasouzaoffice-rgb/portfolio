import { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../state/CartContext";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function StorePage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQty, setSelectedQty] = useState({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const response = await api.getProducts();
        if (!alive) {
          return;
        }
        setProducts(response.items || []);
      } catch (err) {
        if (!alive) {
          return;
        }
        setError(err.message);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  function qtyFor(product) {
    const current = selectedQty[product.id];
    if (Number.isInteger(current) && current > 0) {
      return Math.min(current, product.stock);
    }
    return 1;
  }

  function setQty(productId, value) {
    const parsed = Number.parseInt(value, 10);
    setSelectedQty((prev) => ({
      ...prev,
      [productId]: Number.isInteger(parsed) && parsed > 0 ? parsed : 1
    }));
  }

  function handleAdd(product) {
    const amount = qtyFor(product);
    addItem(product, amount);
    setFeedback(`Adicionado: ${product.name} (x${amount})`);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  if (loading) {
    return <p>Carregando produtos...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="section-stack">
      <div className="section-head">
        <h1>Loja</h1>
        <p>Catalogo com carrinho e checkout integrado ao backend.</p>
      </div>

      {feedback ? <p className="success-text">{feedback}</p> : null}

      <div className="product-grid">
        {products.map((product) => (
          <article key={product.id} className="card product-card">
            <img src={product.imageUrl} alt={product.name} loading="lazy" />
            <div className="product-info">
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <p className="price">{money.format(product.price)}</p>
              <p className="stock">Stock: {product.stock}</p>
            </div>
            <div className="product-actions">
              <input
                type="number"
                min="1"
                max={product.stock}
                value={qtyFor(product)}
                onChange={(event) => setQty(product.id, event.target.value)}
              />
              <button
                type="button"
                onClick={() => handleAdd(product)}
                disabled={product.stock <= 0}
              >
                {product.stock > 0 ? "Adicionar ao carrinho" : "Sem stock"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
