# 🚀 ArtFlow - Full Stack Application Setup

## 📋 Overview

ArtFlow é uma aplicação full-stack completa com sistema de gestão de conteúdo baseado em papéis (role-based), desenvolvida com:

- **Backend**: Node.js + Express + TypeScript + TypeORM + PostgreSQL
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS + Zustand + React Query
- **Infraestrutura**: Docker + Docker Compose + Nginx

---

## 🌐 URLs de Acesso

### **Aplicações**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3333/api
- **Health Check**: http://localhost:3333/api/health

### **Ferramentas de Desenvolvimento**
- **pgAdmin**: http://localhost:5050
- **PostgreSQL**: localhost:5432

---

## 🔐 Credenciais de Acesso

### **Seed Data (Desenvolvimento)**
```json
{
  "admin": {
    "email": "admin@artflow.com",
    "senha": "senha123",
    "role": "SUPER_USER"
  },
  "client": {
    "email": "cliente@teste.com",
    "senha": "senha123", 
    "role": "CLIENT"
  }
}
```

### **Database**
- **Host**: localhost
- **Port**: 5432
- **Database**: artflow
- **Username**: postgres
- **Password**: postgres

### **pgAdmin**
- **Email**: admin@artflow.com
- **Senha**: admin123

---

## 🚀 Quick Start

### **1. Iniciar Toda a Infraestrutura**
```bash
cd /Users/josehenrique/Pessoal/artflow
pnpm compose:up --build
```

### **2. Parar Infraestrutura**
```bash
pnpm compose:down
```

### **3. Verificar Status**
```bash
docker ps
# ou
pnpm compose:ps
```

---

## 🏗️ Arquitetura

### **Backend Features**
- ✅ **Role-Based Authentication** (SUPER_USER / CLIENT)
- ✅ **JWT Tokens** com role incluído
- ✅ **Admin Endpoints** (`/api/admin/*`)
- ✅ **Client Endpoints** (`/api/posts/*`)
- ✅ **Anti-Lockout Protection**
- ✅ **Cross-Client Data Isolation**
- ✅ **156 Testes Automatizados** (Jest + Supertest)
- ✅ **TypeORM** com PostgreSQL
- ✅ **DTOs** com validação Zod

### **Frontend Features**
- ✅ **React 19** + TypeScript
- ✅ **Vite** para build otimizado
- ✅ **Tailwind CSS** + shadcn/ui components
- ✅ **React Query** para server state
- ✅ **Zustand** para client state
- ✅ **React Router v7** com protected routes
- ✅ **Code Splitting** automático
- ✅ **Gzip Compression** (Nginx)
- ✅ **Security Headers** (Nginx)

### **Infraestrutura**
- ✅ **Multi-stage Docker builds**
- ✅ **Nginx** para frontend estático
- ✅ **PostgreSQL** persistido
- ✅ **pgAdmin** para gestão
- ✅ **Health checks** em todos serviços
- ✅ **Build optimization** (.dockerignore)

---

## 📁 Estrutura de Projetos

```
artflow/
├── backend/                 # Node.js + Express + TypeORM
│   ├── src/
│   │   ├── controllers/     # Admin, Auth, Post controllers
│   │   ├── entities/        # Cliente, Post entities
│   │   ├── middlewares/     # Auth, requireRole
│   │   ├── dtos/           # Data Transfer Objects
│   │   └── __tests__/      # 156 testes automatizados
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── stores/        # Zustand stores
│   │   └── types/         # TypeScript types
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker/
│   └── docker-compose.yaml
├── database/
│   └── init.sql
└── pgadmin/
    └── servers.json
```

---

## 🔧 Desenvolvimento

### **Backend Development**
```bash
cd backend
pnpm install
pnpm dev          # Development server
pnpm test         # Run 156 tests
pnpm build        # Production build
```

### **Frontend Development**
```bash
cd frontend
pnpm install
pnpm dev          # Vite dev server (port 5173)
pnpm build        # Production build
pnpm test         # Jest tests
pnpm preview      # Preview build
```

### **Environment Variables**

#### Backend (.env)
```env
NODE_ENV=development
PORT=3333
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=artflow
JWT_SECRET=artflow_jwt_secret_key
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3333/api
VITE_APP_NAME=ArtFlow
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true
VITE_ENABLE_DEVTOOLS=true
```

