# JLsaborperfeito

Loja virtual de doces artesanais construída em Next.js (App Router) com carrinho, checkout simulado, cupons e um painel privado para a dona cadastrar novidades ou ajustar preços. A vitrine usa o tema “JLsaborperfeito” e todo o conteúdo do banner/painel pode ser editado pela dona diretamente no site.

## Scripts

- `npm run dev` – ambiente de desenvolvimento (`http://localhost:3000`)
- `npm run build` – build de produção
- `npm run start` – serve o build gerado
- `npm run lint` – verifica o projeto com ESLint

## Rodando local

```bash
npm install
npx prisma db execute --file prisma/migration.sql --schema prisma/schema.prisma
node prisma/seed.mjs          # popula doces, cupons e pedidos de exemplo
npm run dev
```

> Se preferir deixar o Prisma criar a estrutura automaticamente, use `npx prisma db push` em vez do `db execute`.

## Estrutura

- `src/app` – páginas, layouts e rotas do App Router (cardápio, carrinho, checkout, orders e painel).
- `src/components` – componentes de UI (owner panel, header, product grid etc.).
- `src/app/api` – rotas REST protegidas (auth OTP, products CRUD, coupons, checkout, uploads e site-config).
- `src/lib` – helpers de autenticação, pricing, Prisma, mailer e server actions.
- `prisma` – schema, migrações e scripts de seed.

## Variáveis de ambiente

```
DATABASE_URL="file:./dev.db"
STRIPE_SECRET_KEY="sk_test_xxx"        # opcional para checkout real
OWNER_EMAIL="pinheiroaqui@gmail.com"
OWNER_NAME="Dona Caramelo"
OWNER_SESSION_SECRET="troque-por-um-segredo"
OWNER_CODE_TTL_MINUTES="10"
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASSWORD=...
MAILER_FROM="Doces da Dona <nao-responda@docesdadona.com>"
```

> **Preparando para Cloudflare Pages**  
> Ao configurar o projeto no painel da Cloudflare, cadastre exatamente os nomes acima em **Settings → Environment variables**. Para produção, substitua `DATABASE_URL` por um banco acessível pela Cloudflare (ex.: Postgres gerenciado, Supabase, PlanetScale ou Cloudflare D1). Anote a URL de conexão desse banco e cole no lugar de `file:./dev.db`. As chaves `OWNER_*`, `SMTP_*` e `MAILER_FROM` permanecem iguais — apenas utilize credenciais de e-mail reais para que o código OTP chegue na caixa de entrada.

Sem SMTP configurado o modo dev apenas loga o código OTP no console; em produção use credenciais reais.

## Flows implementados

- **Cardápio e detalhe do doce** (`/` e `/product/[slug]`)
- **Carrinho e aplicação de cupom** (`/cart`)
- **Checkout simulado** com integração Stripe fake ou sandbox (`/checkout`)
- **Histórico do cliente** (`/orders`)
- **Painel da dona** (`/#painel-da-dona`) com login via código OTP, CRUD manual do cardápio, upload de imagens e edição dos textos do banner.
- **GraphQL** (`/api/graphql`) expondo `products`, `orders(email)` e `placeOrder`.

## APIs principais

- `GET /api/products` – lista doces
- `POST /api/products` – cria doces (autenticado)
- `PATCH /api/products/:id` e `DELETE /api/products/:id` – ajustes/remoções autenticadas
- `POST /api/coupons` – validação de cupons no carrinho
- `POST /api/checkout` e `POST /api/orders` – cálculo final e persistência de pedidos
- `POST /api/uploads/product-image` – upload autenticado em `public/uploads`
- `POST /api/auth/request-code`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`
- `POST /api/site-config` – edição do título/descrição do banner e cards

## Notas rápidas

- Frete: R$25 até atingir o limite gratuito (`FREE_SHIPPING_FROM = 30000` centavos).
- Cupons seed: `BEMVINDO10`, `FRETEGRATIS`, `VEMDOCARAMELO`.
- Preços são armazenados em centavos.
- O painel usa contextos + React Query para refletir o cardápio atualizado sem precisar recarregar a página.
