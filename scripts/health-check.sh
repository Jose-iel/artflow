#!/bin/bash

# Configurações
BACKEND_URL="http://localhost:3333/api/health"
FRONTEND_URL="http://localhost:3000"
BACKEND_PUBLIC_URL="https://backend-artflow.iel-company.com.br/api/health"
FRONTEND_PUBLIC_URL="https://artflow.iel-company.com.br"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🏥 Health Check - ArtFlow${NC}"
echo ""

# Verificar containers
echo -e "${YELLOW}🐳 Verificando containers...${NC}"
CONTAINERS=$(docker compose -f /opt/artflow/docker/docker-compose.prod.yaml ps --format "table {{.Name}}\t{{.Status}}")
echo "$CONTAINERS"
echo ""

# Verificar backend local
echo -e "${YELLOW}🔌 Verificando backend (local)...${NC}"
if curl -f -s "$BACKEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Backend local: OK${NC}"
else
    echo -e "${RED}❌ Backend local: FALHOU${NC}"
fi

# Verificar frontend local
echo -e "${YELLOW}🌐 Verificando frontend (local)...${NC}"
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend local: OK${NC}"
else
    echo -e "${RED}❌ Frontend local: FALHOU${NC}"
fi

echo ""

# Verificar backend público
echo -e "${YELLOW}🔌 Verificando backend (público)...${NC}"
if curl -f -s "$BACKEND_PUBLIC_URL" > /dev/null; then
    echo -e "${GREEN}✅ Backend público: OK${NC}"
else
    echo -e "${RED}❌ Backend público: FALHOU${NC}"
fi

# Verificar frontend público
echo -e "${YELLOW}🌐 Verificando frontend (público)...${NC}"
if curl -f -s "$FRONTEND_PUBLIC_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend público: OK${NC}"
else
    echo -e "${RED}❌ Frontend público: FALHOU${NC}"
fi

echo ""

# Verificar banco de dados
echo -e "${YELLOW}🗄️  Verificando banco de dados...${NC}"
DB_CHECK=$(docker exec artflow_postgres_prod psql -U postgres -d artflow_prod -c "SELECT 1;" 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Banco de dados: OK${NC}"
else
    echo -e "${RED}❌ Banco de dados: FALHOU${NC}"
fi

echo ""

# Estatísticas de recursos
echo -e "${YELLOW}📊 Uso de recursos:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep artflow

echo ""
echo -e "${GREEN}✅ Health check concluído!${NC}"
