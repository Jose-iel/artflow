---
trigger: manual
---

# ArtFlow - Iel Company

> Este arquivo centraliza as informações do projeto ArtFlow.
> Para detalhes técnicos específicos de cada camada, consulte os arquivos referenciados abaixo.

## 📁 Estrutura do Projeto

```
artflow/
├── backend/          # API Express + TypeORM + PostgreSQL
├── frontend/         # React 19 + Vite + TailwindCSS
├── database/         # Scripts SQL de inicialização
├── docker/           # Docker Compose para desenvolvimento
└── pgadmin/          # Configuração do PgAdmin
```

## 🛠️ Stack Tecnológica

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** TypeORM
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT (jsonwebtoken)
- **Validação:** Celebrate + class-validator
- **Testes:** Jest + Supertest

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS
- **Estado Global:** Zustand
- **Data Fetching:** TanStack React Query
- **Formulários:** React Hook Form + Zod
- **Ícones:** Lucide React + Heroicons
- **UI Components:** Headless UI
- **Testes:** Vitest + Testing Library

---

## 📐 Regras Gerais

### Exports
```typescript
// ✅ SEMPRE named exports
export { Component };
export { PostController };
export type { ComponentProps };

// ❌ NUNCA default exports
export default Component;
```

### TypeScript
- **Nunca** usar `any` - usar `unknown` se necessário
- Tipar todas as funções e parâmetros
- Usar interfaces para objetos, types para unions/primitivos

### Nomenclatura
- **Arquivos:** `PascalCase` para componentes, `camelCase` para utils
- **Variáveis/Funções:** `camelCase`
- **Classes/Interfaces/Types:** `PascalCase`
- **Constantes:** `UPPER_SNAKE_CASE`
- **Arquivos de teste:** `*.test.ts` ou `*.test.tsx`

---

## 🧪 Testes

### Backend (Jest)
```bash
pnpm test              # Rodar todos os testes
pnpm test:watch        # Watch mode
pnpm test:coverage     # Com cobertura
```

### Frontend (Vitest)
```bash
pnpm test              # Rodar todos os testes
pnpm test:watch        # Watch mode
pnpm test:ui           # Interface visual
pnpm test:coverage     # Com cobertura
```

---

## 🚀 Scripts de Desenvolvimento

### Geral
```bash
pnpm compose:up        # Builda e inicia os containeres docker
pnpm compose:down      # Baixa e remove os containeres docker
pnpm compose:prune     # Limpa e apaga o banco de dados do container
```

### Backend
```bash
cd backend
pnpm dev               # Servidor de desenvolvimento
pnpm build             # Build para produção
pnpm lint              # Verificar linting
pnpm format            # Formatar código
```

### Frontend
```bash
cd frontend
pnpm dev               # Servidor de desenvolvimento
pnpm build             # Build para produção
pnpm preview           # Preview do build
pnpm lint              # Verificar linting
pnpm format            # Formatar código
```

---

## 📚 Referências

- **Regras Backend:** `backend/docs/spec-driven-development/conventions.md`
- **Regras Frontend:** `frontend/docs/spec-driven-development/conventions.md`
- **Setup do Projeto:** `SETUP.md`