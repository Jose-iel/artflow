# Exemplos de Prompts - Frontend ArtFlow

## Padrão de Prompt

Todo prompt deve seguir a estrutura:

```
@agents.md#[perfil]
@frontend/docs/spec-driven-development/[contexto necessário]

[Instrução clara do que fazer]
```

---

## 📋 Criar Spec (Spec Creator)

### Básico

```
@agents.md#spec-creator
@frontend/docs/spec-driven-development/conventions.md

Crie uma spec para o componente de Filtros de Posts.
Requisitos:
- Componentes: FilterBar, FilterDropdown, FilterChip
- Estados: filtros ativos, opções disponíveis
- Interações: selecionar filtro, limpar filtros
```

### Detalhado

```
@agents.md#spec-creator
@frontend/docs/spec-driven-development/conventions.md

Crie uma spec para o módulo de Notificações:

User Story:
Como usuário, quero ver minhas notificações e marcá-las como lidas.

Requisitos:
- Componentes: NotificationBell, NotificationDropdown, NotificationItem
- Estados: lista de notificações, contador de não lidas, loading
- Interações: abrir dropdown, marcar como lida, marcar todas como lidas
- Integração: React Query para fetch, Zustand para estado global
- Acessibilidade: navegação por teclado, aria-live para contador

Out of scope:
- Push notifications
- WebSocket real-time
- Configurações de preferências
```

---

## 🔧 Implementar Componente (Spec Developer)

### Completo (um shot)

```
@agents.md#spec-developer
@frontend/docs/spec-driven-development/specs/Notification.spec.md
@frontend/docs/spec-driven-development/conventions.md

Implemente o módulo de Notificações completo:
1. types/notification.ts
2. stores/notificationStore.ts
3. hooks/useNotifications.ts
4. components/NotificationBell.tsx
5. components/NotificationDropdown.tsx
6. components/NotificationItem.tsx

Referência: @frontend/src/components/LoginForm.tsx
```

### Incremental

```
@agents.md#spec-developer
@frontend/docs/spec-driven-development/specs/Notification.spec.md

Implemente apenas os types e o store.
```

Depois:

```
@agents.md#spec-developer
@frontend/src/types/notification.ts
@frontend/src/stores/notificationStore.ts

Agora implemente os componentes.
```

---

## 🧪 Criar Testes (Test Engineer)

```
@agents.md#test-engineer
@frontend/docs/spec-driven-development/specs/Notification.spec.md
@frontend/src/components/NotificationBell.tsx
@frontend/src/stores/notificationStore.ts
@frontend/docs/spec-driven-development/conventions.md

Crie os testes cobrindo:
- Renderização inicial
- Interações (click, hover)
- Estados (loading, error, empty)
- Store actions

Referência: @frontend/src/__tests__/components/LoginForm.test.tsx
```

---

## ♿ Análise de Acessibilidade

```
@agents.md#accessibility-expert
@frontend/src/components/NotificationBell.tsx
@frontend/src/components/NotificationDropdown.tsx

Analise a acessibilidade dos componentes:
- Conformidade WCAG 2.1 AA
- Navegação por teclado
- Screen reader friendly
- Focus management no dropdown
```

---

## 👀 Code Review (Code Reviewer)

```
@agents.md#code-reviewer
@frontend/docs/spec-driven-development/specs/Notification.spec.md
@frontend/src/components/NotificationBell.tsx
@frontend/src/hooks/useNotifications.ts
@frontend/src/stores/notificationStore.ts
@frontend/src/__tests__/components/NotificationBell.test.tsx
@frontend/docs/spec-driven-development/conventions.md

Revise o módulo de Notificações verificando:
1. Aderência à spec
2. Padrões do projeto
3. Qualidade de código
4. Acessibilidade
5. Cobertura de testes
```

---

## 🔄 Fluxo Completo - Novo Componente

### 1. Spec

```
@agents.md#spec-creator
@frontend/docs/spec-driven-development/conventions.md

Crie spec para componente de Avatar com:
- Variantes: tamanhos (sm, md, lg), com/sem imagem
- Fallback: iniciais do nome quando sem imagem
- Estados: loading, error
```

### 2. Implementação

```
@agents.md#spec-developer
@frontend/docs/spec-driven-development/specs/Avatar.spec.md
@frontend/docs/spec-driven-development/conventions.md

Implemente o Avatar.
```

### 3. Testes

```
@agents.md#test-engineer
@frontend/docs/spec-driven-development/specs/Avatar.spec.md
@frontend/src/components/Avatar.tsx

Crie testes completos.
```

### 4. Acessibilidade

```
@agents.md#accessibility-expert
@frontend/src/components/Avatar.tsx

Análise de acessibilidade.
```

### 5. Review

```
@agents.md#code-reviewer
@frontend/docs/spec-driven-development/specs/Avatar.spec.md
@frontend/src/components/Avatar.tsx

Revisão final.
```

---

## ✅ Boas Práticas

1. **Sempre inclua a spec** - É o contrato
2. **Use o agente correto** - Cada um tem expertise
3. **Inclua convenções** - `@frontend/docs/spec-driven-development/conventions.md`
4. **Referencie exemplos** - `@frontend/src/components/LoginForm.tsx`
5. **Seja específico** - Liste exatamente o que precisa
6. **Defina acessibilidade** - Requisitos de a11y desde a spec

## ❌ Evitar

1. **Prompts vagos**: "Crie um componente"
2. **Sem contexto**: Não incluir spec ou conventions
3. **Muito de uma vez**: spec + código + testes em um prompt
4. **Sem agente**: Não especificar o perfil
5. **Ignorar a11y**: Não considerar acessibilidade
