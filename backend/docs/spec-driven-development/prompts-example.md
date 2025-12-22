# Exemplos de Prompts - Backend ArtFlow

## Padrão de Prompt

Todo prompt deve seguir a estrutura:

```
@agents.md#[perfil]
@backend/docs/spec-driven-development/[contexto necessário]

[Instrução clara do que fazer]
```

---

## 📋 Criar Spec (Spec Creator)

### Básico

```
@agents.md#spec-creator
@backend/docs/spec-driven-development/conventions.md

Crie uma spec para o módulo de Comentários em Posts.
Requisitos:
- Entity: Comment (id, postId, userId, texto, criadoEm)
- Endpoints: criar, listar por post, deletar
- Permissões: usuário só deleta próprios comentários
```

### Detalhado

```
@agents.md#spec-creator
@backend/docs/spec-driven-development/conventions.md

Crie uma spec para o módulo de Notificações:

User Story:
Como usuário, quero ser notificado quando meu post for aprovado/rejeitado.

Requisitos:
- Entity: Notification (id, userId, tipo, mensagem, lida, postId, criadoEm)
- Tipos: POST_APROVADO, POST_REJEITADO, ALTERACAO_SOLICITADA
- Endpoints: listar minhas notificações, marcar como lida, marcar todas como lidas
- Permissões: usuário só vê suas próprias notificações

Out of scope:
- Push notifications
- Email notifications
- WebSocket real-time
```

---

## 🔧 Implementar Módulo (Spec Developer)

### Completo (um shot)

```
@agents.md#spec-developer
@backend/docs/spec-driven-development/specs/Notification.spec.md
@backend/docs/spec-driven-development/conventions.md

Implemente o módulo de Notificações completo:
1. Notification.ts (entity)
2. notification.dto.ts
3. notification.controller.ts
4. notifications.ts (routes)

Referência: @backend/src/controllers/post.controller.ts
```

### Incremental

```
@agents.md#spec-developer
@backend/docs/spec-driven-development/specs/Notification.spec.md

Implemente apenas a Entity e os DTOs.
```

Depois:

```
@agents.md#spec-developer
@backend/src/entities/Notification.ts
@backend/src/dtos/notification.dto.ts

Agora implemente o controller e as rotas.
```

---

## 🧪 Criar Testes (Test Engineer)

```
@agents.md#test-engineer
@backend/docs/spec-driven-development/specs/Notification.spec.md
@backend/src/controllers/notification.controller.ts
@backend/docs/spec-driven-development/conventions.md

Crie os testes para o NotificationController cobrindo:
- Caso de sucesso para cada método
- Validações (campos obrigatórios)
- Permissões por role
- Erros de negócio

Referência: @backend/src/__tests__/unit/admin.controller.test.ts
```

---

## 👀 Code Review (Code Reviewer)

```
@agents.md#code-reviewer
@backend/docs/spec-driven-development/specs/Notification.spec.md
@backend/src/entities/Notification.ts
@backend/src/controllers/notification.controller.ts
@backend/docs/spec-driven-development/conventions.md

Revise o módulo de Notificações verificando:
1. Aderência à spec
2. Padrões do projeto (conventions.md)
3. Tratamento de erros
4. Permissões
```

---

## 🔒 Análise de Segurança

```
@agents.md#security-expert
@backend/src/controllers/auth.controller.ts
@backend/src/middlewares/auth.ts
@backend/docs/spec-driven-development/conventions.md

Analise a segurança do módulo de autenticação:
- Conformidade OWASP Top 10
- Validação de entrada
- Proteção de dados sensíveis
- Tratamento de erros
```

---

## 🔄 Fluxo Completo - Novo Módulo

### 1. Spec

```
@agents.md#spec-creator
@backend/docs/spec-driven-development/conventions.md

Crie spec para módulo de Tags em Posts.
- Entity: Tag (id, nome, cor)
- Relacionamento: Post N:N Tag
- Endpoints: CRUD de tags, associar/desassociar de post
```

### 2. Implementação

```
@agents.md#spec-developer
@backend/docs/spec-driven-development/specs/Tag.spec.md
@backend/docs/spec-driven-development/conventions.md

Implemente o módulo de Tags.
```

### 3. Testes

```
@agents.md#test-engineer
@backend/docs/spec-driven-development/specs/Tag.spec.md
@backend/src/controllers/tag.controller.ts

Crie testes completos.
```

### 4. Review

```
@agents.md#code-reviewer
@backend/docs/spec-driven-development/specs/Tag.spec.md
@backend/src/controllers/tag.controller.ts

Revisão final.
```

### 5. Segurança

```
@agents.md#security-expert
@backend/src/controllers/tag.controller.ts

Análise de segurança.
```

---

## ✅ Boas Práticas

1. **Sempre inclua a spec** - É o contrato
2. **Use o agente correto** - Cada um tem expertise
3. **Inclua convenções** - `@backend/docs/spec-driven-development/conventions.md`
4. **Referencie exemplos** - `@backend/src/controllers/post.controller.ts`
5. **Seja específico** - Liste exatamente o que precisa
6. **Defina permissões** - Quem pode fazer o quê

## ❌ Evitar

1. **Prompts vagos**: "Crie um endpoint"
2. **Sem contexto**: Não incluir spec ou conventions
3. **Muito de uma vez**: spec + código + testes em um prompt
4. **Sem agente**: Não especificar o perfil
5. **Ignorar permissões**: Não definir quem pode acessar