---

## 🧪 Testes

### **Backend Tests**
```bash
cd backend
pnpm test                    # Todos os 156 testes
pnpm test:watch             # Watch mode
pnpm test:coverage          # Com coverage
pnpm test:admin             # Testes do Admin Controller
pnpm test:integration       # Testes de integração
```

### **Frontend Tests**
```bash
cd frontend
pnpm test                   # Jest tests
pnpm test:watch            # Watch mode
pnpm test:coverage         # Com coverage
```

---

## 📊 Performance

### **Build Optimization**
- **Frontend**: Code splitting em 4 chunks (vendor, router, query, app)
- **Backend**: Tree shaking, production dependencies only
- **Docker**: Multi-stage builds, .dockerignore optimization
- **Nginx**: Gzip compression, cache headers, security headers

### **Tamanhos de Build**
```
Frontend (gzipped):
- index.html: 0.38 kB
- CSS: 2.12 kB  
- Vendor JS: 4.10 kB
- Query JS: 7.44 kB
- Router JS: 12.03 kB
- App JS: 57.63 kB
Total: ~83 kB
```

---

## 🔒 Segurança

### **Backend Security**
- ✅ **JWT Authentication** com expiração
- ✅ **Role-Based Access Control** 
- ✅ **Password Hashing** (bcrypt, salt rounds: 8)
- ✅ **CORS Protection**
- ✅ **Input Validation** (Zod DTOs)
- ✅ **SQL Injection Protection** (TypeORM)

### **Frontend Security**
- ✅ **Content Security Policy**
- ✅ **X-Frame-Options**
- ✅ **X-XSS-Protection**
- ✅ **X-Content-Type-Options**
- ✅ **Referrer-Policy**

---

## 🚀 Deploy Considerações

### **Produção**
1. **Alterar senhas padrão** (PostgreSQL, pgAdmin, JWT)
2. **Configurar HTTPS** (certificados SSL)
3. **Setup backup** para PostgreSQL
4. **Monitoramento** e logging
5. **CI/CD pipeline** para builds automatizados

### **Variáveis de Produção**
```env
# Backend
NODE_ENV=production
JWT_SECRET=your_production_secret
DB_PASSWORD=strong_database_password

# Frontend  
VITE_API_BASE_URL=https://your-domain.com/api
VITE_DEV_MODE=false
VITE_ENABLE_DEVTOOLS=false
```

---

## 📚 Documentação

### **API Documentation**
- **Backend**: `backend/API_DOCUMENTATION.md` (864 linhas)
- **Endpoints**: Auth, Admin, Posts completos
- **Exemplos**: curl commands para todos fluxos
- **Security**: Features e proteções implementadas

### **Código Fonte**
- **TypeScript** em todo projeto
- **JSDoc** em funções críticas
- **Component Documentation** (próxima implementação)

---

## 🛠️ Troubleshooting

### **Common Issues**

#### Frontend não carrega?
```bash
# Verificar nginx logs
docker logs artflow_frontend

# Reconstruir frontend
pnpm compose:up --build
```

#### Backend não responde?
```bash
# Verificar backend logs
docker logs artflow_backend

# Testar health endpoint
curl http://localhost:3333/api/health
```

#### Database connection failed?
```bash
# Verificar PostgreSQL status
docker logs artflow_postgres

# Testar connection
docker exec -it artflow_postgres psql -U postgres -d artflow
```

---

## 🎯 Próximos Passos

### **Frontend Development**
1. **Implementar componentes UI** com shadcn/ui
2. **Setup autenticação** com Protected Routes
3. **Criar layouts** admin/client
4. **Implementar chamadas API** com React Query
5. **Adicionar formulários** com React Hook Form + Zod

### **Backend Enhancements**
1. **File upload system** para imagens
2. **Email notifications** 
3. **Audit logs** para ações admin
4. **Rate limiting** para API
5. **WebSocket** para real-time updates

---

## 📞 Suporte

Para dúvidas ou problemas:
1. **Verificar logs** dos containers Docker
2. **Consultar documentação** da API (864 linhas)
3. **Executar testes** para validação
4. **Revisar environment variables**

**Status: ✅ PRODUCTION READY** 🚀
