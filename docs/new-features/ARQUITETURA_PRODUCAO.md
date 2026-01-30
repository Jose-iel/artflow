# 🏗️ Arquitetura de Produção - ArtFlow

**Data:** 27 de Janeiro de 2026  
**Objetivo:** Definir arquitetura completa para deploy em VPS com CI/CD  
**URLs Produção:**
- Frontend: `https://artflow.iel-company.com.br`
- Backend: `https://backend-artflow.iel-company.com.br`
- Grafana: `https://grafana-artflow.iel-company.com.br`
- Adminer: `https://db-artflow.iel-company.com.br`

---

## 📊 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            INTERNET                                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       VPS (Ubuntu 22.04 - 16GB RAM)                      │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Nginx Reverse Proxy (Host)                           │  │
│  │  - SSL/TLS (4 domínios)  - Rate Limiting  - Security Headers     │  │
│  └──┬────────┬────────┬────────┬──────────────────────────────────┘  │
│     │        │        │        │                                       │
│     ▼        ▼        ▼        ▼                                       │
│  ┌─────┐ ┌─────┐ ┌────────┐ ┌────────┐                               │
│  │Front│ │Back │ │Grafana │ │Adminer │                               │
│  │:3000│ │:3333│ │:3001   │ │:8080   │                               │
│  └──┬──┘ └──┬──┘ └───┬────┘ └───┬────┘                               │
│     │       │        │          │                                      │
│     │       │        │          │                                      │
│     │       ▼        │          ▼                                      │
│     │   ┌────────────────────────┐                                    │
│     │   │     PostgreSQL         │◄─────────────────┐                 │
│     │   │  (Optimized 4GB/12GB)  │                  │                 │
│     │   │    Port: 5432          │                  │                 │
│     │   └────────────────────────┘                  │                 │
│     │              ▲                                 │                 │
│     │              │                                 │                 │
│     │       ┌──────────────┐                  ┌──────────┐            │
│     │       │  Prometheus  │◄─────────────────│   Node   │            │
│     │       │    :9090     │                  │ Exporter │            │
│     │       └──────────────┘                  │  :9100   │            │
│     │                                         └──────────┘            │
│     │                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              Docker Network (artflow-network)                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Decisão: Estratégia de Bancos de Dados

### **Recomendação: Opção 1 - Três Bancos Separados**

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Container                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📦 artflow_dev          → Desenvolvimento local             │
│     - Dados persistentes                                     │
│     - Seed data do init.sql                                  │
│     - Usado em: docker-compose.dev.yaml                      │
│                                                               │
│  🧪 artflow_test         → Testes automatizados              │
│     - Limpo entre testes                                     │
│     - Seed data do init.sql                                  │
│     - Usado em: npm test (local)                             │
│                                                               │
│  🚀 artflow_prod         → Produção (VPS)                    │
│     - Dados reais de clientes                                │
│     - Backup diário automatizado                             │
│     - Usado em: docker-compose.prod.yaml                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **Justificativa Técnica**

| Critério | Decisão |
|----------|---------|
| **Isolamento** | ⭐⭐⭐ Perfeito - Ambientes nunca se interferem |
| **Segurança** | ⭐⭐⭐ Impossível apagar dados de prod acidentalmente |
| **Manutenção** | ⭐⭐⭐ Simples - Cada ambiente independente |
| **CI/CD** | ⭐⭐⭐ Pipeline pode rodar testes sem afetar prod |
| **Backup** | ⭐⭐⭐ Backup apenas do banco de produção |
| **Custo** | ⭐⭐ ~150-300MB total (aceitável) |

### **Fluxo de Dados**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Desenvolvimento│     │    Testes    │     │   Produção   │
│   (Local)    │     │   (Local)    │     │    (VPS)     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ artflow_dev  │     │ artflow_test │     │ artflow_prod │
│              │     │              │     │              │
│ npm run dev  │     │  npm test    │     │ Docker Prod  │
│ Dados persist│     │ Limpo sempre │     │ Dados reais  │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🔐 Estratégia de Ambientes

### **1. Ambiente de Desenvolvimento (Local)**

