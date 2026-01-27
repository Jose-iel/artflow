# Especificação: Correção de Erro 500 e Auto-Publicação de Posts Agendados

**Data:** 27 de Janeiro de 2026  
**Autor:** Sistema de Análise  
**Status:** ✅ Implementado

---

## 1. Problema Identificado

### 1.1 Erro 500 na Listagem de Posts

**Sintoma:**
- Página `/posts` não renderiza para admin e funcionário
- Console mostra: `GET /admin/posts 500 (Internal Server Error)`
- Mensagem: "Erro ao carregar posts do dashboard"

**Causa Raiz:**
- Lógica de auto-atualização no método `getDashboardPosts` tenta atualizar posts com `data_agendada` no passado
- Constraint do banco `chk_data_agendada_valida` impede atualização de posts com data no passado
- Erro: `new row for relation "posts" violates check constraint "chk_data_agendada_valida"`

**Localização do Erro:**
- Arquivo: `backend/src/controllers/admin.controller.ts`
- Método: `getDashboardPosts`
- Linhas: ~471-478

### 1.2 Dados Faltantes na Resposta

**Problema:**
- Frontend espera `post.squad.empresa.nome` mas backend não carrega essa relação
- Falta `leftJoinAndSelect` com tabelas `squad` e `empresa`

**Localização:**
- Arquivo: `backend/src/controllers/admin.controller.ts`
- Método: `getDashboardPosts`
- Linhas: ~430-436

---

## 2. Solução Proposta

### 2.1 Fase 1: Correção Imediata (Resolver Erro 500)

#### 2.1.1 Remover Lógica de Auto-Atualização Problemática

**Arquivo:** `backend/src/controllers/admin.controller.ts`  
**Localização:** Linhas ~471-478

**Código a REMOVER:**
```typescript
// Atualiza automaticamente posts aprovados com data agendada no passado para Publicado
const now = new Date();
for (const post of posts) {
  if (post.status === PostStatus.APROVADO && post.dataAgendada && new Date(post.dataAgendada) < now) {
    post.status = PostStatus.PUBLICADO;
    await this.postRepository.save(post);
  }
}
```

**Justificativa:**
- Método de leitura (GET) não deve modificar dados
- Causa erro 500 devido à constraint do banco
- Será substituído por job agendado

---

#### 2.1.2 Adicionar Joins com Squad e Empresa

**Arquivo:** `backend/src/controllers/admin.controller.ts`  
**Localização:** Linhas ~430-436

**Código ATUAL:**
```typescript
const queryBuilder = this.postRepository
  .createQueryBuilder('post')
  .leftJoinAndSelect('post.cliente', 'cliente')
  .leftJoinAndSelect('post.createdBy', 'createdBy')
  .orderBy('post.criadoEm', 'DESC');
```

**Código MODIFICADO:**
```typescript
const queryBuilder = this.postRepository
  .createQueryBuilder('post')
  .leftJoinAndSelect('post.cliente', 'cliente')
  .leftJoinAndSelect('post.createdBy', 'createdBy')
  .leftJoinAndSelect('post.squad', 'squad')
  .leftJoinAndSelect('squad.empresa', 'empresa')
  .orderBy('post.criadoEm', 'DESC');
```

**Resultado:**
- Frontend terá acesso a `post.squad.empresa.nome`
- Tabela renderizará corretamente com dados de empresa

---

### 2.2 Fase 2: Implementação de Auto-Publicação (Job Agendado)

#### 2.2.1 Instalar Dependências

**Comando:**
```bash
cd backend
npm install node-cron
npm install --save-dev @types/node-cron
```

**Dependências:**
- `node-cron`: ^3.0.3 (ou versão mais recente)
- `@types/node-cron`: ^3.0.11 (ou versão mais recente)

---

#### 2.2.2 Criar Service de Scheduler

**Arquivo:** `backend/src/services/post-scheduler.service.ts` (CRIAR NOVO)

