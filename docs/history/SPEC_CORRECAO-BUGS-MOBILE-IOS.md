# Correção de Bugs Mobile iOS - Plano de Implementação

**Data:** 30 de Janeiro de 2026  
**Agente:** SPEC  

---

## Visão Geral

Correção de dois bugs críticos que afetam a experiência mobile iOS na tela de aprovação de posts do cliente:

1. **Botão de ação escondido** pela barra de navegação do iOS no modal de aprovação
2. **Preview de imagens quebrado** do Google Drive em dispositivos mobile reais (iOS Safari e Chrome)

Ambos os problemas foram reportados em iPhone 16 e não ocorrem em desktop ou DevTools mobile.

---

## Análise do Estado Atual

### Problema 1: Botão Escondido no Modal (iOS Safe Area)

**Causa Raiz:**
- iOS Safari/Chrome possuem barras de navegação dinâmicas que cobrem conteúdo fixo
- Modal usa `max-h-[90vh]` mas não considera a "safe area" do iOS
- Meta viewport não possui `viewport-fit=cover`, impedindo acesso à safe area

**Arquivos Afetados:**
- `frontend/index.html` - linha 6 (meta viewport)
- `frontend/src/features/posts/components/PostModal.tsx` - linhas 244-347 (container de ações mobile)

**Comportamento Atual:**
- Container de ações mobile (linha 245): `<div className="bg-white p-4 border-t border-gray-200">`
- Botões de ação (linhas 329-345): Sem padding-bottom adicional para safe area
- Resultado: Botão fica parcialmente/totalmente coberto pela barra de navegação do iOS

### Problema 2: Preview de Imagem Não Carrega (Google Drive CORS/Referrer)

**Causa Raiz:**
- Google Drive thumbnail API bloqueia requisições de mobile Safari por política de referrer
- Mobile Safari tem políticas de privacidade mais restritivas que desktop
- Tags `<img>` não especificam `referrerPolicy`, usando o padrão do browser

**Arquivos Afetados:**
- `frontend/src/features/posts/components/PostModal.tsx`:
  - Linha 163-170: `<img>` do preview mobile
  - Linha 403-410: `<img>` do preview desktop
- `frontend/src/features/dashboard/components/DashboardContent.tsx`:
  - Linha 236-243: `<img>` do card de post

**Comportamento Atual:**
- Imagens usam `getPreviewUrl()` que retorna: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
- Tags `<img>` não possuem atributo `referrerPolicy`
- Resultado: Mobile Safari envia referrer que Google Drive bloqueia (403)

### Descobertas Principais:

- ✅ Modal usa Headless UI Dialog com layout responsivo (mobile: `lg:hidden`, desktop: `hidden lg:flex`)
- ✅ Tailwind CSS é usado para toda estilização
- ✅ Não há testes existentes para PostModal
- ✅ Padrão de testes do projeto: Vitest + Testing Library em `src/__tests__/`
- ✅ Google Drive utils já implementado em `src/utils/googleDriveUtils.ts`

---

## Estado Final Desejado

Após implementação completa:

1. ✅ Botão de ação visível e clicável em iPhone 16 (iOS Safari e Chrome)
2. ✅ Preview de imagem carrega corretamente em dispositivos mobile reais
3. ✅ Desktop continua funcionando normalmente (sem regressões)
4. ✅ Safe area respeitada em todos os dispositivos iOS
5. ✅ Testes automatizados verificam atributos corretos

**Verificação:**
- Manual: Testar em iPhone 16 (iOS Safari e Chrome)
- Automatizada: Testes unitários verificam presença de atributos

---

## O Que NÃO Estamos Fazendo

- ❌ Não estamos alterando a lógica de negócio de aprovação
- ❌ Não estamos mudando o design ou layout do modal
- ❌ Não estamos modificando a API do Google Drive
- ❌ Não estamos criando fallback para imagens (já existe onError)
- ❌ Não estamos testando em dispositivos Android (fora do escopo)
- ❌ Não estamos refatorando o componente PostModal

---

## Abordagem de Implementação

**Estratégia:**
1. Corrigir viewport primeiro (impacto global, mas seguro)
2. Adicionar safe-area padding no container de ações mobile
3. Adicionar referrerPolicy em todas as imagens do Google Drive
4. Criar testes para prevenir regressões

**Raciocínio:**
- Mudanças são mínimas e cirúrgicas
- Não afetam lógica de negócio
- Compatíveis com todos os browsers (graceful degradation)
- Safe-area-inset é ignorado em browsers que não suportam (desktop)
- referrerPolicy="no-referrer" é suportado por todos os browsers modernos

