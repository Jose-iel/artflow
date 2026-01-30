# 📊 Monitoramento de Aplicação - Guia de Implementação

**Status:** 🔜 Pendente de Implementação  
**Objetivo:** Adicionar monitoramento de métricas e logs da aplicação backend ao Grafana  
**Pré-requisito:** Infraestrutura base já configurada (Grafana + Prometheus + Node Exporter)

---

## 🎯 O Que Será Implementado

### **Atualmente Temos:**
- ✅ Grafana (dashboards visuais)
- ✅ Prometheus (coleta de métricas)
- ✅ Node Exporter (métricas do sistema VPS)

### **Vamos Adicionar:**
- 📊 **prom-client** - Métricas da aplicação backend
- 📝 **Winston** - Logs estruturados
- 📈 **Dashboards** - Visualização no Grafana

---

## 📦 Parte 1: Adicionar Métricas da Aplicação (prom-client)

### **1.1 Instalar Dependência**

```bash
cd backend
pnpm add prom-client
```

### **1.2 Criar Arquivo de Métricas**

**Arquivo:** `backend/src/config/metrics.ts`

```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Criar registry
export const register = new Registry();

// Métricas HTTP
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Métricas de Banco de Dados
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// Métricas de Autenticação
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status'],
  registers: [register],
});

// Métricas de Negócio
export const postsCreated = new Counter({
  name: 'posts_created_total',
  help: 'Total number of posts created',
  registers: [register],
});

export const clientsCreated = new Counter({
  name: 'clients_created_total',
  help: 'Total number of clients created',
  registers: [register],
});
```

### **1.3 Criar Middleware de Métricas**

**Arquivo:** `backend/src/middlewares/metrics.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../config/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Capturar quando a resposta terminar
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Registrar duração
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );

    // Registrar total de requests
    httpRequestTotal.inc({ method, route, status_code: statusCode });
  });

  next();
};
```

### **1.4 Criar Endpoint /metrics**

**Arquivo:** `backend/src/routes/metrics.routes.ts`

```typescript
import { Router } from 'express';
import { register } from '../config/metrics';

const router = Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
```

### **1.5 Integrar no App**

**Arquivo:** `backend/src/app.ts`

```typescript
import express from 'express';
import { metricsMiddleware } from './middlewares/metrics.middleware';
import metricsRoutes from './routes/metrics.routes';

const app = express();

// Adicionar middleware de métricas (ANTES das rotas)
app.use(metricsMiddleware);

// Rotas
app.use('/api', routes);
app.use('/', metricsRoutes); // Endpoint /metrics

export default app;
```

### **1.6 Usar Métricas nos Controllers**

**Exemplo:** `backend/src/controllers/PostController.ts`

```typescript
import { postsCreated } from '../config/metrics';

class PostController {
  async create(req: Request, res: Response) {
    // ... lógica de criação
    
    const post = await postRepository.save(newPost);
    
    // Incrementar métrica
    postsCreated.inc();
    
    return res.json(post);
  }
}
```

### **1.7 Atualizar Prometheus Config**

**Arquivo:** `docker/monitoring/prometheus.yml`

```yaml
scrape_configs:
  # ... configs existentes ...
  
  # Backend API
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3333']
        labels:
          service: 'artflow-backend'
    metrics_path: '/metrics'
    scrape_interval: 15s
```

**Descomentar a linha que está comentada no arquivo atual.**

---

## 📝 Parte 2: Adicionar Logs Estruturados (Winston)

### **2.1 Instalar Dependência**

```bash
cd backend
pnpm add winston winston-daily-rotate-file
```

### **2.2 Criar Configuração do Winston**

**Arquivo:** `backend/src/config/logger.ts`

```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato customizado
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Adicionar metadata se existir
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  // Adicionar stack trace se for erro
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// Transports
const transports: winston.transport[] = [
  // Console (desenvolvimento)
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    ),
  }),
];

// Adicionar file transports em produção
if (process.env.NODE_ENV === 'production') {
  // Logs de erro
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
      maxSize: '20m',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        winston.format.json()
      ),
    })
  );

  // Logs combinados
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
    })
  );
}

// Criar logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
});

export default logger;
```

### **2.3 Usar Logger na Aplicação**

**Substituir console.log por logger:**

```typescript
// Antes
console.log('User logged in', { userId, email });
console.error('Database error', error);

// Depois
import logger from './config/logger';

logger.info('User logged in', { userId, email });
logger.error('Database error', { error: error.message, stack: error.stack });
```

**Exemplos de uso:**

```typescript
// Controllers
logger.info('Creating new post', { userId, postData });
logger.warn('Invalid input', { field: 'email', value });
logger.error('Failed to save post', { error: err.message });

// Middlewares
logger.info('Request received', { 
  method: req.method, 
  path: req.path, 
  ip: req.ip 
});

// Services
logger.debug('Database query', { query, params });
```

