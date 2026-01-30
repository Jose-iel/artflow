# PRD - Correção de Bugs Mobile: Modal de Aprovação e Preview de Imagens

**Data:** 30 de Janeiro de 2026  
**Agente:** SEARCH  
**Status:** Pesquisa Completa

---

## 1. Resumo do Pedido

O usuário reportou dois problemas críticos que afetam a experiência mobile (iOS) na tela de aprovação de posts do cliente:

### Problema 1: Botão de Ação Escondido no Modal
- **Local:** Modal "Gerenciar Post" > "Informações do Post"
- **Sintoma:** Botão de ação (Aprovar/Reprovar) fica parcialmente ou totalmente coberto pela barra de navegação do browser
- **Dispositivos Afetados:** iPhone 16 (iOS)
- **Browsers:** Safari (parcialmente coberto) e Chrome (totalmente coberto)
- **Ocorrência:** Sempre, independente do teclado estar aberto ou fechado

### Problema 2: Preview de Imagem Não Carrega no Mobile
- **Local:** Tela de cliente (card de post clicável) + dentro do modal "Gerenciar Post"
- **Sintoma:** Imagem aparece com ícone "?" em fundo azul (imagem quebrada)
- **Tipo de Imagem:** Links do Google Drive (`/view` URLs) - não são uploads locais
- **Funciona:** Desktop e DevTools mobile (100% funcional)
- **Não Funciona:** Apenas em dispositivos mobile reais (iOS Safari e Chrome)

---

## 2. Contexto Atual da Codebase

### 2.1 Arquivos Relacionados ao Modal

**Modal Principal:**
- **Arquivo:** `/Users/josehenrique/Pessoal/artflow/frontend/src/features/posts/components/PostModal.tsx`
- **Linhas:** 1-638
- **Componente:** `PostModal` (React + TypeScript)
- **UI Library:** Headless UI (`@headlessui/react`)
- **Estrutura:**
  - Layout Mobile: Linhas 107-349 (classe `lg:hidden`)
  - Layout Desktop: Linhas 352-632 (classe `hidden lg:flex`)
  - Botões de Ação Mobile: Linhas 329-345
  - Preview de Imagem Mobile: Linhas 139-184
  - Preview de Imagem Desktop: Linhas 379-424

**Container do Modal:**
```tsx
// Linha 105
<Dialog.Panel className="mx-auto max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
  {/* Mobile Layout */}
  <div className="lg:hidden flex flex-col h-[90vh] max-h-[800px]">
```

**Botão de Ação (Mobile):**
```tsx
// Linhas 330-338
<button
  onClick={handleStatusUpdate}
  disabled={!selectedStatus || (selectedStatus === 'Não aprovado' && !comment.trim())}
  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
>
  {selectedStatus === 'Aprovado' ? 'Aprovar' : 
   selectedStatus === 'Não aprovado' ? 'Reprovar' : 
   'Selecionar uma Ação'}
</button>
```

### 2.2 Arquivos Relacionados ao Preview de Imagem

**Utilitário do Google Drive:**
- **Arquivo:** `/Users/josehenrique/Pessoal/artflow/frontend/src/utils/googleDriveUtils.ts`
- **Linhas:** 1-78
- **Função Principal:** `getPreviewUrl()` (linhas 46-77)

**Lógica Atual de Preview:**
```typescript
// Para imagens do Google Drive
if (fileId && !isVideo) {
  return {
    url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    isVideo: false,
    isDriveFile: true,
    useIframe: false
  }
}
```

**Componente de Preview no Modal (Mobile):**
```tsx
// Linhas 162-171
<img 
  src={preview.url} 
  alt="Post"
  className="w-full h-64 object-cover"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagem+não+disponível'
  }}
/>
```

**Componente de Preview no Card (Dashboard):**
- **Arquivo:** `/Users/josehenrique/Pessoal/artflow/frontend/src/features/dashboard/components/DashboardContent.tsx`
- **Linhas:** 235-244

```tsx
<img 
  src={preview.url} 
  alt={post.legenda || 'Post image'}
  className="w-full h-40 sm:h-48 object-cover"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Imagem+não+disponível'
  }}
/>
```

### 2.3 Configuração do Viewport

