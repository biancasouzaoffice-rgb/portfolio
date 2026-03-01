const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const { token, body, headers = {}, ...rest } = options;
  const requestHeaders = { ...headers };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || "Falha na requisicao.");
  }

  return payload;
}

export const api = {
  getProducts() {
    return request("/products");
  },
  createOrder(orderPayload) {
    return request("/orders", { method: "POST", body: orderPayload });
  },
  getOrder(orderId) {
    return request(`/orders/${orderId}`);
  },
  createCheckoutSession(orderId) {
    return request("/payments/checkout-session", { method: "POST", body: { orderId } });
  },
  confirmMockPayment(orderId) {
    return request("/payments/mock-confirm", { method: "POST", body: { orderId } });
  },
  adminLogin(credentials) {
    return request("/auth/admin/login", { method: "POST", body: credentials });
  },
  getAdminProducts(token) {
    return request("/admin/products", { token });
  },
  createAdminProduct(token, product) {
    return request("/admin/products", { method: "POST", token, body: product });
  },
  updateAdminProduct(token, productId, product) {
    return request(`/admin/products/${productId}`, { method: "PUT", token, body: product });
  },
  deactivateAdminProduct(token, productId) {
    return request(`/admin/products/${productId}`, { method: "DELETE", token });
  },
  getAdminOrders(token) {
    return request("/admin/orders", { token });
  },
  updateAdminOrderStatus(token, orderId, status) {
    return request(`/admin/orders/${orderId}/status`, {
      method: "PATCH",
      token,
      body: { status }
    });
  }
};
