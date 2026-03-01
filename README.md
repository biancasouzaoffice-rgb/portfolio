# E-Commerce Platform (React + Node.js + PostgreSQL)

Projeto completo de e-commerce com:

- Vitrine de produtos
- Carrinho de compras
- Checkout com criacao de pedido
- Pagamento por Stripe (ou modo mock para desenvolvimento)
- Painel administrativo (login JWT, gestao de produtos e pedidos)

## Estrutura

- `frontend/`: React + Vite
- `backend/`: Node.js + Express + PostgreSQL
- `docker-compose.yml`: banco PostgreSQL local

## Pre-requisitos

- Node.js 18+
- Docker + Docker Compose

## 1) Subir o PostgreSQL

```bash
docker compose up -d postgres
```

## 2) Configurar backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Observacoes:

- O schema e criado automaticamente no startup (`src/db/schema.sql`).
- Um admin inicial e criado com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
- Se `STRIPE_SECRET_KEY` nao for definido, o fluxo usa pagamento mock.

## 3) Configurar frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000`

## Credenciais admin padrao

- Email: `admin@store.com`
- Senha: `admin123`

## Endpoints principais

- `GET /api/products`
- `POST /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/payments/checkout-session`
- `POST /api/payments/mock-confirm`
- `POST /api/auth/admin/login`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:productId`
- `DELETE /api/admin/products/:productId`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:orderId/status`

## Status de pedidos

- `pending`
- `awaiting_payment`
- `paid`
- `cancelled`
- `shipped`

## Deploy publico

Instrucoes em [DEPLOY.md](./DEPLOY.md) para publicar:

- Backend no Render
- Frontend no Vercel
