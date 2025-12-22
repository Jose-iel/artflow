# Spec-Driven Development - Backend ArtFlow

## Visão Geral

O **Spec-Driven Development (SDD)** é uma abordagem onde primeiro definimos especificações detalhadas antes de iniciar a implementação. Esta estrutura foi projetada para funcionar com:

- ✅ **Cursor** (com globs automáticos)
- ✅ **VS Code + Copilot**
- ✅ **Windsurf**

---

## Estrutura de Arquivos

```
backend/
├── docs/
│   └── spec-driven-development/
│       ├── README.md                # Este arquivo
│       ├── conventions.md           # ✅ FONTE ÚNICA de regras
│       ├── prompts-example.md       # Exemplos de prompts
│       ├── specs/                   # Specs de módulos (a criar)
│       └── agents/
│           ├── spec-creator.md      # Criar specs de API
│           ├── spec-developer.md    # Implementar módulos
│           ├── test-engineer.md     # Criar testes
│           ├── code-reviewer.md     # Revisar código
│           └── security-expert.md   # Análise de segurança
│
├── src/
│   ├── config/                      # Configurações
│   ├── controllers/                 # Controllers (classes)
│   ├── dtos/                        # Data Transfer Objects
│   ├── entities/                    # Entidades TypeORM
│   ├── middlewares/                 # Middlewares Express
│   ├── routes/                      # Definição de rotas
│   ├── utils/                       # Utilitários
│   └── __tests__/                   # Testes
│       ├── helpers/
│       ├── integration/
│       └── unit/
```

---

## Arquitetura: Fonte Única de Regras

```
┌─────────────────────────────────────────────────────────────┐
│                    conventions.md                            │
│                  (FONTE ÚNICA DE VERDADE)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   .windsurf/rules/      │
              │   artflow-rules.md      │
              │                         │
              │   Referencia →          │
              │   conventions.md        │
              └─────────────────────────┘
```

**Benefícios:**

- 🎯 Uma única fonte de verdade
- 🔄 Mudanças em um lugar propagam para todos
- 📦 Portável entre ferramentas
- 💰 Economia de tokens (contexto enxuto)

---

## Fluxo de Desenvolvimento

### 1. Criar Spec

```
@agents.md#spec-creator
@backend/docs/spec-driven-development/conventions.md

Crie uma spec para o módulo de Notificações com:
- Entity: Notification (id, userId, tipo, mensagem, lida, criadoEm)
- Endpoints: listar, marcar como lida
- Permissões: usuário só vê suas próprias notificações
```

### 2. Implementar Módulo

```
@agents.md#spec-developer
@backend/docs/spec-driven-development/specs/Notification.spec.md
@backend/docs/spec-driven-development/conventions.md

Implemente o módulo de Notificações.
```

### 3. Criar Testes

```
@agents.md#test-engineer
@backend/docs/spec-driven-development/specs/Notification.spec.md
@backend/src/controllers/notification.controller.ts

Crie os testes para o NotificationController.
```

### 4. Code Review

```
@agents.md#code-reviewer
@backend/docs/spec-driven-development/specs/Notification.spec.md
@backend/src/controllers/notification.controller.ts

Revise o módulo de Notificações.
```

### 5. Análise de Segurança

```
@agents.md#security-expert
@backend/src/controllers/notification.controller.ts
@backend/src/middlewares/auth.ts

Analise a segurança do módulo.
```

---

## Perfis de Agentes

| Agente          | Arquivo                    | Responsabilidade              |
| --------------- | -------------------------- | ----------------------------- |
| Spec Creator    | `agents/spec-creator.md`   | Criar specs de API            |
| Spec Developer  | `agents/spec-developer.md` | Implementar módulos           |
| Test Engineer   | `agents/test-engineer.md`  | Criar testes                  |
| Code Reviewer   | `agents/code-reviewer.md`  | Revisar código                |
| Security Expert | `agents/security-expert.md`| Análise de segurança (OWASP)  |

---

## Stack do Backend

| Tecnologia      | Uso                    |
| --------------- | ---------------------- |
| Node.js         | Runtime                |
| TypeScript      | Tipagem                |
| Express         | Framework HTTP         |
| TypeORM         | ORM                    |
| PostgreSQL      | Banco de Dados         |
| JWT             | Autenticação           |
| Jest            | Testes                 |
| Supertest       | Testes de integração   |

---

## Referências Rápidas

- **Convenções**: [`conventions.md`](./conventions.md)
- **Exemplos de Prompts**: [`prompts-example.md`](./prompts-example.md)
- **Controller exemplo**: `src/controllers/post.controller.ts`
- **Entity exemplo**: `src/entities/Post.ts`
- **Teste exemplo**: `src/__tests__/unit/admin.controller.test.ts`

---