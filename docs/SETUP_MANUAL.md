# 📋 Setup Manual - ArtFlow Produção

**Objetivo:** Guia passo a passo de tudo que precisa ser feito manualmente para colocar o ArtFlow em produção.

**Tempo estimado:** 2-3 horas (primeira vez)

---

## ✅ Checklist Geral

- [ ] 1. Provisionar VPS
- [ ] 2. Configurar DNS (4 subdomínios)
- [ ] 3. Setup inicial da VPS
- [ ] 4. Configurar SSL (Let's Encrypt)
- [ ] 5. Configurar secrets no GitHub
- [ ] 6. Primeiro deploy
- [ ] 7. Configurar Grafana (monitoramento)
- [ ] 8. Configurar backup automático
- [ ] 9. Validar funcionamento completo

---

## 🖥️ 1. Provisionar VPS

### **Especificações Mínimas**
```
CPU: 2 vCPUs (você tem 4 ✅)
RAM: 2GB (você tem 16GB ✅)
Disco: 40GB SSD (você tem 200GB NVMe ✅)
SO: Ubuntu 22.04 LTS
```

### **Ações**
1. ✅ VPS já provisionada
2. Anote o **IP público** da VPS
3. Anote o **usuário** (geralmente `root`)
4. Configure **chave SSH** para acesso

### **Testar Acesso**
```bash
ssh root@SEU_IP_VPS
```

---

## 🌐 2. Configurar DNS

### **Registros A Necessários**

Acesse o painel do seu provedor de domínio e crie:

```
Tipo: A
Nome: artflow
Valor: SEU_IP_VPS
TTL: 3600

Tipo: A
Nome: backend-artflow
Valor: SEU_IP_VPS
TTL: 3600

Tipo: A
Nome: grafana-artflow
Valor: SEU_IP_VPS
TTL: 3600

Tipo: A
Nome: db-artflow
Valor: SEU_IP_VPS
TTL: 3600
```

### **Resultado Esperado**
- `artflow.iel-company.com.br` → IP da VPS (Frontend)
- `backend-artflow.iel-company.com.br` → IP da VPS (API)
- `grafana-artflow.iel-company.com.br` → IP da VPS (Monitoramento)
- `db-artflow.iel-company.com.br` → IP da VPS (Admin Database)

### **Validar DNS (aguardar propagação 5-30 min)**
```bash
# Testar resolução DNS
nslookup artflow.iel-company.com.br
nslookup backend-artflow.iel-company.com.br
nslookup grafana-artflow.iel-company.com.br
nslookup db-artflow.iel-company.com.br

# Todos devem retornar o IP da sua VPS
```

---

## 🔧 3. Setup Inicial da VPS

### **Conectar na VPS**
```bash
ssh root@SEU_IP_VPS
```

### **Atualizar Sistema**
```bash
apt update && apt upgrade -y
```

### **Instalar Docker**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalação
docker --version
# Deve mostrar: Docker version 24.x.x ou superior
```

### **Instalar Docker Compose**
```bash
# Docker Compose v2 (plugin)
apt install docker-compose-plugin -y

# Verificar instalação
docker compose version
# Deve mostrar: Docker Compose version v2.x.x ou superior
```

### **Instalar Nginx**
```bash
apt install nginx -y

# Iniciar e habilitar
systemctl start nginx
systemctl enable nginx

# Verificar status
systemctl status nginx
# Deve mostrar: active (running)
```

### **Instalar Certbot (Let's Encrypt)**
```bash
apt install certbot python3-certbot-nginx -y

# Verificar instalação
certbot --version
# Deve mostrar: certbot 1.x.x ou superior
```

### **Instalar Git**
```bash
apt install git -y

# Verificar instalação
git --version
```

### **Configurar Firewall**
```bash
# Permitir SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar firewall
ufw enable

# Verificar status
ufw status
```

### **Criar Diretório do Projeto**
```bash
mkdir -p /opt/artflow
cd /opt/artflow
```

### **Configurar Git (Deploy Key)**

#### **Na VPS:**
```bash
# Gerar chave SSH para deploy
ssh-keygen -t ed25519 -C "deploy@artflow" -f ~/.ssh/artflow_deploy
# Pressione Enter 3x (sem senha)

# Copiar chave pública
cat ~/.ssh/artflow_deploy.pub
# Copie o conteúdo
```

#### **No GitHub:**
1. Vá em: `Settings` → `Deploy keys` → `Add deploy key`
2. Title: `VPS Production`
3. Key: Cole a chave pública
4. ✅ Marque `Allow write access` (se necessário)
5. Clique em `Add key`

#### **Testar Conexão:**
```bash
# Na VPS
ssh -T git@github.com -i ~/.ssh/artflow_deploy
# Deve mostrar: Hi seu-usuario/artflow! You've successfully authenticated
```

### **Clonar Repositório**
```bash
cd /opt/artflow
GIT_SSH_COMMAND='ssh -i ~/.ssh/artflow_deploy' git clone git@github.com:SEU_USUARIO/artflow.git .

# Verificar
ls -la
# Deve mostrar: backend/ frontend/ docker/ etc
```

---

## 🔐 4. Configurar SSL (Let's Encrypt)

### **Pré-requisitos**
- ✅ DNS propagado (artflow.iel-company.com.br → IP VPS)
- ✅ Nginx instalado
- ✅ Portas 80 e 443 abertas

### **Obter Certificados**
```bash
certbot --nginx \
  -d artflow.iel-company.com.br \
  -d backend-artflow.iel-company.com.br \
  -d grafana-artflow.iel-company.com.br \
  -d db-artflow.iel-company.com.br \
  --non-interactive \
  --agree-tos \
  -m seu-email@exemplo.com
```

### **Resultado Esperado**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/artflow.iel-company.com.br/fullchain.pem
Key is saved at: /etc/letsencrypt/live/artflow.iel-company.com.br/privkey.pem
```

### **Testar Renovação Automática**
```bash
certbot renew --dry-run
# Deve mostrar: Congratulations, all simulated renewals succeeded
```

### **Configurar Nginx Reverse Proxy**

Criar arquivo de configuração:
```bash
nano /etc/nginx/sites-available/artflow
```

Colar conteúdo (ver arquivo `docker/nginx/artflow.conf` no repositório):

**IMPORTANTE:** Use o arquivo completo `docker/nginx/artflow.conf` que contém configuração para todos os 4 domínios (Frontend, Backend, Grafana, Adminer).

Ou copie manualmente:

```nginx
# Rate Limiting (deve estar ANTES dos blocos server)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

# Frontend
server {
    listen 80;
    server_name artflow.iel-company.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name artflow.iel-company.com.br;

    ssl_certificate /etc/letsencrypt/live/artflow.iel-company.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artflow.iel-company.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
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

    ssl_certificate /etc/letsencrypt/live/backend-artflow.iel-company.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/backend-artflow.iel-company.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/health {
        proxy_pass http://localhost:3333/api/health;
        access_log off;
    }
}

# Grafana - grafana-artflow.iel-company.com.br
server {
    listen 80;
    server_name grafana-artflow.iel-company.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name grafana-artflow.iel-company.com.br;

    ssl_certificate /etc/letsencrypt/live/grafana-artflow.iel-company.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/grafana-artflow.iel-company.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Adminer (Database Manager) - db-artflow.iel-company.com.br
server {
    listen 80;
    server_name db-artflow.iel-company.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name db-artflow.iel-company.com.br;

    ssl_certificate /etc/letsencrypt/live/db-artflow.iel-company.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/db-artflow.iel-company.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Opcional: Adicionar Basic Auth para segurança extra
    # auth_basic "Restricted Access";
    # auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Habilitar site:
```bash
ln -s /etc/nginx/sites-available/artflow /etc/nginx/sites-enabled/

# Testar configuração
nginx -t
# Deve mostrar: syntax is ok

# Recarregar nginx
systemctl reload nginx
```

---

## 🔑 5. Configurar Secrets no GitHub

### **Acessar GitHub**
1. Vá no repositório: `https://github.com/SEU_USUARIO/artflow`
2. Clique em `Settings`
3. No menu lateral: `Secrets and variables` → `Actions`
4. Clique em `New repository secret`

### **Secrets Necessários**

#### **VPS_HOST**
```
Name: VPS_HOST
Value: SEU_IP_VPS
```

#### **VPS_USER**
```
Name: VPS_USER
Value: root
```

#### **VPS_SSH_KEY**
```bash
# Na VPS, gerar chave para GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
# Pressione Enter 3x (sem senha)

# Adicionar chave pública ao authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Copiar chave PRIVADA
cat ~/.ssh/github_actions
# Copie TODO o conteúdo (incluindo -----BEGIN e -----END)
```

```
Name: VPS_SSH_KEY
Value: [Cole a chave privada completa]
```

#### **POSTGRES_PASSWORD_PROD**
```bash
# Gerar senha forte
openssl rand -base64 32
# Copie o resultado
```

```
Name: POSTGRES_PASSWORD_PROD
Value: [Cole a senha gerada]
```

#### **JWT_SECRET_PROD**
```bash
# Gerar secret forte
openssl rand -base64 64
# Copie o resultado
```

```
Name: JWT_SECRET_PROD
Value: [Cole o secret gerado]
```

#### **GRAFANA_PASSWORD** (Opcional - para Grafana)
```bash
# Gerar senha forte para Grafana
openssl rand -base64 24
# Copie o resultado
```

```
Name: GRAFANA_PASSWORD
Value: [Cole a senha gerada]
```

**Nota:** Se não configurar, a senha padrão será `admin`.

### **Validar Secrets**
Após adicionar todos, você deve ter:
- ✅ VPS_HOST
- ✅ VPS_USER
- ✅ VPS_SSH_KEY
- ✅ POSTGRES_PASSWORD_PROD
- ✅ JWT_SECRET_PROD
- ✅ GRAFANA_PASSWORD (opcional)

---

## 🚀 6. Primeiro Deploy

### **Criar Arquivo .env.production na VPS**

```bash
cd /opt/artflow
nano .env.production
```

Colar conteúdo:
```bash
NODE_ENV=production
PORT=3333
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=COLE_AQUI_POSTGRES_PASSWORD_PROD
DB_DATABASE=artflow_prod
JWT_SECRET=COLE_AQUI_JWT_SECRET_PROD
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://artflow.iel-company.com.br
MAX_FILE_SIZE=10
UPLOAD_DIR=/app/uploads/
GRAFANA_PASSWORD=COLE_AQUI_GRAFANA_PASSWORD
```

**IMPORTANTE:** Substitua os valores de `DB_PASSWORD`, `JWT_SECRET` e `GRAFANA_PASSWORD` pelos mesmos que você configurou nos secrets do GitHub.

Proteger arquivo:
```bash
chmod 600 .env.production
```

### **Deploy Manual (Primeira Vez)**

```bash
cd /opt/artflow

# Build e iniciar containers
docker compose -f docker/docker-compose.prod.yaml up -d --build

# Aguardar containers iniciarem (30-60 segundos)
sleep 30

# Verificar status
docker compose -f docker/docker-compose.prod.yaml ps
# Todos devem estar "Up"

# Verificar logs
docker compose -f docker/docker-compose.prod.yaml logs -f
# Ctrl+C para sair
```

### **Testar Endpoints**

```bash
# Health check backend
curl http://localhost:3333/api/health
# Deve retornar: {"status":"ok"}

# Testar frontend (local)
curl http://localhost:3000
# Deve retornar HTML

# Testar URLs públicas
curl https://backend-artflow.iel-company.com.br/api/health
curl https://artflow.iel-company.com.br
```

### **Criar Banco de Dados Inicial**

```bash
# Entrar no container do PostgreSQL
docker exec -it artflow_postgres_prod psql -U postgres

# Verificar banco
\l
# Deve mostrar: artflow_prod

# Verificar tabelas
\c artflow_prod
\dt
# Deve mostrar: empresas, squads, users, clientes, posts

# Sair
\q
```

### **Criar Primeiro Admin Master**

**IMPORTANTE:** O banco de produção inicia vazio (sem usuários). Você precisa criar o primeiro admin manualmente.

```bash
# Executar script de seed do admin (UMA VEZ APENAS)
cd /opt/artflow
docker exec -i artflow_postgres_prod psql -U postgres -d artflow_prod < database/seed-admin.sql
```

**Resultado esperado:**
```
========================================
✅ Admin Master criado com sucesso!
========================================
Email: admin@artflow.com
Senha temporária: admin123

⚠️  ATENÇÃO: TROCAR SENHA IMEDIATAMENTE!
========================================
```

**Fazer primeiro login:**
1. Acessar: https://artflow.iel-company.com.br
2. Login: `admin@artflow.com`
3. Senha: `admin123`
4. **Ir em Perfil/Configurações e TROCAR SENHA imediatamente**

**Nota:** O script só cria o admin se não existir nenhum. Se executar novamente, apenas mostrará mensagem informando que já existe.

---

## � 7. Configurar Grafana (Monitoramento)

### **Acessar Grafana**

```bash
# Abrir no navegador
https://grafana-artflow.iel-company.com.br
```

### **Login Inicial**
```
Usuário: admin
Senha: [A que você definiu em GRAFANA_PASSWORD]
```

### **Configuração Automática**

O Grafana já vem pré-configurado com:
- ✅ Datasource Prometheus conectado
- ✅ Pronto para criar dashboards

### **Criar Dashboard Básico**

1. **Clique em "+" → "Create Dashboard"**

2. **Adicionar Painel de CPU:**
   - Add visualization
   - Selecione datasource: Prometheus
   - Métrica: `100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
   - Title: "CPU Usage %"
   - Panel type: Time series

3. **Adicionar Painel de RAM:**
   - Add visualization
   - Métrica: `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
   - Title: "Memory Usage %"
   - Panel type: Gauge

4. **Adicionar Painel de Disco:**
   - Add visualization
   - Métrica: `100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)`
   - Title: "Disk Usage %"
   - Panel type: Gauge

5. **Adicionar Painel de Network:**
   - Add visualization
   - Métrica: `rate(node_network_receive_bytes_total{device!="lo"}[5m])`
   - Title: "Network In (bytes/s)"
   - Panel type: Time series

6. **Salvar Dashboard:**
   - Clique em "Save dashboard"
   - Nome: "ArtFlow System Overview"

### **Dashboards Prontos (Opcional)**

Você pode importar dashboards prontos da comunidade:

1. **Node Exporter Full:**
   - ID: `1860`
   - Dashboards → Import → Digite `1860` → Load
   - Selecione datasource: Prometheus
   - Import

2. **Docker Container Metrics (se adicionar cAdvisor depois):**
   - ID: `193`

### **Configurar Alertas (Opcional)**

1. **Alerting → Alert rules → New alert rule**

2. **Exemplo: CPU Alto**
   ```
   Nome: High CPU Usage
   Condição: avg(rate(node_cpu_seconds_total{mode!="idle"}[5m])) > 0.8
   For: 5m
   Severity: warning
   ```

3. **Notification channels:**
   - Email, Slack, Discord, etc.

### **Métricas Disponíveis**

**Sistema (Node Exporter):**
- ✅ CPU, RAM, Disco, Network
- ✅ Load average
- ✅ Processos

**Prometheus:**
- ✅ Self-monitoring
- ✅ Targets health

**Para adicionar depois:**
- Backend API metrics (adicionar endpoint `/metrics`)
- PostgreSQL metrics (adicionar postgres-exporter)
- Docker container metrics (adicionar cAdvisor)

---

## �� 8. Configurar Backup Automático

### **Criar Script de Backup**

```bash
mkdir -p /opt/artflow/backups
nano /opt/artflow/scripts/backup-db.sh
```

Colar conteúdo:
```bash
#!/bin/bash
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

echo "✅ Backup criado: ${BACKUP_FILE}"
```

Dar permissão:
```bash
chmod +x /opt/artflow/scripts/backup-db.sh
```

Testar:
```bash
/opt/artflow/scripts/backup-db.sh
ls -lh /opt/artflow/backups/
```

### **Configurar Cron Job**

```bash
crontab -e
```

Adicionar linha:
```cron
# Backup diário às 3h da manhã
0 3 * * * /opt/artflow/scripts/backup-db.sh >> /var/log/artflow-backup.log 2>&1
```

Salvar e sair.

Verificar:
```bash
crontab -l
```

---

## ✅ 9. Validar Funcionamento Completo

### **Checklist Final**

```bash
# 1. Containers rodando
docker compose -f /opt/artflow/docker/docker-compose.prod.yaml ps
# ✅ Todos "Up"

# 2. Backend respondendo
curl https://backend-artflow.iel-company.com.br/api/health
# ✅ {"status":"ok"}

# 3. Frontend carregando
curl -I https://artflow.iel-company.com.br
# ✅ HTTP/2 200

# 4. SSL válido
curl -vI https://artflow.iel-company.com.br 2>&1 | grep "SSL certificate verify ok"
# ✅ SSL certificate verify ok

# 5. Backup funcionando
ls -lh /opt/artflow/backups/
# ✅ Arquivo .sql.gz presente

# 6. Cron configurado
crontab -l | grep backup
# ✅ Linha do cron presente

# 7. Grafana acessível
curl -I https://grafana-artflow.iel-company.com.br
# ✅ HTTP/2 200

# 8. Adminer acessível
curl -I https://db-artflow.iel-company.com.br
# ✅ HTTP/2 200
```

### **Testar URLs públicas**

```bash
# Frontend
curl -I https://artflow.iel-company.com.br
# ✅ HTTP/2 200

# Backend
curl https://backend-artflow.iel-company.com.br/api/health
# ✅ {"status":"ok"}

# Grafana
curl -I https://grafana-artflow.iel-company.com.br
# ✅ HTTP/2 200

# Adminer
curl -I https://db-artflow.iel-company.com.br
# ✅ HTTP/2 200
```

### **Testar Deploy Automático**

No seu computador local:
```bash
# Fazer uma mudança qualquer
echo "# Test deploy" >> README.md

# Commit e push
git add .
git commit -m "test: validar deploy automático"
git push origin main

# Acompanhar GitHub Actions
# https://github.com/SEU_USUARIO/artflow/actions
```

Aguardar workflow completar (~3-5 minutos).

Na VPS, verificar:
```bash
cd /opt/artflow
git log -1
# Deve mostrar seu último commit

docker compose -f docker/docker-compose.prod.yaml logs --tail 50
# Deve mostrar logs recentes
```

---

## 🎉 Pronto!

Seu ArtFlow está em produção com:

✅ Deploy automático (git push → produção)  
✅ SSL/HTTPS configurado (4 domínios)  
✅ Backup diário automático  
✅ Restart automático em falhas  
✅ PostgreSQL otimizado (4GB shared_buffers)  
✅ Nginx reverse proxy  
✅ Grafana + Prometheus (monitoramento completo)  
✅ Node Exporter (métricas do sistema)  
✅ Adminer (admin database web)  

### **URLs de Acesso:**
- 🌐 Frontend: https://artflow.iel-company.com.br
- 🔌 Backend: https://backend-artflow.iel-company.com.br
- 📊 Grafana: https://grafana-artflow.iel-company.com.br
- 🗄️ Adminer: https://db-artflow.iel-company.com.br

---

## 📞 Troubleshooting

### **Containers não sobem**
```bash
docker compose -f docker/docker-compose.prod.yaml logs
# Ver erros específicos
```

### **Erro de conexão com banco**
```bash
# Verificar senha no .env.production
cat /opt/artflow/.env.production | grep DB_PASSWORD

# Deve ser a mesma do secret POSTGRES_PASSWORD_PROD
```

### **SSL não funciona**
```bash
# Verificar certificados
certbot certificates

# Renovar manualmente
certbot renew

# Verificar nginx
nginx -t
systemctl status nginx
```

### **Deploy automático falha**
```bash
# Verificar secrets no GitHub
# Settings → Secrets → Verificar todos presentes

# Testar SSH da VPS
ssh root@SEU_IP_VPS -i ~/.ssh/github_actions
```

### **Backup não roda**
```bash
# Verificar cron
crontab -l

# Testar script manualmente
/opt/artflow/scripts/backup-db.sh

# Ver logs
tail -f /var/log/artflow-backup.log
```

---

## 📚 Próximos Passos (Opcional)

1. **Monitoramento:** Adicionar Grafana + Prometheus
2. **Alertas:** Configurar notificações Slack/Email
3. **CDN:** Cloudflare para cache de assets
4. **Staging:** Ambiente de testes separado

---

**Tempo total estimado:** 2-3 horas (primeira vez)  
**Manutenção:** ~0 horas (tudo automático após setup)
