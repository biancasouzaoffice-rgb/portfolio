import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const TOKEN_KEY = "ecommerce_admin_token";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@store.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.adminLogin({ email, password });
      localStorage.setItem(TOKEN_KEY, response.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <section className="section-stack narrow">
      <div className="section-head">
        <h1>Admin Login</h1>
        <p>Entre para gerenciar catalogo, pedidos e status de pagamento.</p>
      </div>

      <article className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </article>

      <Link className="inline-link" to="/">
        Voltar para loja
      </Link>
    </section>
  );
}

export { TOKEN_KEY };