**Conteúdo Completo:**
```typescript
import { AppDataSource } from '../config/data-source';
import { Post, PostStatus } from '../entities/Post';
import { LessThan } from 'typeorm';

export class PostSchedulerService {
  private get postRepository() {
    return AppDataSource.getRepository(Post);
  }

  /**
   * Atualiza posts aprovados com data agendada no passado para Publicado
   * Executa automaticamente via cron job
   */
  async publishScheduledPosts(): Promise<number> {
    try {
      const now = new Date();
      
      // Busca posts aprovados com data agendada no passado
      const postsToPublish = await this.postRepository.find({
        where: {
          status: PostStatus.APROVADO,
          dataAgendada: LessThan(now)
        },
        relations: ['cliente', 'squad']
      });

      if (postsToPublish.length === 0) {
        console.log('[PostScheduler] Nenhum post para publicar');
        return 0;
      }

      console.log(`[PostScheduler] Encontrados ${postsToPublish.length} posts para publicar`);

      // Atualiza cada post
      let publishedCount = 0;
      for (const post of postsToPublish) {
        try {
          post.status = PostStatus.PUBLICADO;
          post.dataAgendada = null; // Limpa data para evitar constraint
          await this.postRepository.save(post);
          
          console.log(`[PostScheduler] ✓ Post ${post.id} publicado (Cliente: ${post.cliente.nome})`);
          publishedCount++;
        } catch (error) {
          console.error(`[PostScheduler] ✗ Erro ao publicar post ${post.id}:`, error);
        }
      }

      console.log(`[PostScheduler] Total publicado: ${publishedCount}/${postsToPublish.length}`);
      return publishedCount;
    } catch (error) {
      console.error('[PostScheduler] Erro ao buscar posts agendados:', error);
      throw error;
    }
  }
}
```

---

#### 2.2.3 Configurar Cron Job no Servidor

**Arquivo:** `backend/src/server.ts` (MODIFICAR)

**Adicionar imports no topo do arquivo:**
```typescript
import cron from 'node-cron';
import { PostSchedulerService } from './services/post-scheduler.service';
```

**Adicionar após `app.listen()` e antes do `.catch()`:**
```typescript
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    
    // Inicia servidor
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // ========== ADICIONAR ESTE BLOCO ==========
    // Configura scheduler para auto-publicação de posts
    const postScheduler = new PostSchedulerService();
    
    // Executa todo dia à meia-noite (00:00)
    cron.schedule('0 0 * * *', async () => {
      console.log('[PostScheduler] Iniciando verificação de posts agendados...');
      try {
        const published = await postScheduler.publishScheduledPosts();
        if (published > 0) {
          console.log(`[PostScheduler] ✓ ${published} posts publicados com sucesso`);
        }
      } catch (error) {
        console.error('[PostScheduler] ✗ Erro na execução:', error);
      }
    });
    
    console.log('[PostScheduler] Job agendado configurado (executa todo dia à meia-noite)');
    // ==========================================
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
```

**Configuração do Cron:**
- Pattern: `'0 0 * * *'`
- Significado: Todo dia à meia-noite (00:00)
- Timezone: UTC (padrão do servidor)

---

#### 2.2.4 Remover Constraint do Banco de Dados

**Opção A: Via SQL (Recomendado)**

Conectar ao banco de dados PostgreSQL e executar:

```sql
-- Remove constraint que impede data_agendada no passado
ALTER TABLE posts DROP CONSTRAINT IF EXISTS chk_data_agendada_valida;
```

**Opção B: Modificar Script de Inicialização**

**Arquivo:** `database/init.sql`  
**Localização:** Linhas ~97-98

**Código ATUAL:**
```sql
CONSTRAINT chk_data_agendada_valida 
    CHECK (data_agendada IS NULL OR data_agendada >= CURRENT_TIMESTAMP)
```

**Código MODIFICADO:**
```sql
-- Constraint removida para permitir histórico de datas agendadas
-- A validação de data futura é feita apenas na criação via backend
```

**IMPORTANTE:** Se modificar `init.sql`, será necessário recriar o banco de dados para aplicar a mudança.

