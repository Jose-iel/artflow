---
name: security-knowledge
description: >
  Referência de vetores de ataque, padrões proibidos e controles de segurança
  para o projeto. Usado pelo agente security-review como base de conhecimento.
  Baseado em: "Segurança para Vibe Code Apps" (Mayk Brito) + OWASP Top 10.
---

# Security Knowledge Base

> Este arquivo complementa o `project-standards.md` com foco exclusivo
> em segurança. O agente de security review usa ambos como referência.

---

## Stack e Superfície de Ataque

| Camada      | Tecnologia        | Riscos prioritários                        |
|-------------|-------------------|--------------------------------------------|
| Backend     | Node.js / Express | SQLi, Mass Assignment, Auth bypass         |
| Frontend    | React / Next.js   | XSS, localStorage tokens, Server Actions  |
| Banco       | _preencher_       | RLS (Supabase) / Rules (Firebase) / SQLi   |
| Pagamentos  | _preencher_       | Client-submitted prices, webhook spoofing  |
| AI/LLM      | _preencher_       | Prompt injection, custo ilimitado          |
| Mobile      | _preencher_       | API keys no bundle, AsyncStorage           |

---

## Padrões Proibidos — Regex de Busca

O agente deve buscar estes padrões ativamente no código analisado:

### Secrets hardcoded
```
sk_live_[a-zA-Z0-9]+
sk-proj-[a-zA-Z0-9]+
AKIA[0-9A-Z]{16}
AIza[0-9A-Za-z\-_]{35}
eyJhbGciOiJIUzI1NiJ9
postgresql://[^"'\s]+:[^"'\s]+@
```

### SQL Injection
```
`SELECT.*\$\{
`WHERE.*\$\{
queryRawUnsafe
db\.query\(`[^`]*\$\{
```

### Auth insegura
```
jwt\.decode\(          # decode sem verify
localStorage\.setItem.*token
sessionStorage\.setItem.*token
innerHTML\s*=.*ai      # output de AI como HTML
```

### Upload inseguro
```
file\.originalname     # nome original do arquivo usado
file\.mimetype         # apenas mimetype declarado, sem magic bytes
```

---

## Controles Obrigatórios por Funcionalidade

### Se tem login/auth:
- `jwt.verify()` — nunca `jwt.decode()`
- Cookies `HttpOnly + Secure + SameSite`
- Rate limit: máx. 5 tentativas / 15 min por IP
- Autorização verificada em cada endpoint, não só autenticação

### Se tem pagamento (Stripe):
- Preços definidos no servidor com `PRICES` ou Price IDs do Stripe
- Webhook com `stripe.webhooks.constructEvent()` verificando assinatura
- Subscription status atualizado **apenas** via webhook
- `STRIPE_WEBHOOK_SECRET` em variável de ambiente

### Se tem upload:
- Validação por magic bytes com `file-type`
- Tamanho máximo: definir explicitamente (recomendado: 5MB para imagens)
- Nome substituído por `crypto.randomUUID()`
- Imagens reprocessadas com `sharp` + `.withMetadata(false)`
- SVG não aceito de usuários externos sem sanitização

### Se tem AI/LLM:
- `max_tokens` definido em **todas** as chamadas
- System prompt nunca interpolado com input do usuário
- Output sanitizado antes de renderizar (DOMPurify ou textContent)
- Rate limit por usuário nos endpoints de AI
- Tracking de custo por usuário implementado
- Tools/functions do LLM filtram por `currentUser.id` no backend

### Se usa Supabase:
- RLS habilitado em todas as tabelas
- Políticas UPDATE com `USING` + `WITH CHECK`
- `service_role` key apenas no backend
- Dados sensíveis em tabelas separadas (`private_user_data`)

### Se usa Firebase:
- Firestore Rules sem `allow read, write: if true`
- Storage Rules com verificação de `request.auth`

### Se tem React Native:
- Zero API keys no bundle — BFF para todas as chamadas externas
- `expo-secure-store` para tokens (não AsyncStorage)
- Deep links validados, não executam ações automaticamente

---

## Níveis de Severidade

| Nível    | Critério                                              | Ação                     |
|----------|-------------------------------------------------------|--------------------------|
| CRÍTICO  | Exploração direta, impacto alto, baixa complexidade   | Bloqueia deploy          |
| ATENÇÃO  | Risco real mas com mitigações parciais                | Corrigir antes do merge  |
| INFO     | Hardening, defesa em profundidade                     | Melhorar quando possível |

### Sempre CRÍTICO (sem exceção):
- Secret hardcoded no código
- SQL Injection por concatenação de string
- `jwt.decode()` usado para validar token
- Mass assignment de `req.body` direto no ORM
- Preço vindo do cliente no checkout
- Webhook de pagamento sem verificação de assinatura
- RLS desabilitado em tabela com dados de usuário
- Server Action sem verificação de sessão
- Stack trace exposto em produção
- Output de LLM renderizado como `innerHTML` sem sanitização

---

## Referências

| Vetor                | Referência                                              |
|----------------------|---------------------------------------------------------|
| Top 10 Web           | https://owasp.org/Top10/                                |
| Top 10 LLM           | https://genai.owasp.org/llm-top-10/                     |
| Supabase RLS         | https://supabase.com/docs/guides/database/postgres/row-level-security |
| Stripe Webhooks      | https://stripe.com/docs/webhooks/best-practices         |
| JWT Best Practices   | https://datatracker.ietf.org/doc/html/rfc8725           |
| Vibe Security Skill  | https://github.com/raroque/vibe-security-skill          |
| Guia Base            | https://maykbrito.dev/blog/seguran-a-para-vibe-code-apps-guia-completo/ |
