# Deploy Publico (Render + Vercel)

Este projeto usa:

- Backend API: Node.js + PostgreSQL (Render)
- Frontend: React/Vite (Vercel)

## 1) Publicar Backend no Render

1. Acesse https://render.com e conecte o repositorio.
2. Crie um banco PostgreSQL:
   - `New` -> `PostgreSQL`
   - Nome sugerido: `ecommerce-db`
   - Copie o `External Database URL` apos criar.
3. Crie o servico web da API:
   - `New` -> `Blueprint`
   - Selecione este repositorio (usa `render.yaml`).
   - O servico criado sera `ecommerce-api`.
4. Configure as variaveis no servico `ecommerce-api`:
   - `DATABASE_URL`: URL externa do banco Render
   - `JWT_SECRET`: um segredo forte
   - `ADMIN_PASSWORD`: senha admin
   - `ADMIN_EMAIL`: `admin@store.com` (ou seu email)
   - `FRONTEND_URL`: temporariamente `https://example.vercel.app`
   - `CORS_ORIGIN`: temporariamente `https://example.vercel.app`
   - `STRIPE_SECRET_KEY`: opcional
   - `STRIPE_WEBHOOK_SECRET`: opcional
5. Deploy da API:
   - URL esperada: `https://ecommerce-api-xxxx.onrender.com`
   - Teste: `https://ecommerce-api-xxxx.onrender.com/health`

## 2) Publicar Frontend no Vercel

1. Acesse https://vercel.com e importe o mesmo repositorio.
2. No import, configure:
   - `Root Directory`: `frontend`
   - Framework: Vite
3. Variavel de ambiente do frontend:
   - `VITE_API_URL`: `https://ecommerce-api-xxxx.onrender.com/api`
4. Clique em Deploy.
   - URL esperada: `https://seu-projeto.vercel.app`

## 3) Fechar CORS no Backend

Depois de ter a URL real do frontend no Vercel:

1. Volte no Render (`ecommerce-api`).
2. Atualize:
   - `FRONTEND_URL`: `https://seu-projeto.vercel.app`
   - `CORS_ORIGIN`: `https://seu-projeto.vercel.app`
3. Redeploy do backend.

## 4) URLs finais

- Loja: `https://seu-projeto.vercel.app`
- Admin: `https://seu-projeto.vercel.app/admin/login`
- API health: `https://ecommerce-api-xxxx.onrender.com/health`

## Login admin inicial

- Email: valor de `ADMIN_EMAIL`
- Senha: valor de `ADMIN_PASSWORD`
