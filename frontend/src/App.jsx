import { NavLink, Route, Routes } from "react-router-dom";
import { useCart } from "./state/CartContext";
import { StorePage } from "./pages/StorePage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CheckoutResultPage } from "./pages/CheckoutResultPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

function Header() {
  const { totalItems } = useCart();

  return (
    <header className="topbar">
      <div className="container topbar-content">
        <NavLink className="brand" to="/">
          Atlas Commerce
        </NavLink>

        <nav className="main-nav">
          <NavLink to="/" end>
            Loja
          </NavLink>
          <NavLink to="/checkout">Checkout</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>

        <NavLink className="cart-pill" to="/checkout">
          Carrinho <strong>{totalItems}</strong>
        </NavLink>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="container page-content">
        <Routes>
          <Route path="/" element={<StorePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutResultPage mode="success" />} />
          <Route path="/checkout/cancel" element={<CheckoutResultPage mode="cancel" />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}
