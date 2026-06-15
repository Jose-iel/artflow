# Plano de Implementação - Funcionalidade de Carousel

**Data:** 15 de Junho de 2026  
**Status:** Planejamento  
**Prioridade:** Alta

---

## Visão Geral

Implementar funcionalidade de carousel no ArtFlow, permitindo que usuários façam upload de múltiplas mídias (imagens e/ou vídeos) em um único post, similar ao Instagram carousel.

---

## Análise do Sistema Atual

### Backend (Node.js + Express + TypeORM + PostgreSQL)
- **Entidade Post** (`backend/src/entities/Post.ts`): Campo `imagePath` (string única)
- **Upload Service** (`backend/src/services/upload.service.ts`): Upload de arquivo único
- **Controllers**: Todos trabalham com `imagePath` único
- **DTOs** (`backend/src/dtos/post.dto.ts`): Interface com `imagePath: string`
- **Testes**: 156 testes automatizados usando `imagePath`

### Frontend (React 19 + Vite + TypeScript)
- **PostForm** (`frontend/src/features/posts/components/PostForm.tsx`): Upload único via FileUpload
- **PostModal** (`frontend/src/features/posts/components/PostModal.tsx`): Preview de mídia única
- **FileUpload** (`frontend/src/components/FileUpload.tsx`): `multiple: false`
- **PostsPage** (`frontend/src/pages/posts/PostsPage.tsx`): Thumbnail única na listagem

### Banco de Dados
- **Tabela posts** (`database/init.sql:87`): `image_path TEXT NOT NULL`

---

## Estratégia de Implementação

### Abordagem Escolhida: Campo JSONB + Compatibilidade Total

**Por que não criar nova tabela?**
- Migrations complexas
- JOINs adicionais impactam performance
- Quebra compatibilidade com código existente
- Requer atualização de todos os 156 testes

**Abordagem JSONB:**
- Campo `media` (JSONB) armazena array de mídias
- Mantém `imagePath` para compatibilidade com posts antigos
- Posts antigos continuam funcionando sem alteração
- Sem JOINs - melhor performance
- Fácil rollback se necessário

---

## Estrutura de Dados Proposta

### Backend - Entidade Post
```typescript
@Entity('posts')
export class Post {
  // ... campos existentes ...
  
  // LEGACY - mantido para compatibilidade
  @Column({ name: 'image_path', type: 'text', nullable: true })
  imagePath: string | null;
  
  // NOVO - array de mídias para carousel
  @Column({ name: 'media', type: 'jsonb', nullable: true })
  media: Array<{
    filePath: string;
    mimeType: string;
    order: number;
  }> | null;
}
```

### DTOs
```typescript
// CreatePostDto - aceita ambos para compatibilidade
export class CreatePostDto {
  imagePath?: string;           // LEGACY - para posts antigos
  media?: MediaItem[];          // NOVO - para carousel
  legenda?: string;
  dataAgendada?: string;
  clienteId?: string;
}

export interface MediaItem {
  filePath: string;
  mimeType: string;
  order: number;
}

// PostResponseDto - sempre retorna ambos
export class PostResponseDto {
  id: string;
  imagePath: string | null;     // LEGACY - primeira mídia ou null
  media: MediaItem[] | null;   // NOVO - array de mídias
  legenda: string | null;
  // ... outros campos ...
}
```

---

## Fases de Implementação

### Fase 1: Banco de Dados e Entidades
**Arquivos:**
- `database/migrations/001_add_media_column.sql` (novo)
- `backend/src/entities/Post.ts` (editar)

**Mudanças:**
1. Migration adiciona coluna `media` JSONB nullable
2. Altera `image_path` para nullable (para novos posts carousel)
3. Atualiza entidade Post com campo `media`

**Critérios de Sucesso:**
- [ ] Migration executa sem erros
- [ ] TypeORM reconhece novo campo
- [ ] Posts antigos continuam com `imagePath` preenchido

---

### Fase 2: Backend - DTOs e Validação
**Arquivos:**
- `backend/src/dtos/post.dto.ts` (editar)

**Mudanças:**
1. Atualizar `CreatePostDto` com `media` opcional
2. Atualizar `PostResponseDto` com `media`
3. Adicionar validação: pelo menos `imagePath` ou `media` deve existir
4. Validar estrutura do array `media` (max 10 itens)

**Critérios de Sucesso:**
- [ ] Validação aceita `imagePath` (modo legacy)
- [ ] Validação aceita `media` (modo carousel)
- [ ] Rejeita quando ambos são vazios

---

### Fase 3: Backend - Upload Service
**Arquivos:**
- `backend/src/services/upload.service.ts` (editar)

**Mudanças:**
1. Adicionar método `handleMultipleUploads(req: Request)`
2. Processar múltiplos arquivos em lote
3. Retornar array de `{ filePath, fileName, mimeType }`
4. Manter `handleUpload` existente para compatibilidade

**Interface:**
```typescript
async handleMultipleUploads(req: Request): Promise<Array<{
  filePath: string;
  fileName: string;
  mimeType: string;
}>>
```