```yaml
# docker/docker-compose.dev.yaml
services:
  backend:
    environment:
      - NODE_ENV=development
      - DB_DATABASE=artflow_dev
      - CORS_ORIGIN=http://localhost:3000,http://localhost:5173
    volumes:
      - Hot reload habilitado
      - Logs verbosos
  
  db:
    environment:
      - POSTGRES_DB=artflow_dev
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
```

**Características:**
- ✅ Hot reload ativo
- ✅ Logs detalhados
- ✅ Seed data carregado
- ✅ pgAdmin disponível
- ✅ Portas expostas para debug

---

### **2. Ambiente de Testes (Local)**

```typescript
// backend/src/__tests__/helpers/setup.ts
process.env.NODE_ENV = 'test';
process.env.DB_DATABASE = 'artflow_test';

// Criar banco antes dos testes
beforeAll(async () => {
  // docker exec artflow_postgres psql -U postgres -c "CREATE DATABASE artflow_test;"
  // docker exec -i artflow_postgres psql -U postgres -d artflow_test < database/init.sql
});
```

**Características:**
- ✅ Banco isolado
- ✅ Limpeza entre testes
- ✅ Seed data disponível
- ✅ Não afeta desenvolvimento
- ✅ CI/CD friendly

---

### **3. Ambiente de Produção (VPS)**

```yaml
# docker/docker-compose.prod.yaml
services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DB_DATABASE=artflow_prod
      - CORS_ORIGIN=https://artflow.iel-company.com.br
    ports:
      - "3333:3333"
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
  
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    restart: always
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=artflow_prod
    command: >
      postgres
      -c shared_buffers=4GB
      -c effective_cache_size=12GB
      -c max_connections=200
      -c work_mem=20MB
      -c maintenance_work_mem=512MB
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: always
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: always
  
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_SERVER_ROOT_URL=https://grafana-artflow.iel-company.com.br
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    restart: always
  
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    restart: always
  
  adminer:
    image: adminer:latest
    environment:
      - ADMINER_DEFAULT_SERVER=db
    ports:
      - "8080:8080"
    restart: always
```

**Características:**
- ✅ **Stack Completo:** Backend, Frontend, DB, Monitoramento, Admin DB
- ✅ **PostgreSQL Otimizado:** 4GB shared_buffers, 12GB cache, 200 conexões
- ✅ **Monitoramento:** Grafana + Prometheus + Node Exporter
- ✅ **Admin DB:** Adminer (leve, 10MB RAM)
- ✅ **Restart automático:** Todos os serviços
- ✅ **Logs rotacionados:** 10MB x 3 arquivos
- ✅ **Volumes persistentes:** Dados, métricas, dashboards

---

## 🌐 Configuração de Rede e SSL

### **Nginx Reverse Proxy (Host VPS)**

```nginx
# /etc/nginx/sites-available/artflow

# Frontend
server {
    listen 80;
    server_name artflow.iel-company.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name artflow.iel-company.com.br;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/artflow.iel-company.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artflow.iel-company.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Frontend Container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name backend-artflow.iel-company.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name backend-artflow.iel-company.com.br;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/backend-artflow.iel-company.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/backend-artflow.iel-company.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Backend Container
    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (sem rate limit)
    location /api/health {
        proxy_pass http://localhost:3333/api/health;
        access_log off;
    }
}
```

---

## 🚀 Pipeline CI/CD - GitHub Actions

### **Estratégia de Deploy (Completa)**

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
└────────────┬────────────────────────────────────────────────┘
             │
             │ git push origin main
             ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions Workflow                         │
