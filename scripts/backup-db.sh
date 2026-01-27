#!/bin/bash

# Configurações
BACKUP_DIR="/opt/artflow/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="artflow_prod_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="artflow_postgres_prod"
DB_NAME="artflow_prod"
DB_USER="postgres"
RETENTION_DAYS=7

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Iniciando backup do banco de dados...${NC}"

# Verificar se o diretório de backup existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 Criando diretório de backup...${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Verificar se o container está rodando
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Erro: Container $CONTAINER_NAME não está rodando!${NC}"
    exit 1
fi

# Criar backup
echo -e "${YELLOW}💾 Criando backup...${NC}"
docker exec "$CONTAINER_NAME" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Verificar se o backup foi criado com sucesso
if [ $? -eq 0 ] && [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✅ Backup criado com sucesso: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup!${NC}"
    exit 1
fi

# Remover backups antigos
echo -e "${YELLOW}🧹 Removendo backups com mais de ${RETENTION_DAYS} dias...${NC}"
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "artflow_prod_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ ${DELETED_COUNT} backup(s) antigo(s) removido(s)${NC}"
else
    echo -e "${YELLOW}ℹ️  Nenhum backup antigo para remover${NC}"
fi

# Listar backups existentes
echo -e "${YELLOW}📋 Backups disponíveis:${NC}"
ls -lh "${BACKUP_DIR}" | grep "artflow_prod_" | awk '{print $9, "(" $5 ")"}'

# Estatísticas
TOTAL_BACKUPS=$(ls -1 "${BACKUP_DIR}"/artflow_prod_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)

echo -e "${GREEN}✅ Backup concluído!${NC}"
echo -e "${YELLOW}📊 Total de backups: ${TOTAL_BACKUPS}${NC}"
echo -e "${YELLOW}💾 Espaço utilizado: ${TOTAL_SIZE}${NC}"