---

## Fase 1: Correção do Viewport e Safe Area (iOS)

### Visão Geral
Adicionar suporte à safe area do iOS para garantir que o botão de ação não seja coberto pela barra de navegação.

### Mudanças Necessárias:

#### 1.1 Atualizar Meta Viewport (index.html)

**Arquivo:** `frontend/index.html`  
**Linha Atual:** 6  
**Mudança:** Adicionar `viewport-fit=cover` ao meta viewport

**Código Atual:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Código Novo:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Justificativa:**
- `viewport-fit=cover` permite que o layout acesse a safe area do iOS
- Necessário para usar `env(safe-area-inset-*)` no CSS
- Não afeta comportamento em outros browsers (ignorado)

---

#### 1.2 Adicionar Safe Area Padding no Container de Ações Mobile

**Arquivo:** `frontend/src/features/posts/components/PostModal.tsx`  
**Linha Atual:** 245  
**Mudança:** Adicionar padding-bottom com safe-area-inset

**Código Atual:**
```tsx
{/* Mobile Actions */}
<div className="bg-white p-4 border-t border-gray-200">
```

**Código Novo:**
```tsx
{/* Mobile Actions */}
<div className="bg-white p-4 border-t border-gray-200 pb-[calc(1rem+env(safe-area-inset-bottom))]">
```

**Explicação:**
- `pb-[calc(1rem+env(safe-area-inset-bottom))]` substitui o `p-4` padrão no padding-bottom
- `1rem` = padding padrão (equivalente ao `p-4` do Tailwind)
- `env(safe-area-inset-bottom)` = espaço adicional da safe area do iOS
- Em browsers sem safe area, `env(safe-area-inset-bottom)` retorna `0px`

**Nota Importante:**
- Tailwind não possui classe nativa para safe-area-inset
- Usamos classe arbitrária do Tailwind: `pb-[valor]`
- O `p-4` original aplica padding em todos os lados (top, right, bottom, left)
- Precisamos manter o padding nos outros lados, então mantemos `p-4` e sobrescrevemos apenas o bottom

**Código Completo Atualizado (linhas 244-247):**
```tsx
{/* Mobile Actions */}
<div className="bg-white p-4 border-t border-gray-200 pb-[calc(1rem+env(safe-area-inset-bottom))]">
  <div className="mb-4">
    <h3 className="text-sm font-medium text-gray-700 mb-3">Ações do Post</h3>
```

---

### Critérios de Sucesso:

#### Verificação Automatizada:
- [ ] Build completa sem erros: `npm run build`
- [ ] Type checking passa: `npm run typecheck`
- [ ] Linting passa: `npm run lint`
- [ ] Testes unitários passam: `npm test`

#### Verificação Manual:
- [ ] Abrir modal em iPhone 16 (iOS Safari)
- [ ] Verificar que botão de ação está completamente visível
- [ ] Clicar no botão e confirmar que funciona
- [ ] Repetir teste no Chrome iOS
- [ ] Testar com teclado aberto (campo de comentário)
- [ ] Verificar que desktop não foi afetado (sem espaçamento extra)
- [ ] Testar em orientação portrait e landscape

**Nota de Implementação:** Após completar esta fase e toda verificação automatizada passar, pause aqui para confirmação manual do humano antes de prosseguir para a próxima fase.

---

## Fase 2: Correção do Preview de Imagens (Google Drive)

### Visão Geral
Adicionar `referrerPolicy="no-referrer"` em todas as tags `<img>` que carregam imagens do Google Drive para evitar bloqueio por política de referrer.

### Mudanças Necessárias:

#### 2.1 Atualizar Preview Mobile no PostModal

**Arquivo:** `frontend/src/features/posts/components/PostModal.tsx`  
**Linhas Atuais:** 163-170  
**Mudança:** Adicionar `referrerPolicy="no-referrer"`

**Código Atual:**
```tsx
<img 
  src={preview.url} 
  alt="Post"
  className="w-full h-64 object-cover"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagem+não+disponível'
  }}
/>
```

**Código Novo:**
```tsx
<img 
  src={preview.url} 
  alt="Post"
  className="w-full h-64 object-cover"
  referrerPolicy="no-referrer"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagem+não+disponível'
  }}
/>
```

---

#### 2.2 Atualizar Preview Desktop no PostModal

