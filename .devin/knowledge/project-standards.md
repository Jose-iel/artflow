# ArtFlow — Project Standards (Knowledge Base)

> Fonte de verdade para revisões de código, geração de specs e implementação.
> Consolidado a partir de `.devin/rules/artflow-rules.md`, `SETUP.md`,
> `docs/agents/*` e da leitura do código-fonte.

---

## 1. Visão Geral

ArtFlow é uma aplicação full-stack de **gestão de conteúdo/posts para redes
sociais**, com controle de acesso baseado em **hierarquia de papéis**.

- **Backend:** Node.js + Express + TypeScript + TypeORM + PostgreSQL — API em `/api`, porta `3333`.
- **Frontend:** React 19 + Vite + TypeScript + TailwindCSS — porta `3000`.
- **Infra:** Docker Compose + Nginx + PostgreSQL + pgAdmin.

---

## 2. Estrutura de Pastas

```
artflow/
├── backend/
│   └── src/
│       ├── controllers/   # admin, auth, post, user, squad, empresa, upload, cleanup
│       ├── entities/      # Empresa, Squad, User, Cliente, Post (TypeORM)
│       ├── routes/        # index.ts + rotas por recurso
│       ├── middlewares/   # auth, permissions, validation
│       ├── services/      # upload, squad, cleanup, post-scheduler, file-validator
│       ├── repositories/  # acesso a dados
│       ├── dtos/          # validação de input
│       ├── config/        # data-source (TypeORM)
│       ├── utils/         # AppError, etc.
│       └── __tests__/     # Jest + Supertest
├── frontend/
│   └── src/
│       ├── features/      # auth, admin, dashboard, posts, profile
│       ├── pages/         # admin, funcionarios, posts
│       ├── components/    # UI compartilhada
│       ├── layouts/       # Layout com Outlet
│       ├── routes/        # ProtectedRoute, DashboardRouter
│       ├── services/      # api.ts (axios), adminApi, funcionarioApi
│       ├── stores/        # authStore (Zustand)
│       ├── hooks/ types/ mocks/
└── docker/ database/ pgadmin/
```

---

## 3. Domínio (Modelo de Dados)

Hierarquia: **Empresa → Squad → (User + Cliente) → Post**

- **Empresa:** `nome`, `cnpj` (único), `descricao`, `ativo` → tem muitas `Squad`.
- **Squad:** `nome`, `descricao`, `ativo`, `empresaId` → tem `funcionarios` (User), `clientes` (Cliente) e `posts`.
- **User:** `nome`, `email` (único), `senha`, `ativo`, `role`, `squadId?`.
- **Cliente:** `nome`, `email` (único), `senha`, `ativo`, `squadId?` (entidade legada de autenticação).
- **Post:** `clienteId`, `createdById?`, `squadId`, `dataPostagem`, `dataAgendada?`, `imagePath?`, `media` (jsonb — carrossel), `legenda?`, `status`, `comentarioCliente?`, `comentarioAdmin?`.

### Enums
- **`UserRole`** (`entities/User.ts`): `ADMIN_MASTER`, `FUNCIONARIO`, `CLIENT`.
  - ⚠️ O frontend (`authStore.ts`) ainda referencia um `SUPER_USER` legado.
- **`PostStatus`** (`entities/Post.ts`): `Aprovado`, `Não aprovado`, `Agendado`, `Publicado`.

### Convenção de colunas
- Colunas no banco em `snake_case` (`criado_em`, `data_agendada`, `cliente_id`) mapeadas para `camelCase` nas entities via `name:`.
- Timestamps: `timestamp with time zone`. PKs: `uuid`.

---

## 4. Convenções de Código (OBRIGATÓRIO)

### Exports
- ✅ **Sempre named exports** — `export { Component }`, `export type { Props }`.
- ❌ **Nunca default exports.**
  - ⚠️ Exceção legada conhecida: `frontend/src/App.tsx` ainda usa `export default`. Novo código não deve seguir esse padrão.

### TypeScript
- **Nunca** usar `any` — usar `unknown` quando necessário.
- Tipar todas as funções e parâmetros.
- `interface` para objetos; `type` para unions/primitivos.