### **2.4 Middleware de Logging**

**Arquivo:** `backend/src/middlewares/logging.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};
```

**Adicionar no app.ts:**

```typescript
import { loggingMiddleware } from './middlewares/logging.middleware';

app.use(loggingMiddleware);
```

---

## 📈 Parte 3: Criar Dashboards no Grafana

### **3.1 Dashboard de Aplicação Backend**

**Acessar Grafana:** https://grafana-artflow.iel-company.com.br

**Criar novo dashboard:**

1. **Painel: Requests por Segundo**
   - Query: `rate(http_requests_total[5m])`
   - Type: Graph
   - Title: "Requests/Second"

2. **Painel: Latência Média**
   - Query: `rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])`
   - Type: Graph
   - Title: "Average Response Time"

3. **Painel: Erros HTTP**
   - Query: `rate(http_requests_total{status_code=~"5.."}[5m])`
   - Type: Graph
   - Title: "HTTP 5xx Errors"

4. **Painel: Endpoints Mais Usados**
   - Query: `topk(10, sum by (route) (rate(http_requests_total[5m])))`
   - Type: Bar gauge
   - Title: "Top 10 Endpoints"

5. **Painel: Posts Criados**
   - Query: `rate(posts_created_total[5m])`
   - Type: Stat
   - Title: "Posts Created/Second"

6. **Painel: Conexões DB Ativas**
   - Query: `db_connections_active`
   - Type: Gauge
   - Title: "Active DB Connections"

### **3.2 Importar Dashboard Pronto (Opcional)**

Existe dashboard da comunidade para Express.js + Prometheus:
- ID: **11159** (Node.js Application Dashboard)

---

## 🔧 Parte 4: Configurações Adicionais

### **4.1 Atualizar .gitignore**

```gitignore
# Logs
logs/
*.log
```

### **4.2 Criar Diretório de Logs**

```bash
mkdir -p backend/logs
```

### **4.3 Atualizar docker-compose.prod.yaml**

```yaml
services:
  backend:
    volumes:
      - uploads_data:/app/uploads
      - logs_data:/app/logs  # Adicionar volume para logs

volumes:
  logs_data:
    driver: local
```

---

## ✅ Checklist de Implementação

- [ ] Instalar prom-client
- [ ] Criar config/metrics.ts
- [ ] Criar middleware de métricas
- [ ] Criar endpoint /metrics
- [ ] Integrar no app.ts
- [ ] Adicionar métricas nos controllers
- [ ] Atualizar prometheus.yml
- [ ] Instalar winston
- [ ] Criar config/logger.ts
- [ ] Substituir console.log por logger
- [ ] Criar middleware de logging
- [ ] Atualizar .gitignore
- [ ] Criar dashboards no Grafana
- [ ] Testar métricas em /metrics
- [ ] Verificar logs em logs/

---

## 🧪 Validação

### **Testar Endpoint /metrics:**
```bash
curl http://localhost:3333/metrics
```

Deve retornar métricas no formato Prometheus:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/posts",status_code="200"} 42
```

### **Testar Logs:**
```bash
# Ver logs em tempo real
docker logs artflow_backend_prod -f

# Ver arquivo de logs
docker exec artflow_backend_prod cat logs/combined-2026-01-27.log
```

### **Verificar no Grafana:**
1. Acessar Grafana
2. Explore → Prometheus
3. Query: `http_requests_total`
4. Deve mostrar dados

---

## 📊 Métricas Disponíveis Após Implementação

**Sistema (já tem):**
- CPU, RAM, Disco, Network

**Aplicação (novo):**
- Requests/segundo
- Latência (tempo de resposta)
- Erros HTTP (4xx, 5xx)
- Endpoints mais usados
- Posts criados
- Clientes criados
- Tentativas de autenticação
- Queries do banco
- Conexões DB ativas

**Logs (novo):**
- Logs estruturados em JSON
- Rotação diária automática
- Retenção de 14 dias
- Níveis: error, warn, info, debug

---

## 🎯 Resultado Final

Após implementação, você terá:

1. **Grafana com 2 tipos de dashboards:**
   - Sistema (VPS) - CPU, RAM, etc
   - Aplicação (Backend) - Requests, latência, erros

2. **Logs estruturados:**
   - Arquivos JSON rotacionados
   - Fácil de filtrar e analisar
   - Integração futura com Loki (opcional)

3. **Monitoramento completo:**
   - Infraestrutura ✅
   - Aplicação ✅
   - Logs ✅

---

## 📚 Referências

- [prom-client Documentation](https://github.com/siimon/prom-client)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

---

**Tempo estimado de implementação:** 2-3 horas  
**Complexidade:** Média  
**Impacto:** Alto (visibilidade completa da aplicação)