**Arquivo:** `frontend/src/features/posts/components/PostModal.tsx`  
**Linhas Atuais:** 403-410  
**Mudança:** Adicionar `referrerPolicy="no-referrer"`

**Código Atual:**
```tsx
<img 
  src={preview.url} 
  alt="Post"
  className="w-full h-[300px] object-cover"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Imagem+não+disponível'
  }}
/>
```

**Código Novo:**
```tsx
<img 
  src={preview.url} 
  alt="Post"
  className="w-full h-[300px] object-cover"
  referrerPolicy="no-referrer"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Imagem+não+disponível'
  }}
/>
```

---

#### 2.3 Atualizar Preview nos Cards do Dashboard

**Arquivo:** `frontend/src/features/dashboard/components/DashboardContent.tsx`  
**Linhas Atuais:** 236-243  
**Mudança:** Adicionar `referrerPolicy="no-referrer"`

**Código Atual:**
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

**Código Novo:**
```tsx
<img 
  src={preview.url} 
  alt={post.legenda || 'Post image'}
  className="w-full h-40 sm:h-48 object-cover"
  referrerPolicy="no-referrer"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Imagem+não+disponível'
  }}
/>
```

---

### Critérios de Sucesso:

#### Verificação Automatizada:
- [ ] Build completa sem erros: `npm run build`
- [ ] Type checking passa: `npm run typecheck`
- [ ] Linting passa: `npm run lint`
- [ ] Testes unitários passam: `npm test`

#### Verificação Manual:
- [ ] Abrir dashboard em iPhone 16 (iOS Safari)
- [ ] Verificar que imagens dos cards carregam corretamente
- [ ] Clicar em um card para abrir o modal
- [ ] Verificar que imagem do modal carrega corretamente
- [ ] Repetir teste no Chrome iOS
- [ ] Verificar que desktop continua funcionando (Chrome, Safari, Firefox)
- [ ] Testar com diferentes posts (diferentes URLs do Google Drive)

**Nota de Implementação:** Após completar esta fase e toda verificação automatizada passar, pause aqui para confirmação manual do humano antes de prosseguir para a próxima fase.

---

## Fase 3: Testes e Validação

### Visão Geral
Criar testes unitários para garantir que os atributos corretos estão presentes e prevenir regressões futuras.

### Mudanças Necessárias:

#### 3.1 Criar Testes para PostModal

**Arquivo:** `frontend/src/__tests__/components/PostModal.test.tsx` (NOVO)  
**Framework:** Vitest + @testing-library/react  

**Código Completo:**
```typescript
import { render, screen } from '@/__tests__/test-utils'
import { PostModal } from '@/features/posts/components/PostModal'
import { describe, it, expect, vi } from 'vitest'

describe('PostModal Component', () => {
  const mockPost = {
    id: '1',
    imagemUrl: 'https://drive.google.com/file/d/ABC123/view',
    legenda: 'Test post',
    dataAgendada: null,
    status: 'Pendente',
    comentarioCliente: null,
    comentarioAdmin: null,
    criadoEm: new Date().toISOString(),
  }

  const mockOnClose = vi.fn()
  const mockOnUpdateStatus = vi.fn()

  it('should render mobile image with referrerPolicy="no-referrer"', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    )

    // Busca todas as imagens renderizadas
    const images = screen.getAllByRole('img')
    
    // Verifica que pelo menos uma imagem tem referrerPolicy="no-referrer"
    const hasReferrerPolicy = images.some(
      (img) => img.getAttribute('referrerpolicy') === 'no-referrer'
    )
    
    expect(hasReferrerPolicy).toBe(true)
  })

  it('should render mobile actions container with safe-area padding', () => {
    const { container } = render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    )

    // Busca o container de ações mobile
    const actionsContainer = container.querySelector('.bg-white.p-4.border-t')
    
    expect(actionsContainer).toBeTruthy()
    
    // Verifica que o container tem a classe de safe-area padding
    const hasClass = actionsContainer?.className.includes('pb-[calc(1rem+env(safe-area-inset-bottom))]')
    
    expect(hasClass).toBe(true)
  })

  it('should render action buttons in mobile layout', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    )

    // Verifica que os botões de ação estão presentes
    expect(screen.getByText('Selecionar uma Ação')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })
})
```

**Casos de Teste Cobertos:**
- ✅ Verifica presença de `referrerPolicy="no-referrer"` nas imagens
- ✅ Verifica presença da classe de safe-area padding no container
- ✅ Verifica que botões de ação são renderizados

---

#### 3.2 Criar Testes para DashboardContent