### Nomenclatura
- **Arquivos:** `PascalCase` para componentes/entities; `camelCase` para utils/services.
- **Variáveis/Funções:** `camelCase`.
- **Classes/Interfaces/Types/Enums:** `PascalCase`.
- **Constantes:** `UPPER_SNAKE_CASE`.
- **Testes:** `*.test.ts` / `*.test.tsx`.

---

## 5. Padrões de Backend

- **Auth:** JWT via header `Authorization: Bearer <token>`. Payload `{ id, email, type: 'user' | 'cliente' }`. Middleware `authenticateToken` popula `req.user = { id, email, role, squadId, empresaId }`.
- **Autorização:** usar helpers de `middlewares/permissions.ts` — `requireRole([...])`, `requireAdminMaster`, `requireFuncionarioOrAdmin`, `requireSameSquad`, `requireSameEmpresa`, `canAccessUser`, `canAccessCliente`.
  - `ADMIN_MASTER` acessa tudo; `FUNCIONARIO` restrito à própria squad; `CLIENT` restrito aos próprios dados.
- **Erros:** lançar `AppError(message, statusCode)`. O handler global em `app.ts` formata `{ status: 'error', message }`. Usar `express-async-errors` (não é preciso try/catch só para repassar erro).
- **Respostas:** padrão `{ status, message?, data? }`.
- **Validação:** Celebrate + class-validator + DTOs (`dtos/`). Validar body, query e params.
- **Senhas:** hash com bcrypt. ⚠️ Salt rounds **inconsistente** no código: `auth.controller`/`admin.controller` usam `8`; `user.controller`/`squad.service` usam `10` — deve ser padronizado. Nunca retornar `senha` em respostas.
- **Uploads:** servidos em `/uploads`; validação em `file-validator.service.ts`.

---

## 6. Padrões de Frontend

- **HTTP:** usar `services/api.ts` (axios) e helpers `apiGet/apiPost/apiPut/apiPatch/apiDelete`. Não criar instâncias axios avulsas.
- **Auth state:** `stores/authStore.ts` (Zustand + persist em `auth-storage`). Token injetado via interceptor; `401` faz logout + redirect `/login`.
- **Server state:** TanStack React Query. **Client state:** Zustand.
- **Forms:** React Hook Form + Zod (`@hookform/resolvers`).
- **Rotas:** React Router v7; rotas protegidas via `ProtectedRoute` + `Layout` (Outlet).
- **UI:** TailwindCSS, Headless UI, Lucide/Heroicons. Recharts para gráficos.
- **Env:** ⚠️ **Mismatch real no projeto** — `services/api.ts` lê `import.meta.env.VITE_API_URL`, mas `.env.example` e `vite-env.d.ts` declaram `VITE_API_BASE_URL`. A variável lida não é a declarada; cai sempre no fallback `http://localhost:3333/api`. Deve ser unificado.

---

## 7. Testes

- **Backend:** Jest + Supertest — `pnpm test`, `pnpm test:coverage`.
- **Frontend:** Vitest + Testing Library + MSW — `pnpm test`, `pnpm test:coverage`.
- Toda alteração de lógica de negócio ou endpoint deve vir acompanhada de teste.

---

## 8. Segurança (pontos sensíveis do projeto)

- JWT com expiração; `JWT_SECRET` **sempre** via env, nunca hardcoded.
- Senhas: bcrypt com salt rounds inconsistente (`8` vs `10`) entre controllers/services — padronizar.
- CORS configurado por `CORS_ORIGIN` (multi-origin) em `app.ts`.
- Isolamento entre squads/empresas — validar sempre que um recurso pertence ao escopo do usuário (cross-tenant).
- Não commitar `.env`. Body parser limitado a 500mb (atenção a abuso de upload).
- Nunca logar tokens, senhas ou PII.

---

## 9. Scripts Úteis

```bash
# Raiz
pnpm compose:up        # sobe containers (build)
pnpm compose:down      # derruba containers
pnpm compose:prune     # apaga volumes (banco + pgadmin)

# Backend (cd backend)
pnpm dev | build | lint | format | test

# Frontend (cd frontend)
pnpm dev | build | preview | lint | format | test
```

### Credenciais de desenvolvimento (seed)
- Admin: `admin@artflow.com` / `senha123`
- Cliente: `cliente@teste.com` / `senha123`
