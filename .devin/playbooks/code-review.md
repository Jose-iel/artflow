---
name: code-review
description: >
  Executa revisão estruturada de código em PRs ou trechos avulsos.
  Cobre segurança, confiabilidade, qualidade e padrões para projetos
  Node.js/Express (backend) e React/Vite (frontend).
triggers:
  - "review this PR"
  - "run code review"
  - "faça o code review"
  - "revisar PR"
---

# Playbook: Code Review

## Objetivo

Garantir que nenhum código com violações críticas chegue à produção.
Revisar segurança, confiabilidade, qualidade e conformidade com os padrões
do projeto antes de qualquer merge.

---

## Passo 1 — Identificar o contexto

Antes de iniciar, determine:

- **Modo PR:** foi fornecido um diff, link de PR ou conjunto de arquivos alterados?
- **Modo Interativo:** o desenvolvedor colou um trecho direto no chat?

No **Modo PR**, obtenha o diff antes de analisar. Se nenhum diff foi colado, use:

```bash
git fetch origin
git diff origin/main...HEAD        # diff completo do branch contra main
git diff --stat origin/main...HEAD  # lista de arquivos e tamanho da mudança
```

Em ambos os casos, siga os mesmos critérios de análise e estrutura de output.
No Modo PR, foque **apenas no diff** — não revise código não alterado.

---

## Passo 2 — Consultar o knowledge do projeto

Antes de avaliar qualquer código, leia OBRIGATORIAMENTE:

```
.devin/knowledge/project-standards.md   # convenções, domínio, padrões de stack
.devin/rules/artflow-rules.md            # regras gerais (exports, naming, scripts)
```

Esses arquivos contêm as convenções do projeto (naming, estrutura de pastas,
modelo de domínio, padrões de API, hierarquia de papéis e bibliotecas adotadas).
Use-os como referência para o Passo 3. Sempre que uma regra do projeto for
violada, cite explicitamente qual convenção foi quebrada.

---

## Passo 3 — Executar a análise

Avalie o código nas quatro dimensões abaixo, nesta ordem de prioridade:

### 🔴 Segurança — CRÍTICO (bloqueia merge)

Verificar obrigatoriamente:

- [ ] Injeção: SQL, NoSQL, command injection, path traversal
- [ ] Credenciais, tokens ou secrets hardcoded ou expostos
- [ ] Autenticação ou autorização ausente/incorreta em endpoints
- [ ] Validação de input insuficiente (body, query params, headers)
- [ ] Dependências com CVEs conhecidos adicionadas no PR
- [ ] CORS, CSRF ou security headers mal configurados
- [ ] Dados sensíveis expostos em logs ou respostas de API
- [ ] `.env` ou arquivos de configuração commitados por engano

### 🔴 Confiabilidade — CRÍTICO (bloqueia merge)

- [ ] Operações assíncronas sem `try/catch` ou `.catch()` adequado
- [ ] Race conditions em operações concorrentes
- [ ] Memory leaks óbvios (listeners não removidos, referências circulares)
- [ ] Lógica de negócio claramente incorreta ou invertida
- [ ] Ausência de tratamento de erro em chamadas externas (APIs, DB)

### 🟠 Qualidade de Código — MAIOR (recomenda correção antes do merge)

- [ ] Funções com mais de uma responsabilidade (violação de SRP)
- [ ] Duplicação de lógica que deveria ser abstraída
- [ ] Nomes sem semântica (`data`, `temp`, `aux`, `result2`)
- [ ] Complexidade ciclomática excessiva (muitos ifs aninhados)
- [ ] Código morto ou comentado sem justificativa
- [ ] Ausência de tipagem onde TypeScript é esperado
- [ ] Uso de `any` (o projeto exige `unknown` quando necessário)
- [ ] **Default export** introduzido (o projeto exige named exports)
- [ ] Endpoint sem uso dos middlewares de permissão (`requireRole`, `requireSameSquad`, `requireSameEmpresa`, `canAccessUser`)
- [ ] Quebra de isolamento entre squad/empresa (acesso cross-tenant não validado)
- [ ] Erros lançados sem `AppError` ou resposta fora do padrão `{ status, message?, data? }`
- [ ] Senha (`senha`) ou dado sensível retornado em resposta de API
- [ ] Chamada HTTP no frontend sem usar `services/api.ts` (`apiGet/apiPost/...`)
- [ ] Lógica de negócio ou novo endpoint sem teste correspondente (Jest/Vitest)

### 🟡 Padrões e Boas Práticas — MENOR (sugestão opcional)

- [ ] Inconsistência com o estilo do restante do codebase
- [ ] Ausência de comentário em lógica não óbvia
- [ ] Oportunidades de melhoria de performance não críticas
- [ ] Imports não utilizados ou ordenação inconsistente

---

## Passo 4 — Produzir o output

Use a estrutura abaixo. Não omita seções — se não houver problemas em uma
categoria, escreva explicitamente que nenhum foi encontrado.

```
## 📋 Resumo do Review

**Veredicto:** [escolha um]
  🚫 BLOQUEADO — existem violações críticas que impedem o merge
  ⚠️  APROVADO COM RESSALVAS — sem críticos, mas há problemas maiores
  ✅  APROVADO — nenhum problema crítico ou maior encontrado

**Arquivos analisados:** X
**Problemas encontrados:** X críticos · X maiores · X menores

---

## 🚫 Violações Críticas

> Se nenhuma: "Nenhuma violação crítica encontrada."

### [CRÍTICO-01] <título curto e descritivo>

- **Arquivo:** `caminho/arquivo.ts` — linha X
- **Problema:** <descrição objetiva do que está errado>
- **Risco:** <impacto real se for para produção>
- **Correção exigida:**

  ```ts
  // código corrigido
  ```

---

## 🟠 Problemas Maiores

> Se nenhum: "Nenhum problema maior encontrado."

### [MAIOR-01] <título>

- **Arquivo:** `caminho/arquivo.ts` — linha X
- **Problema:** <descrição>
- **Sugestão:**

  ```ts
  // código sugerido
  ```

---

## 🟡 Sugestões Menores

> Se nenhuma: "Nenhuma sugestão menor."

- `arquivo.ts` linha X — <sugestão breve>

---

## ✅ O que está bem feito

<Liste explicitamente o que foi bem implementado. O review não é só negativo.>
```

---

## Regras de Comportamento

1. **Nunca aprove código com violações críticas**, independente de contexto,
   justificativa de prazo ou pressão externa.

2. Sempre aponte a **linha ou trecho exato** — nunca seja vago como
   "o tratamento de erro poderia ser melhor".

3. Quando sugerir correção, forneça o **código corrigido**, não só a descrição.

4. Se houver dúvida sobre a intenção do código, **pergunte antes de assumir**
   que é um bug.

5. Se o código estiver bem escrito, **diga isso** — o agente não é negativista
   por padrão.

6. No Modo PR, revise **apenas o diff**. Não comente sobre código pré-existente
   que não foi alterado, a menos que a alteração do PR introduza um problema
   nele.

7. Em Modo Interativo, se o trecho for incompleto para uma análise de segurança
   conclusiva, sinalize explicitamente o que não pôde ser avaliado e por quê.