---

## 3. Fluxo de Status dos Posts

### 3.1 Ciclo de Vida

```
┌─────────────────┐
│ "Não aprovado"  │ ← Post criado
└────────┬────────┘
         │ Cliente aprova
         ↓
┌─────────────────┐
│   "Aprovado"    │ ← Aguardando data agendada
└────────┬────────┘
         │ Data agendada passa (cron job)
         ↓
┌─────────────────┐
│  "Publicado"    │ ← Status final
└─────────────────┘
```

### 3.2 Regras de Negócio

1. Post criado → Status inicial: `"Não aprovado"`
2. Cliente aprova → Status muda para: `"Aprovado"` (com `data_agendada` futura)
3. Cron job roda à meia-noite → Verifica posts com status `"Aprovado"` e `data_agendada < hoje`
4. Posts encontrados → Status muda para: `"Publicado"` e `data_agendada` é limpa (null)

---

## 4. Checklist de Implementação

### 4.1 Fase 1: Correção Imediata

- [x] **Arquivo:** `backend/src/controllers/admin.controller.ts`
  - [x] Adicionar `.leftJoinAndSelect('post.squad', 'squad')` (linha ~434)
  - [x] Adicionar `.leftJoinAndSelect('squad.empresa', 'empresa')` (linha ~435)
  - [x] Remover bloco de auto-atualização (linhas ~471-478)

- [ ] **Testar:**
  - [ ] Acessar `/posts` como admin
  - [ ] Verificar que lista renderiza sem erro 500
  - [ ] Verificar que coluna "Empresa" aparece na tabela

### 4.2 Fase 2: Job Agendado

- [x] **Instalar dependências:**
  - [x] `pnpm add node-cron`
  - [x] `pnpm add -D @types/node-cron`

- [x] **Criar arquivo:** `backend/src/services/post-scheduler.service.ts`
  - [x] Copiar código completo do service

- [x] **Modificar arquivo:** `backend/src/server.ts`
  - [x] Adicionar imports no topo
  - [x] Adicionar configuração do cron job após `app.listen()`

- [x] **Banco de dados:**
  - [x] Script de migração criado: `database/migrations/remove-data-agendada-constraint.sql`
  - [x] Constraint removida do `database/init.sql`
  - [ ] Executar migração no banco: `ALTER TABLE posts DROP CONSTRAINT IF EXISTS chk_data_agendada_valida;`

- [ ] **Testar:**
  - [ ] Reiniciar servidor backend
  - [ ] Verificar log: "Job agendado configurado (executa todo dia à meia-noite)"
  - [ ] Criar post de teste com data agendada no passado
  - [ ] Executar manualmente: `postScheduler.publishScheduledPosts()`
  - [ ] Verificar que post muda para "Publicado"

---

## 5. Comandos de Teste Manual

### 5.1 Testar Scheduler Manualmente

Adicionar rota temporária para teste:

**Arquivo:** `backend/src/routes/admin.ts`

```typescript
import { PostSchedulerService } from '../services/post-scheduler.service';

// Rota temporária para teste (REMOVER EM PRODUÇÃO)
router.get('/posts/publish-scheduled', async (req, res) => {
  try {
    const scheduler = new PostSchedulerService();
    const published = await scheduler.publishScheduledPosts();
    res.json({ 
      success: true, 
      message: `${published} posts publicados`,
      published 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

**Testar via curl:**
```bash
curl -X GET http://localhost:3333/api/admin/posts/publish-scheduled \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 5.2 Verificar Posts no Banco

```sql
-- Ver posts aprovados com data no passado
SELECT 
  id,
  status,
  data_agendada,
  legenda
FROM posts
WHERE status = 'Aprovado'
  AND data_agendada < CURRENT_TIMESTAMP;

-- Ver posts publicados recentemente
SELECT 
  id,
  status,
  data_agendada,
  atualizado_em,
  legenda
FROM posts
WHERE status = 'Publicado'
ORDER BY atualizado_em DESC
LIMIT 10;
```

---