**Arquivo:** `frontend/src/__tests__/components/DashboardContent.test.tsx` (ATUALIZAR)  
**Mudança:** Adicionar teste para referrerPolicy nas imagens dos cards

**Código a Adicionar:**
```typescript
it('should render post card images with referrerPolicy="no-referrer"', async () => {
  // Mock da API
  vi.mocked(apiGet).mockResolvedValueOnce({
    posts: [
      {
        id: '1',
        imagemUrl: 'https://drive.google.com/file/d/ABC123/view',
        legenda: 'Test post',
        dataAgendada: null,
        status: 'Pendente',
        comentarioCliente: null,
        comentarioAdmin: null,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      }
    ]
  })

  render(<DashboardContent />)

  // Aguarda o carregamento dos posts
  await screen.findByText('Test post')

  // Busca a imagem do card
  const cardImage = screen.getByAltText('Test post')
  
  // Verifica que tem referrerPolicy="no-referrer"
  expect(cardImage.getAttribute('referrerpolicy')).toBe('no-referrer')
})
```

**Nota:** Este teste deve ser adicionado ao arquivo existente `frontend/src/__tests__/components/Dashboard.test.tsx` (se existir) ou criar um novo arquivo específico para DashboardContent.

---

### Passos de Teste Manual:

#### Teste Completo em iPhone 16 (iOS Safari):

1. **Preparação:**
   - Fazer deploy da aplicação em ambiente de staging/produção
   - Acessar URL no iPhone 16 com Safari
   - Fazer login como cliente

2. **Teste do Dashboard:**
   - Verificar que imagens dos cards carregam (não aparecem com "?")
   - Verificar que layout está correto
   - Scroll pela lista de posts

3. **Teste do Modal:**
   - Clicar em um card de post
   - Verificar que modal abre corretamente
   - Verificar que imagem do post carrega no preview
   - Scroll até o final do modal
   - **CRÍTICO:** Verificar que botão de ação está completamente visível
   - Clicar no botão "Aprovar" ou "Solicitar Alteração"
   - Verificar que ação funciona

4. **Teste com Teclado:**
   - Abrir modal novamente
   - Selecionar "Solicitar Alteração"
   - Clicar no campo de comentário (teclado abre)
   - Verificar que botão ainda está visível/acessível
   - Fechar teclado
   - Verificar que layout volta ao normal

5. **Teste em Orientação Landscape:**
   - Rotacionar dispositivo
   - Repetir testes 3 e 4

#### Teste Completo em iPhone 16 (Chrome iOS):

Repetir todos os testes acima no Chrome iOS.

#### Teste de Regressão em Desktop:

1. **Chrome Desktop:**
   - Verificar que imagens carregam
   - Verificar que modal funciona
   - Verificar que não há espaçamento extra no modal

2. **Safari Desktop:**
   - Repetir testes do Chrome

3. **Firefox Desktop:**
   - Repetir testes do Chrome

---

### Critérios de Sucesso:

#### Verificação Automatizada:
- [ ] Todos os testes unitários passam: `npm test`
- [ ] Coverage mínimo mantido: `npm run test:coverage`
- [ ] Build completa sem erros: `npm run build`
- [ ] Type checking passa: `npm run typecheck`
- [ ] Linting passa: `npm run lint`

#### Verificação Manual:
- [ ] ✅ Botão de ação visível e clicável em iPhone 16 (Safari e Chrome)
- [ ] ✅ Preview de imagem carrega corretamente no mobile real
- [ ] ✅ Desktop continua funcionando normalmente
- [ ] ✅ Não há regressões em outros componentes
- [ ] ✅ Testes com teclado aberto funcionam
- [ ] ✅ Orientação landscape funciona

---

## Estratégia de Testes

> **IMPORTANTE:** Seguindo os padrões de testes levantados pelo SEARCH no `TEMP_PRD.md`.

### Framework e Estrutura:
- **Framework:** Vitest 4.0.15
- **Testing Library:** @testing-library/react 16.3.0
- **Localização:** `frontend/src/__tests__/components/`
- **Nomenclatura:** `PostModal.test.tsx`, `DashboardContent.test.tsx`

### Comandos de Teste:
```bash
npm test                  # Roda todos os testes
npm run test:watch        # Modo watch para desenvolvimento
npm run test:ui           # Interface visual (Vitest UI)
npm run test:coverage     # Relatório de cobertura
npm run test:ci           # CI/CD (sem watch)
```

### Testes Unitários:

**Arquivo:** `frontend/src/__tests__/components/PostModal.test.tsx`

Casos a cobrir:
- ✅ Imagens renderizadas com `referrerPolicy="no-referrer"`
- ✅ Container de ações mobile com classe de safe-area padding
- ✅ Botões de ação renderizados corretamente
- ✅ Modal abre e fecha corretamente

**Arquivo:** `frontend/src/__tests__/components/DashboardContent.test.tsx` (atualizar)

Casos a cobrir:
- ✅ Imagens dos cards renderizadas com `referrerPolicy="no-referrer"`
- ✅ Cards clicáveis abrem o modal
- ✅ Posts carregam corretamente da API

### Testes Manuais:

**Dispositivos Necessários:**
- iPhone 16 (iOS Safari) - **OBRIGATÓRIO**
- iPhone 16 (Chrome iOS) - **OBRIGATÓRIO**
- Desktop (Chrome, Safari, Firefox) - Teste de regressão

**Cenários Críticos:**
1. Modal aberto com teclado visível
2. Modal aberto com barra de navegação expandida/retraída
3. Scroll dentro do modal
4. Imagens de diferentes tamanhos do Google Drive
5. Orientação portrait e landscape

---

## Considerações de Performance

### Impacto Esperado:
- ✅ **Nenhum impacto negativo** na performance
- ✅ `viewport-fit=cover` é apenas uma meta tag (sem overhead)
- ✅ `env(safe-area-inset-bottom)` é calculado pelo browser (sem JS)
- ✅ `referrerPolicy="no-referrer"` não afeta tempo de carregamento
- ✅ Possível **melhoria** no carregamento de imagens mobile (menos bloqueios)

### Otimizações:
- Imagens já usam thumbnail API do Google Drive (`sz=w1000`)
- Fallback com `onError` já implementado
- Lazy loading pode ser adicionado futuramente (fora do escopo)

---

## Notas de Migração

### Não Aplicável
Este fix não requer migração de dados ou alterações de schema.

### Compatibilidade:
- ✅ `viewport-fit=cover` é ignorado em browsers que não suportam (graceful degradation)
- ✅ `env(safe-area-inset-bottom)` retorna `0px` em browsers sem safe area
- ✅ `referrerPolicy="no-referrer"` é suportado por todos os browsers modernos (IE11+)

### Rollback:
Se necessário, reverter as mudanças é trivial:
1. Remover `viewport-fit=cover` do meta viewport
2. Remover classe `pb-[calc(1rem+env(safe-area-inset-bottom))]`
3. Remover atributo `referrerPolicy` das tags `<img>`

---

## Referências

### PRD Original:
- `TEMP_PRD.md` - Pesquisa completa do Agente SEARCH

### Documentação Externa:
- **MDN:** `env()` CSS function - https://developer.mozilla.org/en-US/docs/Web/CSS/env
- **MDN:** HTMLImageElement.referrerPolicy - https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy
- **Apple:** Safari iOS viewport-fit - https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- **Material UI Issue #46953:** iOS 26 Drawer/Modal gap problem
- **Chakra UI Issue #5909:** Referrer-Policy prop para Avatar & Image

### Arquivos Relacionados:
- `frontend/index.html` - Meta viewport
- `frontend/src/features/posts/components/PostModal.tsx` - Componente principal
- `frontend/src/features/dashboard/components/DashboardContent.tsx` - Cards de posts
- `frontend/src/utils/googleDriveUtils.ts` - Utilitários do Google Drive

---

## Resumo de Mudanças

### Arquivos Modificados: 3
1. `frontend/index.html` - 1 linha alterada
2. `frontend/src/features/posts/components/PostModal.tsx` - 3 linhas alteradas
3. `frontend/src/features/dashboard/components/DashboardContent.tsx` - 1 linha alterada

### Arquivos Criados: 1
1. `frontend/src/__tests__/components/PostModal.test.tsx` - Novo arquivo de teste

### Total de Linhas Alteradas: ~5 linhas
### Complexidade: Baixa
### Risco: Baixo (mudanças cirúrgicas, sem impacto em lógica de negócio)

---

## Próxima Etapa

Com este `SPEC_CORRECAO-BUGS-MOBILE-IOS.md` finalizado e aprovado, o **Agente de Implementação (CODE)** pode assumir para:
- Ler esta especificação técnica
- Executar as 3 fases incrementalmente
- Validar critérios de sucesso automatizados a cada fase
- Pausar para verificação manual quando necessário
- Reportar conclusão ou problemas encontrados
