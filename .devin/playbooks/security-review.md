---
name: security-review
description: >
  Executa auditoria de segurança estruturada em código Node.js/Express e
  React/Next.js. Cobre os vetores do guia "Segurança para Vibe Code Apps"
  de Mayk Brito + OWASP Top 10. Bloqueia deploy se houver vulnerabilidades
  críticas.
triggers:
  - "run security review"
  - "security audit"
  - "auditoria de segurança"
  - "revisar segurança"
  - "check security"
---

# Playbook: Security Review

## Objetivo

Identificar vulnerabilidades de segurança antes do deploy. Este playbook
é complementar ao `code-review.md` — foca exclusivamente em segurança,
com maior profundidade em cada vetor de ataque.

Um único achado CRÍTICO bloqueia o deploy. Não há negociação.

---

## Passo 1 — Identificar o contexto

Determine:

- **Modo PR:** diff ou arquivos alterados fornecidos → analise apenas o que mudou
- **Modo Interativo:** trecho colado no chat → analise o que foi fornecido e
  sinalize o que não pôde ser avaliado por falta de contexto

Consulte `.devin/knowledge/project-standards.md` para entender o stack,
bibliotecas adotadas e regras específicas do projeto antes de prosseguir.

---

## Passo 2 — Executar a auditoria por categoria

Percorra **todas** as categorias abaixo. Para cada item, marque:
- ✅ OK — verificado e sem problemas
- 🚫 CRÍTICO — bloqueia deploy
- ⚠️ ATENÇÃO — risco real, correção recomendada antes do merge
- ℹ️ INFO — melhoria de postura, não bloqueia

---

### CATEGORIA 1 — Secrets & Configuração

**Verificar:**

- [ ] Nenhum secret hardcoded (API keys, passwords, tokens, connection strings)
  - Padrões a buscar: `sk_live_`, `sk-proj-`, `AKIA`, `AIza`, `eyJ`, senhas literais
- [ ] `.env` está no `.gitignore` — e nunca foi commitado (`git log -- .env`)
- [ ] Source maps desabilitados em produção (`sourcemap: false` no Vite/Next)
- [ ] Arquivos `.pem`, `.key`, `.p12` no `.gitignore`
- [ ] Variáveis de ambiente acessadas via `process.env.X`, nunca hardcoded

**Exemplos do que bloqueia:**

```js
// 🚫 CRÍTICO
const stripe = new Stripe('sk_live_ABCD1234...')
const db = new Pool({ connectionString: 'postgresql://user:senha@host/db' })
```

```js
// ✅ CORRETO
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
```

---

### CATEGORIA 2 — Injeção SQL

**Verificar:**

- [ ] Nenhuma query construída por concatenação de string com input do usuário
- [ ] Uso de prepared statements / parameterized queries em todas as queries raw
- [ ] `$queryRawUnsafe` do Prisma ausente — usar `$queryRaw` com template literal
- [ ] Input do usuário nunca passado diretamente para `where:` do Prisma (operator injection)
- [ ] Validação de schema (Zod/Yup) antes de usar input em queries

**Exemplos do que bloqueia:**

```js
// 🚫 CRÍTICO — SQL Injection
db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)
prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${userId}`)

// 🚫 CRÍTICO — Operator Injection (Prisma)
prisma.user.findMany({ where: req.body.filter })
```

```js
// ✅ CORRETO
db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`
prisma.user.findMany({ where: { email: req.body.email } }) // campo explícito
```

---

### CATEGORIA 3 — Autenticação & Autorização

**Verificar:**

- [ ] `jwt.verify()` usado — nunca `jwt.decode()` para validar tokens
- [ ] Cada endpoint verifica **autorização** (não só autenticação)
  - Autenticação: "você está logado?"
  - Autorização: "você pode acessar *estes* dados?"
- [ ] Server Actions do Next.js (`'use server'`) verificam sessão internamente
- [ ] Tokens armazenados em cookies `HttpOnly + Secure + SameSite`, não `localStorage`
- [ ] Middleware de auth não é a única camada de proteção

**Exemplos do que bloqueia:**

```js
// 🚫 CRÍTICO — decode sem verify
const user = jwt.decode(token) // aceita qualquer token forjado

// 🚫 CRÍTICO — autenticação sem autorização
app.get('/api/users/:id/data', requireAuth, async (req, res) => {
  const data = await db.query('SELECT * FROM data') // retorna dados de todos
})

// 🚫 CRÍTICO — Server Action sem auth
'use server'
export async function deleteUser(userId) {
  await db.user.delete({ where: { id: userId } })
}
```

```js
// ✅ CORRETO
const user = jwt.verify(token, process.env.JWT_SECRET)

app.get('/api/users/:id/data', requireAuth, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const data = await db.query('SELECT * FROM data WHERE user_id = $1', [req.params.id])
})
```

---

### CATEGORIA 4 — Preços & Pagamentos

**Verificar:**