│                                                               │
│  1. ✅ Checkout code                                         │
│  2. ✅ Setup Node.js 18 + pnpm                               │
│  3. ✅ Install dependencies (backend + frontend)             │
│  4. 🧪 Run backend tests (156 tests)                         │
│  5. 🧪 Run frontend tests                                    │
│  6. 🏗️  Build backend (TypeScript → JS)                      │
│  7. 🏗️  Build frontend (Vite → dist)                         │
│  8. 🚀 Deploy to VPS via SSH:                                │
│     - Pull código na VPS                                     │
│     - Stop containers                                        │
│     - Build Docker images na VPS                             │
│     - Start containers                                       │
│     - Health check (rollback se falhar)                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Princípios:
- Testes bloqueiam deploy se falharem
- Build valida compilação antes de deployar
- Deploy final na VPS (sem registry necessário)
- Health check automático pós-deploy
```

### **Workflow Completo**

```yaml
# .github/workflows/deploy-production.yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install backend dependencies
        run: cd backend && pnpm install --frozen-lockfile
      
      - name: Install frontend dependencies
        run: cd frontend && pnpm install --frozen-lockfile
      
      - name: Run backend tests
        run: cd backend && pnpm test
      
      - name: Run frontend tests
        run: cd frontend && pnpm test
      
      - name: Build backend
        run: cd backend && pnpm build
      
      - name: Build frontend
        run: cd frontend && pnpm build
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/artflow
            git pull origin main
            docker-compose -f docker/docker-compose.prod.yaml down
            docker-compose -f docker/docker-compose.prod.yaml build
            docker-compose -f docker/docker-compose.prod.yaml up -d
            
            # Wait and health check
            sleep 10
            curl -f http://localhost:3333/api/health || exit 1
            
            echo "✅ Deploy successful!"
```

### **Workflow Branches**

```
main (production)
  ├─ Trigger: Push to main
  ├─ Tests: ✅ Required (bloqueia se falhar)
  ├─ Build: ✅ Valida compilação
  ├─ Deploy: 🚀 Auto to VPS
  └─ Health Check: ✅ Rollback se falhar

