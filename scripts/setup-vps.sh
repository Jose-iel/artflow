#!/bin/bash

# Script de Setup Inicial da VPS para ArtFlow
# Execute como root: bash setup-vps.sh

set -e

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Setup Inicial VPS - ArtFlow${NC}"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo bash setup-vps.sh${NC}"
    exit 1
fi

# Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

# Instalar Docker
echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker instalado${NC}"
else
    echo -e "${GREEN}✅ Docker já instalado${NC}"
fi

# Instalar Docker Compose
echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    apt install docker-compose-plugin -y
    echo -e "${GREEN}✅ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✅ Docker Compose já instalado${NC}"
fi

# Instalar Nginx
echo -e "${YELLOW}🌐 Instalando Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✅ Nginx instalado${NC}"
else
    echo -e "${GREEN}✅ Nginx já instalado${NC}"
fi

# Instalar Certbot
echo -e "${YELLOW}🔒 Instalando Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install certbot python3-certbot-nginx -y
    echo -e "${GREEN}✅ Certbot instalado${NC}"
else
    echo -e "${GREEN}✅ Certbot já instalado${NC}"
fi

# Instalar Git
echo -e "${YELLOW}📦 Instalando Git...${NC}"
if ! command -v git &> /dev/null; then
    apt install git -y
    echo -e "${GREEN}✅ Git instalado${NC}"
else
    echo -e "${GREEN}✅ Git já instalado${NC}"
fi

# Configurar Firewall
echo -e "${YELLOW}🔥 Configurando Firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
echo -e "${GREEN}✅ Firewall configurado${NC}"

# Criar diretório do projeto
echo -e "${YELLOW}📁 Criando diretório do projeto...${NC}"
mkdir -p /opt/artflow
mkdir -p /opt/artflow/backups
echo -e "${GREEN}✅ Diretórios criados${NC}"

# Configurar chave SSH para deploy
echo -e "${YELLOW}🔑 Configurando chave SSH para deploy...${NC}"
if [ ! -f ~/.ssh/artflow_deploy ]; then
    ssh-keygen -t ed25519 -C "deploy@artflow" -f ~/.ssh/artflow_deploy -N ""
    echo -e "${GREEN}✅ Chave SSH criada${NC}"
    echo ""
    echo -e "${YELLOW}📋 Adicione esta chave pública no GitHub (Deploy Keys):${NC}"
    cat ~/.ssh/artflow_deploy.pub
    echo ""
else
    echo -e "${GREEN}✅ Chave SSH já existe${NC}"
fi

# Configurar chave SSH para GitHub Actions
echo -e "${YELLOW}🔑 Configurando chave SSH para GitHub Actions...${NC}"
if [ ! -f ~/.ssh/github_actions ]; then
    ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
    cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
    echo -e "${GREEN}✅ Chave SSH para GitHub Actions criada${NC}"
    echo ""
    echo -e "${YELLOW}📋 Adicione esta chave PRIVADA no GitHub Secrets (VPS_SSH_KEY):${NC}"
    cat ~/.ssh/github_actions
    echo ""
else
    echo -e "${GREEN}✅ Chave SSH para GitHub Actions já existe${NC}"
fi

# Otimizações do sistema
echo -e "${YELLOW}⚙️  Aplicando otimizações do sistema...${NC}"
cat >> /etc/sysctl.conf <<EOF

# ArtFlow optimizations
vm.swappiness=10
net.core.somaxconn=1024
net.ipv4.tcp_max_syn_backlog=2048
EOF
sysctl -p
echo -e "${GREEN}✅ Otimizações aplicadas${NC}"

# Configurar log rotation
echo -e "${YELLOW}📝 Configurando log rotation...${NC}"
cat > /etc/logrotate.d/artflow <<EOF
/var/log/nginx/artflow_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \$(cat /var/run/nginx.pid)
    endscript
}
EOF
echo -e "${GREEN}✅ Log rotation configurado${NC}"

# Verificar instalações
echo ""
echo -e "${YELLOW}🔍 Verificando instalações...${NC}"
docker --version
docker compose version
nginx -v
certbot --version
git --version

echo ""
echo -e "${GREEN}✅ Setup inicial concluído!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "1. Configure o DNS para apontar para este servidor"
echo "2. Clone o repositório em /opt/artflow"
echo "3. Configure o SSL com certbot"
echo "4. Configure os secrets no GitHub Actions"
echo "5. Faça o primeiro deploy"
echo ""
echo -e "${YELLOW}📚 Consulte docs/SETUP_MANUAL.md para instruções detalhadas${NC}"
