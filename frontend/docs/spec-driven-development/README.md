# Spec-Driven Development - Frontend ArtFlow

## Visão Geral

O **Spec-Driven Development (SDD)** é uma abordagem onde primeiro definimos especificações detalhadas antes de iniciar a implementação. Esta estrutura foi projetada para funcionar com:

- ✅ **Cursor** (com globs automáticos)
- ✅ **VS Code + Copilot**
- ✅ **Windsurf**

---

## Estrutura de Arquivos

```
frontend/
├── docs/
│   └── spec-driven-development/
│       ├── README.md                # Este arquivo
│       ├── conventions.md           # ✅ FONTE ÚNICA de regras
│       ├── prompts-example.md       # Exemplos de prompts
│       ├── specs/                   # Specs de componentes (a criar)
│       └── agents/
│           ├── spec-creator.md      # Criar specs de componentes
│           ├── spec-developer.md    # Implementar componentes
│           ├── test-engineer.md     # Criar testes
│           ├── accessibility-expert.md # Análise de acessibilidade
│           └── code-reviewer.md     # Revisar código
│
├── src/
│   ├── components/           # Componentes reutilizáveis
│   ├── pages/                # Páginas da aplicação
│   ├── hooks/                # Custom hooks
│   ├── stores/               # Zustand stores
│   ├── services/             # API services
│   ├── types/                # TypeScript types
│   ├── utils/                # Utilitários
│   └── __tests__/            # Testes
│       ├── components/
│       ├── hooks/
│       └── stores/
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
@frontend/docs/spec-driven-development/conventions.md

Crie uma spec para o componente de Notificações com:
- Componentes: NotificationBell, NotificationList, NotificationItem
- Estados: lista de notificações, contador de não lidas
- Interações: marcar como lida, marcar todas como lidas
```

### 2. Implementar Componente

```
@agents.md#spec-developer
@frontend/docs/spec-driven-development/specs/Notification.spec.md
@frontend/docs/spec-driven-development/conventions.md

Implemente o módulo de Notificações.
```

### 3. Criar Testes

```
@agents.md#test-engineer
@frontend/docs/spec-driven-development/specs/Notification.spec.md
@frontend/src/components/NotificationBell.tsx

Crie os testes para o NotificationBell.
```

### 4. Análise de Acessibilidade

```
@agents.md#accessibility-expert
@frontend/src/components/NotificationBell.tsx
@frontend/src/components/NotificationList.tsx

Analise a acessibilidade dos componentes.
```

### 5. Code Review

```
@agents.md#code-reviewer
@frontend/docs/spec-driven-development/specs/Notification.spec.md
@frontend/src/components/NotificationBell.tsx

Revise o módulo de Notificações.
```

---

## Perfis de Agentes

| Agente              | Arquivo                       | Responsabilidade              |
| ------------------- | ----------------------------- | ----------------------------- |
| Spec Creator        | `agents/spec-creator.md`      | Criar specs de componentes    |
| Spec Developer      | `agents/spec-developer.md`    | Implementar componentes       |
| Test Engineer       | `agents/test-engineer.md`     | Criar testes                  |
| Accessibility Expert| `agents/accessibility-expert.md` | Análise WCAG              |
| Code Reviewer       | `agents/code-reviewer.md`     | Revisar código                |

---

## Stack do Frontend

| Tecnologia      | Uso                    |
| --------------- | ---------------------- |
| React           | UI Library             |
| TypeScript      | Tipagem                |
| Vite            | Build tool             |
| TailwindCSS     | Estilização            |
| Zustand         | Estado global          |
| React Query     | Cache e fetching       |
| React Hook Form | Formulários            |
| Zod             | Validação              |
| Vitest          | Testes                 |
| Testing Library | Testes de componentes  |

---

## Referências Rápidas

- **Convenções**: [`conventions.md`](./conventions.md)
- **Exemplos de Prompts**: [`prompts-example.md`](./prompts-example.md)
- **Componente exemplo**: `src/components/LoginForm.tsx`
- **Store exemplo**: `src/stores/authStore.ts`
- **Teste exemplo**: `src/__tests__/components/LoginForm.test.tsx`

---