**Critérios de Sucesso:**
- [ ] Upload de múltiplos arquivos funciona
- [ ] Validação de tamanho/tipo por arquivo
- [ ] Retorna array ordenado corretamente

---

### Fase 4: Backend - Controllers
**Arquivos:**
- `backend/src/controllers/post.controller.ts` (editar)
- `backend/src/controllers/admin.controller.ts` (editar)

**Mudanças em `createPost`:**
1. Aceitar `media` ou `imagePath` no body
2. Se `media` fornecido:
   - Salvar no campo `media` (JSONB)
   - Opcional: sincronizar `imagePath` com primeira mídia
3. Se `imagePath` fornecido (legacy):
   - Salvar no campo `imagePath` como antes

**Mudanças em `updatePost`:**
1. Permitir atualização de `media` array
2. Deletar arquivos antigos quando trocar mídias
3. Reordenar quando `order` mudar

**Mudanças em `deletePost`:**
1. Deletar todos os arquivos do array `media`
2. Deletar arquivo de `imagePath` (legacy)

**Critérios de Sucesso:**
- [ ] Criar post com carousel funciona
- [ ] Criar post com imagePath único funciona (compatibilidade)
- [ ] Editar post atualiza mídias corretamente
- [ ] Deletar post remove todos os arquivos

---

### Fase 5: Frontend - FileUpload Component
**Arquivos:**
- `frontend/src/components/FileUpload.tsx` (editar)

**Mudanças:**
1. Alterar `multiple: false` para `multiple: true`
2. Aceitar até 10 arquivos
3. Mostrar lista de arquivos selecionados com preview
4. Permitir remover arquivos individuais da lista
5. Mostrar progresso de upload por arquivo
6. Retornar array de `fileData` no `onFileUploaded`

**Nova Interface:**
```typescript
interface FileUploadProps {
  onFilesUploaded: (files: Array<{
    filePath: string;
    fileName: string;
    url: string;
    mimeType: string;
  }>) => void;
  maxFiles?: number;  // default: 10
  maxSize?: number;   // default: 500MB total
  // ... outros props
}
```

**Critérios de Sucesso:**
- [ ] Selecionar múltiplos arquivos funciona
- [ ] Preview de todos os arquivos
- [ ] Remover arquivo da lista antes de upload
- [ ] Upload progress por arquivo

---

### Fase 6: Frontend - MediaCarousel Component
**Arquivos:**
- `frontend/src/components/MediaCarousel.tsx` (novo)

**Funcionalidades:**
1. Exibir múltiplas mídias (imagens/vídeos)
2. Navegação com setas laterais
3. Indicadores de posição (dots)
4. Suporte a swipe em mobile
5. Auto-play opcional (para vídeos)
6. Fullscreen mode

**Interface:**
```typescript
interface MediaCarouselProps {
  media: Array<{
    url: string;
    mimeType: string;
  }>;
  autoPlay?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  aspectRatio?: '1:1' | '4:5' | '9:16';
}
```

**Critérios de Sucesso:**
- [ ] Navegação entre mídias funciona
- [ ] Dots mostram posição atual
- [ ] Swipe funciona em mobile
- [ ] Vídeos têm controles de play/pause

---

### Fase 7: Frontend - PostForm Integration
**Arquivos:**
- `frontend/src/features/posts/components/PostForm.tsx` (editar)

**Mudanças:**
1. Alterar estado `imagePath: string` para `media: MediaItem[]`
2. Integrar FileUpload múltiplo
3. Permitir reordenar mídias (drag & drop ou botões)
4. Mostrar preview de todas as mídias
5. Permitir remover mídia individual
6. No submit, enviar `media` array

**Estado Novo:**
```typescript
interface CreatePostData {
  media?: Array<{
    filePath: string;
    mimeType: string;
    order: number;
  }>;
  imagePath?: string;  // para compatibilidade
  legenda: string | null;
  // ...
}
```

**Critérios de Sucesso:**
- [ ] Upload múltiplo no formulário
- [ ] Reordenar mídias
- [ ] Remover mídia antes de salvar
- [ ] Preview de todas as mídias

---

### Fase 8: Frontend - PostModal Integration
**Arquivos:**
- `frontend/src/features/posts/components/PostModal.tsx` (editar)

**Mudanças:**
1. Substituir render de imagem/vídeo único por MediaCarousel
2. Se `media` existir: usar carousel
3. Se `imagePath` existir (legacy): mostrar como antes
4. Manter proporção 3:4 ou 9:16 conforme modo

**Lógica de Render:**
```typescript
{post.media && post.media.length > 1 ? (
  <MediaCarousel media={post.media} aspectRatio={previewMode === 'story' ? '9:16' : '4:5'} />
) : post.imagePath ? (
  // Render antigo - imagem/vídeo único
) : (
  <div>Sem mídia</div>
)}
```

**Critérios de Sucesso:**
- [ ] Carousel aparece quando há múltiplas mídias
- [ ] Imagem única quando post é legacy
- [ ] Navegação funciona no modal