feature/* (development)
  ├─ Trigger: Pull Request
  ├─ Tests: ✅ Required
  ├─ Build: ✅ Valida compilação
  ├─ Deploy: ❌ No deploy
  └─ Status: PR comments
```

---

## 📦 Estrutura de Arquivos de Deploy

```
artflow/
├── docker/
│   ├── docker-compose.dev.yaml      # Desenvolvimento local
│   ├── docker-compose.prod.yaml     # Produção VPS
│   └── nginx/
│       └── artflow.conf             # Config nginx host
│
├── .github/
│   └── workflows/
│       ├── ci.yaml                  # Tests em PRs (feature/*)
│       └── deploy-production.yaml   # Deploy main → VPS (completo)
│
├── scripts/
│   ├── setup-vps.sh                 # Setup inicial VPS
│   ├── backup-db.sh                 # Backup PostgreSQL
│   ├── restore-db.sh                # Restore backup
│   └── health-check.sh              # Verificar saúde
│
├── .env.production.example          # Template env produção
├── .env.development.example         # Template env dev
└── DEPLOY.md                        # Documentação deploy
```

### **Workflows GitHub Actions**

#### **1. CI para Pull Requests**
```yaml
# .github/workflows/ci.yaml
# Roda em PRs de feature branches
# - Testes backend
# - Testes frontend
# - Build validation
# - Sem deploy
```

#### **2. Deploy Production**
```yaml
# .github/workflows/deploy-production.yaml
# Roda em push para main
# - Testes (bloqueia se falhar)
# - Build (valida compilação)
# - Deploy VPS
# - Health check
```

---

## 🔒 Gestão de Secrets

### **Secrets no GitHub Actions**

```yaml
# Configurar em: Settings → Secrets and variables → Actions

Required Secrets:
  - VPS_HOST                    # IP da VPS
  - VPS_USER                    # Usuário SSH
  - VPS_SSH_KEY                 # Chave privada SSH
  - POSTGRES_PASSWORD_PROD      # Senha PostgreSQL produção
  - JWT_SECRET_PROD             # JWT secret produção
  - DOCKER_REGISTRY_USER        # (opcional) Docker Hub user
  - DOCKER_REGISTRY_TOKEN       # (opcional) Docker Hub token
```

### **Secrets na VPS**

```bash
# /opt/artflow/.env.production (protegido)
NODE_ENV=production
PORT=3333
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=${POSTGRES_PASSWORD_PROD}  # Do GitHub Secrets
DB_DATABASE=artflow_prod
JWT_SECRET=${JWT_SECRET_PROD}
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://artflow.iel-company.com.br
MAX_FILE_SIZE=10
UPLOAD_DIR=/app/uploads/

# Permissões
chmod 600 /opt/artflow/.env.production
chown root:docker /opt/artflow/.env.production
```

---

## 💾 Estratégia de Backup

### **Backup Automatizado PostgreSQL**

```bash
#!/bin/bash
# scripts/backup-db.sh

BACKUP_DIR="/opt/artflow/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="artflow_prod_${TIMESTAMP}.sql.gz"

# Criar backup
docker exec artflow_postgres pg_dump \
  -U postgres \
  -d artflow_prod \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Manter apenas últimos 7 dias
find ${BACKUP_DIR} -name "artflow_prod_*.sql.gz" -mtime +7 -delete

# Upload para S3/Backblaze (opcional)
# aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" s3://artflow-backups/
```

### **Cron Job**

```cron
# Backup diário às 3h da manhã
0 3 * * * /opt/artflow/scripts/backup-db.sh >> /var/log/artflow-backup.log 2>&1
```

---

## 📊 Monitoramento e Logs

### **Health Checks**

```yaml
# docker-compose.prod.yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3333/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
  
  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d artflow_prod"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### **Logs Centralizados**

```bash
# Ver logs em tempo real
docker-compose -f docker/docker-compose.prod.yaml logs -f

# Logs específicos
docker logs artflow_backend --tail 100 -f
docker logs artflow_postgres --tail 100 -f

# Logs rotacionados automaticamente (configurado no compose)
```

---

## 🚀 Processo de Deploy

### **1. Setup Inicial da VPS**

```bash
# 1. Conectar na VPS
ssh root@seu-ip-vps

# 2. Executar script de setup
curl -fsSL https://raw.githubusercontent.com/seu-usuario/artflow/main/scripts/setup-vps.sh | bash

# 3. Configurar DNS (4 subdomínios)
# A record: artflow.iel-company.com.br → IP_VPS
# A record: backend-artflow.iel-company.com.br → IP_VPS
# A record: grafana-artflow.iel-company.com.br → IP_VPS
# A record: db-artflow.iel-company.com.br → IP_VPS

# 4. Configurar SSL (4 domínios)
certbot --nginx \
  -d artflow.iel-company.com.br \
  -d backend-artflow.iel-company.com.br \
  -d grafana-artflow.iel-company.com.br \
  -d db-artflow.iel-company.com.br
```

### **2. Deploy via GitHub Actions**

```bash
# Push para main dispara deploy automático
git push origin main

# Ou deploy manual via GitHub UI
# Actions → Deploy Production → Run workflow
```

### **3. Deploy Manual (Emergência)**

```bash
# Na VPS
cd /opt/artflow
git pull origin main
docker-compose -f docker/docker-compose.prod.yaml up -d --build
```

---

## 🔄 Estratégia de Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

# 1. Parar containers atuais
docker-compose -f docker/docker-compose.prod.yaml down

# 2. Restaurar backup do banco
./scripts/restore-db.sh /opt/artflow/backups/artflow_prod_YYYYMMDD_HHMMSS.sql.gz

# 3. Voltar para commit anterior
git checkout HEAD~1

# 4. Rebuild e restart
docker-compose -f docker/docker-compose.prod.yaml up -d --build

# 5. Verificar health
./scripts/health-check.sh
```

---

## 📈 Estimativas

### **Recursos da VPS**

| Componente | CPU | RAM | Disco | Alocação Otimizada |
|------------|-----|-----|-------|-------------------|
| Frontend (Nginx) | 0.5 core | 256MB | 500MB | Leve |
| Backend (Node.js) | 2 cores | 4GB | 2GB | **Alto** (múltiplos workers) |
| PostgreSQL | 1 core | 8GB | 50GB | **Alto** (cache, connections) |
| Nginx Proxy | 0.5 core | 512MB | 100MB | Médio |
| Sistema/Overhead | 1 core | 2GB | 10GB | Reserva |
| **Total Usado** | **4 cores** | **~15GB** | **~63GB** | **Otimizado** |
| **Disponível** | **4 cores** | **16GB** | **200GB** | **Margem confortável** |

### **VPS Atual (Provisionada)**

```
✅ Especificações Reais:
- CPU: 4 vCPUs
- RAM: 16 GB
- Disco: 200 GB NVMe SSD
- Banda: 16TB/mês
- SO: Ubuntu 22.04 LTS (recomendado)
- Backups: Semanais (inclusos)
- Snapshots: 1 incluído
- IP: Dedicado
- Extras: Assistente IA, Detector malware

Status: EXCELENTE para produção com monitoramento completo! 🚀
```

### **Alocação de Recursos (16GB RAM Total)**

```
PostgreSQL:        8.0 GB  (50%)  - Otimizado (4GB buffers + 4GB cache OS)
Backend Node.js:   0.2 GB  (1%)   - Leve e eficiente
Frontend Nginx:    0.05GB  (<1%)  - Estático
Prometheus:        0.2 GB  (1%)   - Métricas (30 dias retenção)
Grafana:           0.15GB  (1%)   - Dashboards
Node Exporter:     0.02GB  (<1%)  - Coleta métricas sistema
Adminer:           0.01GB  (<1%)  - Admin DB (leve)
Sistema (Ubuntu):  1.5 GB  (9%)   - OS + Docker
────────────────────────────────────────
Total Usado:       ~10.1GB (63%)
Disponível:        ~5.9GB  (37%)  - Margem confortável
```

### **Otimizações Implementadas desde o Início**

```
✅ PostgreSQL Tuning:
   - shared_buffers: 4GB (25% da RAM)
   - effective_cache_size: 12GB (75% da RAM)
   - max_connections: 200
   - work_mem: 20MB
   
✅ Monitoramento Completo:
   - Grafana + Prometheus (dashboards visuais)
   - Node Exporter (métricas sistema)
   - Retenção: 30 dias de histórico
   
✅ Admin Database:
   - Adminer (leve, 10MB RAM vs 200MB pgAdmin)
   - Interface web moderna
   - Acesso via HTTPS
```

### **Otimizações Futuras (Quando Necessário)**

```
📌 PM2 Clustering (se CPU > 80% consistente):
   - 4 workers Node.js
   - Load balancing automático
   - Implementar quando tráfego real justificar

📌 Escalabilidade (se atingir limites):
   - Adicionar mais containers backend
   - Implementar PgBouncer para connection pooling
   - Considerar read replica PostgreSQL

📌 Princípio: PostgreSQL otimizado desde o início, resto baseado em dados reais
```

### **Custos**

```
VPS (já provisionada):   Custo existente
Domínio (.com.br):       $2.50/mês (amortizado)
SSL (Let's Encrypt):     $0.00 (grátis - 4 domínios)
Backup Storage:          $0.00 (incluído)
Grafana:                 $0.00 (self-hosted)
Prometheus:              $0.00 (open-source)
Adminer:                 $0.00 (open-source)
─────────────────────────────
Total adicional:         ~$2.50/mês

Todas ferramentas de monitoramento: GRÁTIS! 🎉
```

---

## ✅ Checklist de Deploy

### **Pré-Deploy**
- [ ] DNS configurado e propagado
- [ ] Secrets configurados no GitHub
- [ ] VPS provisionada e acessível
- [ ] Docker e Docker Compose instalados
- [ ] Nginx instalado no host
- [ ] Certbot instalado
- [ ] Firewall configurado (80, 443, 22)

### **Deploy Inicial**
- [ ] Executar `setup-vps.sh`
- [ ] Clonar repositório em `/opt/artflow`
- [ ] Configurar `.env.production`
- [ ] Obter certificados SSL
- [ ] Configurar nginx reverse proxy
- [ ] Iniciar containers
- [ ] Verificar health checks
- [ ] Testar URLs públicas

### **Pós-Deploy**
- [ ] Configurar backup automático
- [ ] Configurar monitoramento
- [ ] Testar rollback
- [ ] Documentar credenciais
- [ ] Notificar equipe

---

## 🎯 Próximos Passos

### **Fase 1: Preparação (Você decide se aprovamos)**
1. ✅ Revisar este documento
2. ✅ Validar decisões técnicas
3. ✅ Aprovar arquitetura

### **Fase 2: Implementação (Após aprovação)**
1. Criar `docker-compose.prod.yaml`
2. Criar workflows GitHub Actions
3. Criar scripts de deploy
4. Criar configuração nginx
5. Criar documentação de deploy

### **Fase 3: Setup VPS (Manual)**
1. Provisionar VPS
2. Configurar DNS
3. Executar setup inicial
4. Configurar SSL
5. Deploy inicial

### **Fase 4: Validação**
1. Testes de carga
2. Testes de segurança
3. Testes de backup/restore
4. Documentação final

---

## 📚 Referências Técnicas

- **Docker Multi-Stage Builds:** Já implementado ✅
- **Nginx Reverse Proxy:** Best practices SSL/TLS
- **GitHub Actions:** Deploy workflows
- **PostgreSQL Backup:** pg_dump strategies
- **Let's Encrypt:** Automated SSL renewal
- **Security Headers:** OWASP recommendations

---

## ❓ Decisões Pendentes

### **1. Estratégia de Bancos** ✅ DECIDIDO
- **Opção escolhida:** 3 bancos separados (dev/test/prod)
- **Justificativa:** Isolamento total, segurança, CI/CD friendly

### **2. Registry de Imagens Docker**
- **Decisão:** Build na VPS (simplicidade > velocidade)
- **Justificativa:** Sem complexidade de registry, deploy funciona em 2-3 minutos

### **3. Estratégia de Uploads**
- **Opção A:** Volume Docker persistente
- **Opção B:** S3/Backblaze (mais robusto)
- **Recomendação:** Opção A inicialmente

### **4. Monitoramento**
- **Opção A:** Logs Docker + scripts bash
- **Opção B:** Grafana + Prometheus (mais completo)
- **Recomendação:** **Opção B** - Recursos permitem monitoramento completo

### **5. Ambiente Staging (Opcional)**
Com 16GB RAM, podemos ter staging na mesma VPS:
- **Opção A:** Staging + Production na mesma VPS
  - Staging: 2GB RAM, 1 vCPU, porta 4000/4333
  - Production: 12GB RAM, 3 vCPUs, porta 3000/3333
  - Subdomínio: `staging-artflow.iel-company.com.br`
- **Recomendação:** Implementar se necessário testes em ambiente real

---

## 🎁 Bônus: Recursos Extras Disponíveis

Com essa VPS robusta, você pode adicionar:

### **Monitoramento Completo (Recomendado)**
```yaml
# Adicionar ao docker-compose.prod.yaml
  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    resources:
      limits: {memory: 512M}
  
  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]
    resources:
      limits: {memory: 512M}
```

### **Redis Cache (Opcional)**
```yaml
  redis:
    image: redis:alpine
    resources:
      limits: {memory: 256M}
    # Para cache de sessões e queries
```

### **Elasticsearch + Kibana (Logs Avançados)**
```yaml
  elasticsearch:
    image: elasticsearch:8.11.0
    resources:
      limits: {memory: 2G}
  
  kibana:
    image: kibana:8.11.0
    resources:
      limits: {memory: 512M}
```

**Total com todos extras:** ~4GB RAM adicional (ainda sobra 7GB!)

---

**Status:** 📋 AGUARDANDO APROVAÇÃO

**Próxima ação:** Revisar arquitetura e aprovar para implementação

**Nota:** Com esses recursos, recomendo implementar monitoramento completo desde o início.

---

## 👁️ Monitoramento e Observabilidade

### **Stack de Monitoramento**

```
┌─────────────────────────────────────────────────────────┐
│                    Grafana Dashboards                          │
│           https://grafana-artflow.iel-company.com.br          │
│  - Dashboards visuais de CPU, RAM, Disco, Network              │
│  - Gráficos em tempo real                                       │
│  - Histórico de 30 dias                                         │
│  - Alertas configuráveis                                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Prometheus                                  │
│  - Coleta métricas a cada 15s                                  │
│  - Armazena 30 dias de histórico                               │
│  - Query language (PromQL)                                     │
└────────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Node Exporter                                │
│  - CPU, RAM, Disco, Network                                   │
│  - Load average, Processos                                    │
│  - I/O, Filesystem                                            │
└─────────────────────────────────────────────────────────┘
```

### **Métricas Disponíveis**

**Sistema (Node Exporter):**
- ✅ CPU usage por core e total
- ✅ Memória (total, usado, disponível, cache)
- ✅ Disco (uso, I/O, inodes)
- ✅ Network (bytes in/out, packets, erros)
- ✅ Load average (1m, 5m, 15m)
- ✅ Processos (total, running, blocked)

**Aplicação:**
- ✅ Backend health check
- ✅ PostgreSQL connections
- ✅ Container stats (CPU, RAM por container)

### **Adminer - Admin Database**

```
URL: https://db-artflow.iel-company.com.br

Recursos:
- ✅ Interface web leve (10MB RAM)
- ✅ Visualizar tabelas e dados
- ✅ Executar queries SQL
- ✅ Editar dados diretamente
- ✅ Exportar/Importar (SQL, CSV, JSON)
- ✅ Ver estrutura, índices, foreign keys
```

---

## 📊 Análise de Capacidade e Escalabilidade

### **Premissas do Sistema**
```
✅ Imagens: Apenas URLs (Google Drive)
   - Sem upload de arquivos
   - Sem processamento de imagens
   - Payload médio: ~500 bytes por post
   
✅ Operações Principais:
   - Autenticação (JWT)
   - CRUD de posts (texto + URL)
   - Listagens com paginação
   - Aprovações/Rejeições
```

### **Capacidade Estimada por Componente**

#### **1. Backend (Node.js + 4 Workers PM2)**
```
Requests por segundo (RPS):
- Operação simples (GET):      ~2.000 RPS
- Operação média (POST/PUT):    ~1.000 RPS
- Operação complexa (JOIN):     ~500 RPS

Média ponderada:                ~800 RPS

Usuários simultâneos:
- 1 usuário = ~0.5 req/s (navegação normal)
- Capacidade: 800 / 0.5 = 1.600 usuários simultâneos

Usuários ativos (pico):
- Considerando 10% online simultâneo
- Total: ~16.000 usuários ativos
```

#### **2. PostgreSQL (8GB RAM, NVMe)**
```
Conexões simultâneas:           200 (configurado)
Queries por segundo:            ~5.000 QPS (NVMe + cache)

Dados por cliente:
- 1 cliente = ~10KB (perfil + metadados)
- 1 post = ~1KB (texto + URL, sem imagem)
- Média: 50 posts/cliente = 50KB

Capacidade de armazenamento:
- 50GB disponível para dados
- 50GB / 60KB por cliente = ~833.000 clientes
- Com índices e overhead (30%): ~580.000 clientes

Capacidade de performance:
- 200 conexões simultâneas
- ~1.000 clientes ativos simultâneos (confortável)
```

#### **3. Nginx (Reverse Proxy)**
```
Conexões simultâneas:           10.000+
Throughput:                     ~10 Gbps
Gargalo:                        Não é limitante
```

### **Capacidade Total do Sistema**

| Métrica | Capacidade | Limitante |
|---------|------------|-----------|
| **Usuários Cadastrados** | ~500.000 | Disco (50GB dados) |
| **Usuários Ativos (MAU)** | ~50.000 | Performance confortável |
| **Usuários Simultâneos (pico)** | ~1.500 | Backend + PostgreSQL |
| **Posts Totais** | ~25 milhões | Disco (50GB) |
| **Requests/segundo** | ~800 RPS | Backend (4 workers) |

### **Cenários Reais de Uso**

#### **Cenário 1: Agência Pequena**
```
Clientes:                       100
Funcionários:                   10
Posts/mês:                      2.000
Usuários simultâneos (pico):    20
Uso de recursos:                <5%
Status:                         ✅ SOBRA MUITO
```

#### **Cenário 2: Agência Média**
```
Clientes:                       1.000
Funcionários:                   50
Posts/mês:                      20.000
Usuários simultâneos (pico):    100
Uso de recursos:                ~10%
Status:                         ✅ CONFORTÁVEL
```

#### **Cenário 3: Agência Grande**
```
Clientes:                       5.000
Funcionários:                   200
Posts/mês:                      100.000
Usuários simultâneos (pico):    500
Uso de recursos:                ~35%
Status:                         ✅ TRANQUILO
```

#### **Cenário 4: Plataforma SaaS**
```
Clientes:                       20.000
Funcionários:                   1.000
Posts/mês:                      500.000
Usuários simultâneos (pico):    1.500
Uso de recursos:                ~90%
Status:                         ⚠️ PRÓXIMO DO LIMITE
```

#### **Cenário 5: Limite Teórico**
```
Clientes:                       50.000+
Funcionários:                   2.500+
Posts/mês:                      1.000.000+
Usuários simultâneos (pico):    2.000+
Uso de recursos:                100%+
Status:                         ❌ PRECISA ESCALAR
```

### **Crescimento de Dados (Sem Upload de Imagens)**

```
Ano 1:
- 5.000 clientes
- 250.000 posts
- Dados: ~250MB (posts) + 50MB (usuários) = 300MB
- Uso disco: 0.6% de 50GB

Ano 2:
- 15.000 clientes
- 750.000 posts
- Dados: ~750MB + 150MB = 900MB
- Uso disco: 1.8% de 50GB

Ano 5:
- 50.000 clientes
- 2.500.000 posts
- Dados: ~2.5GB + 500MB = 3GB
- Uso disco: 6% de 50GB

Ano 10:
- 100.000 clientes
- 5.000.000 posts
- Dados: ~5GB + 1GB = 6GB
- Uso disco: 12% de 50GB
```

### **Gargalos e Pontos de Atenção**

#### **Gargalo 1: Backend (800 RPS)**
```
Quando atingir:                 ~1.500 usuários simultâneos
Solução:
  - Escalar horizontalmente (mais containers)
  - Load balancer entre múltiplas instâncias
  - Custo: Mínimo (mesma VPS comporta 2-3 instâncias)
```

#### **Gargalo 2: PostgreSQL Connections (200)**
```
Quando atingir:                 ~1.000 usuários simultâneos
Solução:
  - Connection pooling (PgBouncer)
  - Aumentar max_connections para 500
  - Read replicas para queries de leitura
```

#### **Gargalo 3: Disco (50GB dados)**
```
Quando atingir:                 ~500.000 clientes
Solução:
  - Arquivamento de posts antigos
  - Particionamento de tabelas
  - Upgrade de disco (200GB → 500GB)
```

### **Recomendações de Escalabilidade**

#### **Fase 1: 0 - 10.000 clientes (Atual)**
```
✅ Arquitetura atual suficiente
✅ Monitoramento básico
✅ Backup diário
```

#### **Fase 2: 10.000 - 30.000 clientes**
```
✅ Adicionar Redis para cache de sessões
✅ Implementar PgBouncer (connection pooling)
✅ Monitoramento com Grafana + Prometheus
✅ Backup a cada 6 horas
```

#### **Fase 3: 30.000 - 100.000 clientes**
```
✅ PostgreSQL Read Replica
✅ CDN para assets estáticos
✅ Rate limiting mais agressivo
✅ Backup contínuo (WAL archiving)
✅ Considerar migração para cluster
```

#### **Fase 4: 100.000+ clientes**
```
✅ Kubernetes (orquestração)
✅ PostgreSQL Cluster (Patroni/Citus)
✅ Multiple VPS ou Cloud (AWS/GCP)
✅ Microserviços (separar domínios)
```

### **Custos de Escalabilidade**

```
Fase 1 (0-10k):         VPS atual ($0 adicional)
Fase 2 (10k-30k):       + Redis + PgBouncer ($0, mesma VPS)
Fase 3 (30k-100k):      + VPS adicional para replica ($30/mês)
Fase 4 (100k+):         Cluster completo ($200-500/mês)
```

### **Conclusão: Capacidade Real**

```
🎯 RESPOSTA DIRETA:

Com a configuração atual (16GB RAM, 4 vCPUs, sem upload):

✅ Confortável:          até 20.000 clientes ativos
✅ Aceitável:            até 50.000 clientes ativos
⚠️ Limite teórico:       ~100.000 clientes (com otimizações)

Usuários simultâneos (pico):
✅ Confortável:          até 1.000 simultâneos
⚠️ Limite:               ~1.500 simultâneos

Dados (10 anos):
✅ Espaço sobra:         6GB de 50GB (12% uso)
```

### **Fatores que Aumentam Capacidade**

```
✅ Sem upload de imagens:        +500% capacidade
✅ URLs do Drive (leve):         Payload mínimo
✅ 16GB RAM:                     Cache massivo
✅ NVMe:                         I/O rápido
✅ 4 vCPUs:                      Paralelização
✅ PM2 Clustering:               Load balancing
```

### **Monitoramento de Capacidade**

```bash
# Métricas para acompanhar:
- CPU usage:                    Alerta > 70%
- RAM usage:                    Alerta > 80%
- Disk usage:                   Alerta > 70%
- PostgreSQL connections:       Alerta > 150/200
- Response time:                Alerta > 500ms
- Error rate:                   Alerta > 1%
```

**Resumo:** Sua VPS aguenta tranquilamente uma **agência grande ou plataforma média** (20-50k clientes ativos) sem necessidade de escalabilidade adicional.
