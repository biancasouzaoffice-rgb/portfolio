import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { TOKEN_KEY } from "./AdminLoginPage";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function emptyProduct() {
  return {
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    stock: ""
  };
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productForm, setProductForm] = useState(() => emptyProduct());
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingStatus, setSavingStatus] = useState(null);
  const [editing, setEditing] = useState({});

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    let alive = true;
    async function loadAll() {
      try {
        const [productsResponse, ordersResponse] = await Promise.all([
          api.getAdminProducts(token),
          api.getAdminOrders(token)
        ]);
        if (!alive) {
          return;
        }
        setProducts(productsResponse.items || []);
        setOrders(ordersResponse.items || []);
        setStatuses(ordersResponse.statuses || []);
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

    loadAll();
    return () => {
      alive = false;
    };
  }, [navigate, token]);

  const grossRevenue = useMemo(
    () => orders.filter((order) => order.status === "paid").reduce((sum, order) => sum + order.total, 0),
    [orders]
  );

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    navigate("/admin/login");
  }

  async function refreshOrders() {
    const response = await api.getAdminOrders(token);
    setOrders(response.items || []);
    setStatuses(response.statuses || []);
  }

  async function refreshProducts() {
    const response = await api.getAdminProducts(token);
    setProducts(response.items || []);
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setSavingProduct(true);
    setError("");
    try {
      await api.createAdminProduct(token, {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock)
      });
      setProductForm(emptyProduct());
      await refreshProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProduct(false);
    }
  }

  function setEditValue(productId, field, value) {
    setEditing((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value
      }
    }));
  }

  function editFor(product) {
    return editing[product.id] || {
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl || "",
      price: product.price,
      stock: product.stock,
      active: product.active
    };
  }

  async function saveProduct(product) {
    const draft = editFor(product);
    try {
      await api.updateAdminProduct(token, product.id, {
        ...draft,
        price: Number(draft.price),
        stock: Number(draft.stock)
      });
      await refreshProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function disableProduct(productId) {
    try {
      await api.deactivateAdminProduct(token, productId);
      await refreshProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(orderId, status) {
    setSavingStatus(orderId);
    setError("");
    try {
      await api.updateAdminOrderStatus(token, orderId, status);
      await refreshOrders();
      await refreshProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStatus(null);
    }
  }

  if (loading) {
    return <p>Carregando painel...</p>;
  }

  return (
    <section className="section-stack">
      <div className="section-head with-actions">
        <div>
          <h1>Painel administrativo</h1>
          <p>Gerencie catalogo, pedidos e status de fulfillment.</p>
        </div>
        <button className="ghost" type="button" onClick={logout}>
          Sair
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="stats-grid">
        <article className="card stat-card">
          <span>Pedidos totais</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="card stat-card">
          <span>Faturamento (pagos)</span>
          <strong>{money.format(grossRevenue)}</strong>
        </article>
        <article className="card stat-card">
          <span>Produtos cadastrados</span>
          <strong>{products.length}</strong>
        </article>
      </div>

      <article className="card">
        <h2>Novo produto</h2>
        <form onSubmit={handleCreateProduct} className="form-grid">
          <label>
            Nome
            <input
              type="text"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Descricao
            <input
              type="text"
              value={productForm.description}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, description: event.target.value }))
              }
              required
            />
          </label>
          <label>
            URL da imagem
            <input
              type="url"
              value={productForm.imageUrl}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))
              }
            />
          </label>
          <label>
            Preco
            <input
              type="number"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              min="0"
              step="1"
              value={productForm.stock}
              onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
              required
            />
          </label>
          <button type="submit" disabled={savingProduct}>
            {savingProduct ? "Salvando..." : "Criar produto"}
          </button>
        </form>
      </article>

      <article className="card">
        <h2>Produtos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Preco</th>
                <th>Stock</th>
                <th>Ativo</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const draft = editFor(product);
                return (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(event) => setEditValue(product.id, "name", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.price}
                        onChange={(event) => setEditValue(product.id, "price", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={draft.stock}
                        onChange={(event) => setEditValue(product.id, "stock", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(draft.active)}
                        onChange={(event) => setEditValue(product.id, "active", event.target.checked)}
                      />
                    </td>
                    <td className="actions-col">
                      <button type="button" className="small" onClick={() => saveProduct(product)}>
                        Salvar
                      </button>
                      <button type="button" className="small ghost" onClick={() => disableProduct(product.id)}>
                        Desativar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card">
        <h2>Pedidos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Status</th>
                <th>Atualizar</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <strong>{order.customerName}</strong>
                    <p>{order.customerEmail}</p>
                  </td>
                  <td>{money.format(order.total)}</td>
                  <td>{order.status}</td>
                  <td className="actions-col">
                    <select
                      defaultValue={order.status}
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                      disabled={savingStatus === order.id}
                    >
                      {statuses.map((status) => (
                        <option key={`${order.id}-${status}`} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <Link className="inline-link" to="/">
        Ir para loja
      </Link>
    </section>
  );
}
