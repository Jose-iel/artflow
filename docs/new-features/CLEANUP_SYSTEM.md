# Sistema de Limpeza Automática

## Visão Geral

O sistema implementa uma limpeza automática de posts e arquivos antigos para otimizar o espaço de armazenamento e manter o banco de dados limpo.

## Funcionalidades

### 1. Limpeza Automática de Posts
- **Frequência**: Todo dia à meia-noite (00:00)
- **Frequência de teste**: A cada 6 horas
- **Regra**: Remove posts com mais de 7 dias da data de agendamento
- **Ação**: 
  - Remove arquivos físicos do diretório de uploads
  - Remove registros do banco de dados

### 2. Detecção de Arquivos Órfãos
- Identifica arquivos no diretório uploads que não possuem post correspondente
- Pode ser executado manualmente via API
- Opção de remover arquivos órfãos automaticamente

## Endpoints da API

### Executar Limpeza Manualmente
```bash
POST /cleanup/run
Authorization: Bearer <admin_token>
```

### Verificar Arquivos Órfãos
```bash
GET /cleanup/orphaned
Authorization: Bearer <admin_token>
```

### Remover Arquivos Órfãos
```bash
DELETE /cleanup/orphaned
Authorization: Bearer <admin_token>
```

## Script de Limpeza Manual

Execute o script para limpeza manual:
```bash
./scripts/cleanup-old-posts.sh
```

O script irá:
1. Verificar se o backend está rodando
2. Executar a limpeza de posts antigos
3. Verificar arquivos órfãos
4. Perguntar se deseja remover os arquivos órfãos

## Configuração

Variáveis de ambiente relevantes:
- `UPLOAD_DIR`: Diretório de uploads (padrão: 'uploads')
- `NODE_ENV`: Ambiente (development/production)

## Logs

O sistema gera logs detalhados:
- Início e fim do processo de limpeza
- Quantidade de posts encontrados e removidos
- Arquivos que não puderam ser removidos
- Erros durante o processo

## Segurança

- Apenas usuários com role `ADMIN_MASTER` ou `SUPER_USER` podem executar a limpeza manualmente
- O job automático executa com privilégios de sistema
- Arquivos são removidos permanentemente (sem lixeira)

## Monitoramento

Monitore os logs para:
- Posts que não puderam ser removidos
- Arquivos com permissões inadequadas
- Espaço em disco liberado

## Recuperação

**ATENÇÃO**: A limpeza é permanente! Certifique-se de:
- Ter backups regulares
- Configurar retenção adequada
- Testar em ambiente de desenvolvimento antes
