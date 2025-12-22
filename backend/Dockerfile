# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia os arquivos de definição de dependências
COPY package.json pnpm-lock.yaml ./

# Instala o pnpm
RUN npm install -g pnpm

# Instala as dependências
RUN pnpm install --frozen-lockfile

# Copia o restante do código
COPY . .

# Instala as dependências de desenvolvimento para o build
RUN CI=true pnpm install --prod false

# Constrói a aplicação
RUN pnpm run build

# Remove as dependências de desenvolvimento
RUN pnpm prune --prod

# Estágio de produção
FROM node:18-alpine

WORKDIR /app

# Instala o pnpm
RUN npm install -g pnpm

# Copia as dependências de produção e o código compilado
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env* ./

# Expõe a porta da aplicação
EXPOSE 3333

# Comando para iniciar a aplicação
CMD ["node", "dist/server.js"]