# JLsaborperfeito

Site para dona de loja de doces.

Aplicação em Next.js com painel privado para a confeiteira editar o cardápio manualmente, subir imagens, ajustar preços e alterar os textos do banner principal. O login usa códigos enviados por e-mail (OTP) e os dados são persistidos via Prisma/SQLite durante o desenvolvimento.

## Scripts

- `npm run dev` – ambiente de desenvolvimento (http://localhost:3000)
- `npm run build` – build de produção
- `npm run start` – serve o build
- `npm run lint` – ESLint

## Estrutura

- `src/app` – páginas e rotas do App Router
- `src/components` – componentes de UI (painel da dona, listagem de produtos etc.)
- `src/lib` – helpers (auth, pricing, mailer, Prisma)
- `src/app/api` – rotas protegidas (auth, products, uploads, site-config)

## Ambiente

Configure o arquivo `.env` com as variáveis:

```
DATABASE_URL="file:./dev.db"
OWNER_EMAIL="pinheiroaqui@gmail.com"
OWNER_NAME="Dona Caramelo"
OWNER_SESSION_SECRET="troque-por-um-segredo"
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASSWORD=...
MAILER_FROM="Doces da Dona <nao-responda@docesdadona.com>"
```

Para produção, use uma instância de banco externa (ex.: Postgres) e credenciais SMTP reais.