**Arquivo:** `/Users/josehenrique/Pessoal/artflow/frontend/index.html`
- **Linha 6:** `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
- **Observação:** NÃO possui `viewport-fit=cover`

---

## 3. Regras de Negócio

### Fluxo de Aprovação de Post
1. Cliente acessa o dashboard e visualiza seus posts
2. Cliente clica em um card de post (com preview de imagem)
3. Modal "Gerenciar Post" abre com:
   - Preview da imagem do post
   - Informações do post (status, data, legenda)
   - Opções de ação: "Aprovar" ou "Solicitar Alteração"
   - Campo de comentário (obrigatório para reprovação)
4. Cliente seleciona uma ação e clica no botão
5. Status é atualizado no backend

### Requisitos de Imagem
- Sistema armazena apenas URLs do Google Drive (formato `/view`)
- Não há upload de imagens no sistema
- Imagens devem ser exibidas via thumbnail API do Google Drive
- Preview deve funcionar tanto no card quanto no modal

---

## 4. Histórico Relevante

**Pasta de Histórico:** `/Users/josehenrique/Pessoal/artflow/docs/history/`
- **Status:** Vazia (sem SPECs anteriores)

**Observação:** Este é o primeiro bug report documentado relacionado a mobile iOS.

---

## 5. Padrões de Testes do Projeto

### Framework de Testes
- **Framework:** Vitest 4.0.15
- **Testing Library:** @testing-library/react 16.3.0
- **DOM Testing:** @testing-library/jest-dom 6.9.1
- **Coverage:** @vitest/coverage-v8 4.0.15

### Estrutura de Pastas
```
frontend/src/__tests__/
├── components/
│   ├── Dashboard.test.tsx
│   ├── LoginForm.test.tsx
│   ├── PostForm.test.tsx
│   └── ... (7 arquivos de teste)
├── hooks/
│   ├── useClientes.test.ts
│   ├── useEmpresas.test.ts
│   └── useSquads.test.ts
└── stores/
    └── authStore.test.ts
```

### Padrão de Nomenclatura
- Arquivos de teste: `[ComponentName].test.tsx` ou `[hookName].test.ts`
- Localização: Pasta `__tests__/` na raiz do `src/`

### Exemplo de Teste (Dashboard)
```typescript
// Arquivo: frontend/src/__tests__/components/Dashboard.test.tsx
import { render, screen } from '@/__tests__/test-utils'
import { DashboardContent } from '@/features/dashboard'
import { vi } from 'vitest'

describe('Dashboard Component', () => {
  it('should render client dashboard with welcome message', () => {
    render(<DashboardContent />)
    expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument()
  })
})
```

### Comandos de Teste
```bash
npm test              # Roda testes
npm run test:watch    # Modo watch
npm run test:ui       # Interface visual
npm run test:coverage # Relatório de cobertura
npm run test:ci       # CI/CD
```

---

## 6. Referências Externas

### 6.1 Problema 1: Botão Escondido (iOS Safe Area)

**Causa Raiz Identificada:**
- iOS Safari/Chrome possuem barras de navegação dinâmicas que cobrem conteúdo fixo
- Modal usa `max-h-[90vh]` mas não considera a "safe area" do iOS
- Sem `viewport-fit=cover`, o layout viewport termina acima da safe area inferior

**Documentação Oficial:**
- **Material UI Issue #46953:** iOS 26 Drawer/Modal gap problem
  - URL: https://github.com/mui/material-ui/issues/46953
  - Problema idêntico: Modal deixa gap na parte inferior no iOS 26
  - Solução sugerida: Adicionar `viewport-fit=cover` no meta tag

**Soluções Técnicas Encontradas:**
1. **Meta Tag Viewport:**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
   ```

2. **CSS Safe Area Insets:**
   ```css
   padding-bottom: env(safe-area-inset-bottom);
   /* ou */
   padding-bottom: calc(1rem + env(safe-area-inset-bottom));
   ```

3. **Tailwind CSS:**
   ```
   pb-[env(safe-area-inset-bottom)]
   ```

**Recursos:**
- MDN: `env()` CSS function
- Apple Developer Forums: Safari iOS modal positioning
- WebKit: Safe area insets documentation

### 6.2 Problema 2: Preview de Imagem (Google Drive CORS/Referrer)

**Causa Raiz Identificada:**
- Google Drive thumbnail API bloqueia requisições de mobile Safari por política de referrer
- Desktop funciona porque envia referrer diferente ou usa cache
- Mobile Safari tem políticas de privacidade mais restritivas