## 6. Logs Esperados

### 6.1 Ao Iniciar Servidor

```
Database connected
Server running on port 3333
[PostScheduler] Job agendado configurado (executa todo dia à meia-noite)
```

### 6.2 Ao Executar Job (Meia-Noite)

**Caso tenha posts para publicar:**
```
[PostScheduler] Iniciando verificação de posts agendados...
[PostScheduler] Encontrados 3 posts para publicar
[PostScheduler] ✓ Post abc123... publicado (Cliente: Cliente A)
[PostScheduler] ✓ Post def456... publicado (Cliente: Cliente B)
[PostScheduler] ✓ Post ghi789... publicado (Cliente: Cliente C)
[PostScheduler] Total publicado: 3/3
[PostScheduler] ✓ 3 posts publicados com sucesso
```

**Caso não tenha posts:**
```
[PostScheduler] Iniciando verificação de posts agendados...
[PostScheduler] Nenhum post para publicar
```

---

## 7. Configurações Adicionais do Cron

### 7.1 Outras Opções de Schedule

```typescript
// A cada 1 minuto (para testes)
cron.schedule('* * * * *', async () => { ... });

// A cada 5 minutos
cron.schedule('*/5 * * * *', async () => { ... });

// A cada hora
cron.schedule('0 * * * *', async () => { ... });

// Todo dia à meia-noite (CONFIGURAÇÃO SOLICITADA)
cron.schedule('0 0 * * *', async () => { ... });

// Todo dia ao meio-dia
cron.schedule('0 12 * * *', async () => { ... });

// Toda segunda-feira à meia-noite
cron.schedule('0 0 * * 1', async () => { ... });
```

### 7.2 Configurar Timezone (Opcional)

Se quiser usar timezone do Brasil (UTC-3):

```typescript
cron.schedule('0 0 * * *', async () => {
  // ... código
}, {
  timezone: "America/Sao_Paulo"
});
```

---

## 8. Rollback (Se Necessário)

### 8.1 Reverter Mudanças no Backend

1. Restaurar código original em `admin.controller.ts`
2. Remover arquivo `post-scheduler.service.ts`
3. Remover configuração do cron em `server.ts`
4. Desinstalar dependências: `npm uninstall node-cron @types/node-cron`

### 8.2 Restaurar Constraint do Banco

```sql
ALTER TABLE posts 
ADD CONSTRAINT chk_data_agendada_valida 
CHECK (data_agendada IS NULL OR data_agendada >= CURRENT_TIMESTAMP);
```

---

## 9. Considerações de Produção

### 9.1 Monitoramento

- Adicionar logs em sistema de monitoramento (ex: Sentry, LogRocket)
- Configurar alertas para falhas no job
- Monitorar quantidade de posts publicados diariamente

### 9.2 Performance

- Job atual é eficiente para até ~1000 posts por execução
- Se volume crescer, considerar paginação na query
- Adicionar índice no banco: `CREATE INDEX idx_posts_scheduled ON posts(status, data_agendada) WHERE status = 'Aprovado';`

### 9.3 Escalabilidade

- Se usar múltiplas instâncias do backend, considerar usar job externo (ex: AWS Lambda, Cron Job do Kubernetes)
- Implementar lock distribuído para evitar execuções duplicadas

---

## 10. Resultado Final Esperado

### 10.1 Funcionalidades

✅ Página `/posts` renderiza corretamente para admin e funcionário  
✅ Erro 500 resolvido  
✅ Dados completos (empresa, squad) aparecem na tabela  
✅ Posts são publicados automaticamente à meia-noite  
✅ Logs mostram execução do job  
✅ Sistema escalável e profissional  

### 10.2 Comportamento

1. Usuário admin/funcionário acessa `/posts` → Lista carrega sem erro
2. Todo dia à meia-noite → Job executa automaticamente
3. Posts com status "Aprovado" e data no passado → Mudam para "Publicado"
4. Logs registram quantos posts foram publicados
5. Sistema continua funcionando normalmente

---

**Fim da Especificação**
