#!/bin/bash

# Configurações
BACKUP_DIR="/opt/artflow/backups"
CONTAINER_NAME="artflow_postgres_prod"
DB_NAME="artflow_prod"
DB_USER="postgres"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Script de Restore do Banco de Dados${NC}"
echo ""

# Verificar se o container está rodando
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Erro: Container $CONTAINER_NAME não está rodando!${NC}"
    exit 1
fi

# Listar backups disponíveis
echo -e "${YELLOW}📋 Backups disponíveis:${NC}"
echo ""
ls -lht "${BACKUP_DIR}"/artflow_prod_*.sql.gz | nl | awk '{print $1 ") " $10 " - " $6}'
echo ""

# Solicitar qual backup restaurar
read -p "Digite o número do backup para restaurar (ou 'q' para sair): " BACKUP_NUMBER

if [ "$BACKUP_NUMBER" = "q" ]; then
    echo -e "${YELLOW}ℹ️  Operação cancelada${NC}"
    exit 0
fi

# Obter o arquivo de backup selecionado
BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/artflow_prod_*.sql.gz | sed -n "${BACKUP_NUMBER}p")

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup inválido!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📁 Arquivo selecionado: $(basename $BACKUP_FILE)${NC}"
echo ""

# Confirmação
read -p "⚠️  ATENÇÃO: Isso irá SUBSTITUIR todos os dados atuais! Confirma? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}ℹ️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Iniciando restore...${NC}"

# Criar backup de segurança antes do restore
SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
echo -e "${YELLOW}💾 Criando backup de segurança...${NC}"
docker exec "$CONTAINER_NAME" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    | gzip > "$SAFETY_BACKUP"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup de segurança criado: $(basename $SAFETY_BACKUP)${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup de segurança!${NC}"
    exit 1
fi

# Restaurar backup
echo -e "${YELLOW}🔄 Restaurando backup...${NC}"
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql \
    -U "$DB_USER" \
    -d "$DB_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Restore concluído com sucesso!${NC}"
    echo -e "${YELLOW}ℹ️  Backup de segurança mantido em: $(basename $SAFETY_BACKUP)${NC}"
else
    echo -e "${RED}❌ Erro ao restaurar backup!${NC}"
    echo -e "${YELLOW}🔄 Restaurando backup de segurança...${NC}"
    gunzip -c "$SAFETY_BACKUP" | docker exec -i "$CONTAINER_NAME" psql \
        -U "$DB_USER" \
        -d "$DB_NAME"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Operação concluída!${NC}"