- [ ] Preços **nunca** vêm do frontend — definidos no servidor
- [ ] Webhook do Stripe verifica a assinatura (`stripe.webhooks.constructEvent`)
- [ ] Ativação de plano/subscription feita **apenas** via webhook, não via endpoint próprio
- [ ] Price IDs do Stripe são referenciados no servidor, nunca enviados pelo cliente
- [ ] Subscription status consultado do banco (atualizado por webhook), não de cache/memória

**Exemplos do que bloqueia:**

```js
// 🚫 CRÍTICO — preço vindo do cliente
fetch('/api/checkout', { body: JSON.stringify({ plan: 'pro', price: 29.99 }) })

// 🚫 CRÍTICO — confirmar pagamento sem verificar assinatura do webhook
app.post('/api/payment-success', (req, res) => {
  const { userId, plan } = req.body
  db.user.update({ where: { id: userId }, data: { plan } }) // qualquer um pode chamar
})
```

```js
// ✅ CORRETO
const PRICES = { basic: 999, pro: 2999 }
app.post('/api/checkout', (req, res) => {
  const amount = PRICES[req.body.planId] // servidor decide o preço
  if (!amount) return res.status(400).json({ error: 'Invalid plan' })
  // ...
})

// Webhook com verificação de assinatura
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
  // processar apenas eventos verificados
})
```

---

### CATEGORIA 5 — Upload de Arquivos

**Verificar:**

- [ ] Tamanho máximo de arquivo definido e validado no servidor
- [ ] Tipo do arquivo validado por **magic bytes** (não só extensão ou Content-Type)
  - Biblioteca: `file-type` (Node.js)
- [ ] Nome do arquivo original **nunca** usado — substituído por UUID gerado no servidor
- [ ] Imagens reprocessadas com `sharp` antes de salvar (remove EXIF e payloads)
- [ ] SVG de usuários externos não aceito diretamente — ou sanitizado com DOMPurify server-side

**Exemplos do que bloqueia:**

```js
// 🚫 CRÍTICO — confia no Content-Type do cliente
if (file.mimetype === 'image/jpeg') { /* pode ser forjado */ }

// 🚫 CRÍTICO — usa nome original do arquivo
storage.upload(file.buffer, `uploads/${file.originalname}`)
// path traversal: originalname = "../../etc/passwd"
```

```js
// ✅ CORRETO
const detectedType = await fileTypeFromBuffer(buffer)
if (!ALLOWED_MIME_TYPES.includes(detectedType?.mime)) throw new Error('Tipo inválido')

const safeName = `${crypto.randomUUID()}.jpg`
const sanitized = await sharp(buffer).withMetadata(false).jpeg({ quality: 85 }).toBuffer()
storage.upload(sanitized, `uploads/${safeName}`)
```

---

### CATEGORIA 6 — Prompt Injection (AI)

**Verificar** (apenas se o código interage com LLMs):

- [ ] Input do usuário **nunca** interpolado no `system prompt`
- [ ] Conteúdo externo processado pelo LLM (docs, emails, páginas) tratado como não confiável
- [ ] Output do LLM sanitizado antes de renderizar como HTML
  - `innerHTML = aiResponse` é proibido — usar `textContent` ou DOMPurify
- [ ] Ferramentas/functions do LLM sempre filtram pelo `currentUser.id` no backend
- [ ] `max_tokens` definido em todas as chamadas ao LLM

**Exemplos do que bloqueia:**

```js
// 🚫 CRÍTICO — interpola input do usuário no system prompt
const systemPrompt = `Você é um assistente. Contexto do usuário: ${req.body.userInput}`

// 🚫 CRÍTICO — output do LLM como HTML sem sanitização
document.getElementById('response').innerHTML = aiResponse

// ⚠️ ATENÇÃO — sem max_tokens (custo ilimitado)
openai.chat.completions.create({ model: 'gpt-4o', messages })
```

```js
// ✅ CORRETO
const messages = [
  { role: 'system', content: systemPrompt }, // fixo, nunca do usuário
  { role: 'user', content: sanitizedInput }  // separado
]

document.getElementById('response').textContent = aiResponse
// ou
const html = DOMPurify.sanitize(marked(aiResponse))

openai.chat.completions.create({ model: 'gpt-4o', messages, max_tokens: 1000 })
```

---

### CATEGORIA 7 — Rate Limiting

**Verificar:**

- [ ] Endpoints de login/signup têm rate limit (máx. ~5 tentativas / 15 min)
- [ ] Endpoints de AI têm rate limit (custo por chamada)
- [ ] Endpoints de envio de email têm rate limit
- [ ] Endpoints de pagamento têm rate limit
- [ ] Contadores de rate limit ficam **no servidor** (Redis/memória do processo)
  - Contadores em `localStorage` ou enviados pelo cliente são inválidos

**Exemplos do que bloqueia:**