---

### Fase 9: Frontend - PostsPage (Listagem)
**Arquivos:**
- `frontend/src/pages/posts/PostsPage.tsx` (editar)

**Mudanças:**
1. Na thumbnail, mostrar indicador quando post tem carousel
2. Indicador: "1/5" ou ícone de carousel
3. Mostrar primeira mídia do array

**UI:**
```typescript
// Thumbnail com indicador de carousel
<div className="relative">
  <img src={firstMediaUrl} />
  {post.media && post.media.length > 1 && (
    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
      <StackIcon className="w-4 h-4" />
      {post.media.length}
    </div>
  )}
</div>
```

**Critérios de Sucesso:**
- [ ] Indicador aparece quando há múltiplas mídias
- [ ] Thumbnail mostra primeira mídia corretamente

---

### Fase 10: Testes
**Arquivos:**
- `backend/src/__tests__/integration/posts.test.ts` (adicionar)
- `backend/src/__tests__/unit/controllers/post.controller.test.ts` (adicionar)
- `frontend/src/__tests__/components/PostForm.test.tsx` (adicionar)

**Testes a Adicionar:**
1. Backend:
   - Criar post com `media` array
   - Atualizar `media` array
   - Deletar post com múltiplas mídias remove todos arquivos
   - Validação de limite máximo (10 mídias)

2. Frontend:
   - Upload múltiplo no PostForm
   - Reordenar mídias
   - Carousel navegação

**Critérios de Sucesso:**
- [ ] Todos os 156 testes antigos passam
- [ ] Novos testes de carousel passam
- [ ] Cobertura mantida > 80%

---

## Configurações e Limites

### Limites do Sistema
| Configuração | Valor | Justificativa |
|--------------|-------|---------------|
| Máximo de mídias por post | 10 | Igual Instagram |
| Tamanho máximo por arquivo | 500MB | Manter padrão atual |
| Tamanho máximo total | 500MB | Limitação do servidor |
| Formatos aceitos | jpg, png, gif, webp, mp4, mov, avi, webm | Mesmo do atual |
| Ordenação | Sim | Via drag & drop ou botões |

### Decisões de UX
1. **Upload**: Arquivos são enviados um por um para melhor feedback de progresso
2. **Preview**: Todos os arquivos mostram preview antes de upload
3. **Reordenar**: Drag & drop simples na lista de previews
4. **Remover**: X em cada preview para remover antes de salvar
5. **Carousel**: Dots + setas laterais, swipe em mobile

---

## Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebra de compatibilidade | Baixa | Alto | Manter `imagePath` sempre preenchido |
| Performance com JSONB | Baixa | Médio | Índice GIN no campo `media` |
| Upload de muitos arquivos | Média | Médio | Limite de 10, progresso individual |
| Testes quebrando | Baixa | Alto | Manter todos os testes antigos, adicionar novos |
| Tamanho do JSONB | Baixa | Baixo | Limite físico de 1GB por campo |

---

## Checklist de Deploy

### Pre-Deploy
- [ ] Migration executada no ambiente de staging
- [ ] Todos os 156+ testes passando
- [ ] Teste manual de criação/edição/visualização de carousel
- [ ] Teste manual de posts antigos (compatibilidade)
- [ ] Backup do banco de dados

### Deploy
- [ ] Migration em produção
- [ ] Verificar logs de erro
- [ ] Smoke test rápido

### Post-Deploy
- [ ] Monitorar erros por 24h
- [ ] Verificar performance das queries
- [ ] Feedback dos usuários

---

## Notas Técnicas

### SQL Migration
```sql
-- Migration 001_add_media_column.sql
ALTER TABLE posts ADD COLUMN media JSONB NULL;
ALTER TABLE posts ALTER COLUMN image_path DROP NOT NULL;

-- Índice para performance (se necessário futuramente)
-- CREATE INDEX idx_posts_media ON posts USING GIN (media);
```

### Compatibilidade de Dados
- Posts antigos: `imagePath` preenchido, `media` = null
- Posts novos carousel: `media` preenchido, `imagePath` = primeira mídia (opcional)
- Posts novos único: `imagePath` preenchido, `media` = null

### API Endpoints Afetados
- `POST /api/posts` - aceita `media` ou `imagePath`
- `PUT /api/admin/posts/:id` - aceita atualização de `media`
- `DELETE /api/admin/posts/:id` - deleta todos os arquivos
- `GET /api/posts` - retorna `media` no response
- `GET /api/posts/:id` - retorna `media` no response
- `GET /api/admin/posts` - retorna `media` no response

---

## Próximos Passos

1. **Aprovação do plano** - Revisar com stakeholders
2. **Priorização** - Definir se implementação será gradual ou completa
3. **Design** - Definir UI/UX específica do carousel (se necessário)
4. **Implementação** - Seguir fases na ordem definida
5. **Testes** - Validação completa antes de deploy

---

**Arquivo criado em:** 15/06/2026  
**Responsável:** [A definir]  
**Prazo estimado:** 3-5 dias de desenvolvimento