**Documentação Encontrada:**
- **Stack Overflow:** "Safari on iPhone not loading image from Google Drive"
- **GitHub Issue (Chakra UI #5909):** Referrer-Policy prop para Avatar & Image
  - Problema: `referrer-policy: origin` causa 403 em googleusercontent.com
  - Solução: `referrerPolicy="no-referrer"` resolve o problema

**Soluções Técnicas Encontradas:**
1. **Atributo HTML referrerPolicy:**
   ```tsx
   <img 
     src={preview.url}
     referrerPolicy="no-referrer"
     alt="Post"
   />
   ```

2. **Alternativa: Usar iframe para imagens:**
   ```tsx
   <iframe
     src={`https://drive.google.com/file/d/${fileId}/preview`}
     title="Preview"
   />
   ```

3. **Meta Tag (global):**
   ```html
   <meta name="referrer" content="no-referrer">
   ```

**Recursos:**
- MDN: Referrer-Policy header
- MDN: HTMLImageElement.referrerPolicy
- W3Schools: img referrerpolicy attribute
- web.dev: Referrer and Referrer-Policy best practices

---

## 7. Mapeamento de Arquivos

### Arquivos que Serão Impactados

#### Problema 1: Botão Escondido
1. **`/Users/josehenrique/Pessoal/artflow/frontend/index.html`**
   - Adicionar `viewport-fit=cover` no meta viewport
   - Impacto: Global (todo o app)

2. **`/Users/josehenrique/Pessoal/artflow/frontend/src/features/posts/components/PostModal.tsx`**
   - Adicionar padding-bottom com safe-area-inset no container de ações mobile
   - Linhas afetadas: ~245-347 (seção de ações mobile)
   - Impacto: Apenas modal de posts

3. **`/Users/josehenrique/Pessoal/artflow/frontend/src/index.css`** (se necessário)
   - Adicionar classes CSS customizadas para safe-area
   - Impacto: Reutilizável em outros componentes

#### Problema 2: Preview de Imagem
1. **`/Users/josehenrique/Pessoal/artflow/frontend/src/features/posts/components/PostModal.tsx`**
   - Adicionar `referrerPolicy="no-referrer"` nos elementos `<img>` (linhas 163, 403)
   - Impacto: Preview de imagem no modal

2. **`/Users/josehenrique/Pessoal/artflow/frontend/src/features/dashboard/components/DashboardContent.tsx`**
   - Adicionar `referrerPolicy="no-referrer"` no elemento `<img>` (linha 236)
   - Impacto: Preview de imagem nos cards de post

### Dependências Entre Componentes

```
index.html (viewport-fit)
    ↓
PostModal.tsx (safe-area padding + referrerPolicy)
    ↑
DashboardContent.tsx (abre modal + referrerPolicy nos cards)
    ↑
googleDriveUtils.ts (gera URLs de preview)
```

### Pontos de Integração
- **Modal System:** Headless UI Dialog component
- **Image Loading:** Google Drive Thumbnail API
- **Responsive Design:** Tailwind CSS breakpoints (lg:)
- **State Management:** React useState local no modal

---

## 8. Observações Importantes

### Validações Necessárias
1. **Testar em dispositivos reais:**
   - iPhone 16 (iOS Safari e Chrome)
   - Outros modelos de iPhone (iOS 15+)
   - Android (para garantir que não quebra)

2. **Testar cenários:**
   - Modal aberto com teclado visível
   - Modal aberto com barra de navegação expandida/retraída
   - Scroll dentro do modal
   - Imagens de diferentes tamanhos do Google Drive

3. **Verificar side effects:**
   - `viewport-fit=cover` pode afetar outros componentes
   - Safe-area-inset pode criar espaçamento desnecessário em desktop
   - `referrerPolicy="no-referrer"` pode afetar analytics (verificar)

### Limitações Conhecidas
- Não é possível testar via DevTools mobile (problema só ocorre em device real)
- Google Drive thumbnail API tem rate limits (não afeta este fix)
- iOS Safari tem comportamento diferente entre versões (testar múltiplas)

### Critérios de Sucesso
1. ✅ Botão de ação visível e clicável em iPhone 16 (Safari e Chrome)
2. ✅ Preview de imagem carrega corretamente no mobile real
3. ✅ Desktop continua funcionando normalmente
4. ✅ Não há regressões em outros componentes
5. ✅ Testes automatizados passam (se aplicável)

---

## 9. Próximos Passos

Este documento será usado pelo **Agente SPEC** para:
1. Arquitetar a solução técnica detalhada
2. Criar o plano de implementação
3. Definir estratégia de testes
4. Validar impactos e riscos

**Handoff:** Todas as informações necessárias foram coletadas e documentadas.