```js
// 🚫 CRÍTICO — contador no cliente
if (localStorage.getItem('api_calls') >= 10) return

// ⚠️ ATENÇÃO — endpoint de AI sem rate limit
app.post('/api/ai/generate', requireAuth, aiHandler) // sem limiter
```

---

### CATEGORIA 8 — Supabase / Firebase

**Verificar** (apenas se o projeto usa Supabase ou Firebase):

- [ ] RLS habilitado em **todas** as tabelas com dados de usuário
- [ ] Políticas de UPDATE têm tanto `USING` quanto `WITH CHECK`
- [ ] Nenhuma política com `using (true)` sem intenção explícita de acesso público
- [ ] `service_role` key **nunca** no frontend ou código client-side
- [ ] Dados sensíveis (email, stripe_id, balance) em tabela separada com política restritiva
- [ ] Firebase: sem `allow read, write: if true` em produção

**Exemplos do que bloqueia:**

```sql
-- 🚫 CRÍTICO — acesso total
create policy "allow_all" on profiles for select using (true);

-- 🚫 CRÍTICO — UPDATE sem WITH CHECK (permite trocar author_id)
create policy "update" on posts for update using (auth.uid() = author_id);
```

```sql
-- ✅ CORRETO
create policy "update" on posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
```

---

### CATEGORIA 9 — Exposição de Dados

**Verificar:**

- [ ] Queries nunca retornam `SELECT *` em dados de usuário — campos explícitos
- [ ] `password_hash`, `stripe_customer_id`, `internal_notes` nunca retornados em responses
- [ ] Mass assignment bloqueado — `req.body` nunca passado diretamente para `data:` do ORM
- [ ] Stack traces **não** expostos em produção (`NODE_ENV === 'production'`)
- [ ] Pasta `.git` não acessível via HTTP no servidor

**Exemplos do que bloqueia:**

```js
// 🚫 CRÍTICO — mass assignment
prisma.user.update({ where: { id }, data: req.body })
// atacante envia { role: 'admin' }

// 🚫 CRÍTICO — stack trace em produção
res.status(500).json({ error: err.message, stack: err.stack })
```

---

### CATEGORIA 10 — Mobile (se aplicável)

**Verificar** (apenas se há código React Native):

- [ ] Nenhuma API key no bundle JS — todas as chamadas externas via BFF
- [ ] Tokens em `expo-secure-store` ou `react-native-keychain`, não `AsyncStorage`
- [ ] Deep links apenas navegam — não executam ações automaticamente

---

### CATEGORIA 11 — Deploy & Headers

**Verificar:**

- [ ] `helmet` configurado no Express (ou headers equivalentes no Next.js)
- [ ] `productionBrowserSourceMaps: false` no `next.config.js`
- [ ] `sourcemap: false` no `vite.config.js` para builds de produção
- [ ] Variáveis de ambiente em serviço seguro (Vercel Env, Railway, Doppler)

---

## Passo 3 — Produzir o relatório

```
## 🔒 Relatório de Security Review

**Veredicto:**
  🚫 BLOQUEADO — vulnerabilidades críticas impedem o deploy
  ⚠️  DEPLOY COM RESSALVAS — sem críticos, mas há riscos a corrigir
  ✅  APROVADO — nenhuma vulnerabilidade identificada

**Categorias auditadas:** X de 11
**Achados:** X críticos · X atenção · X info

---

## 🚫 Vulnerabilidades Críticas (bloqueiam deploy)

### [SEC-CRIT-01] <título descritivo>

- **Categoria:** <ex: SQL Injection / Secrets / Auth>
- **Arquivo:** `caminho/arquivo.ts` — linha X
- **Vetor de ataque:** <como um atacante exploraria isso>
- **Impacto:** <o que acontece se explorado>
- **Correção exigida:**

  ```ts
  // código corrigido
  ```

- **Referência:** <ex: OWASP A03:2021 — Injection>

---

## ⚠️ Riscos de Atenção (corrigir antes do merge)

### [SEC-WARN-01] <título>

- **Arquivo:** `caminho/arquivo.ts` — linha X
- **Risco:** <descrição>
- **Correção sugerida:** <código ou orientação>

---

## ℹ️ Melhorias de Postura (opcional)

- `arquivo.ts` linha X — <sugestão de hardening>

---

## ✅ Controles Verificados e OK

<Liste explicitamente o que foi auditado e está correto.
Não omita esta seção — confirmar o que está certo é parte da auditoria.>
```

---

## Regras de Comportamento

1. **Nunca aprove um deploy com vulnerabilidades críticas**, independente de prazo
2. Sempre descreva o **vetor de ataque concreto** — não apenas "isso é inseguro"
3. Para cada crítico, forneça o **código corrigido**
4. Se o trecho for insuficiente para análise conclusiva (ex: falta contexto do middleware),
   sinalize explicitamente o que **não pôde ser auditado** e por quê
5. Não repita achados do `code-review.md` já marcados como críticos — referencie-os
6. Ao final, liste sempre os controles que foram verificados e estão corretos
