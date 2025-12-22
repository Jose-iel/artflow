#!/bin/bash

# Script para resetar o banco de dados ArtFlow
# Para usar: chmod +x scripts/reset-database.sh && ./scripts/reset-database.sh

echo "🔄 Resetando banco de dados ArtFlow..."

# Para o container PostgreSQL se estiver rodando
echo "⏹️  Parando container PostgreSQL..."
docker-compose down

# Remove o volume do banco para limpar completamente
echo "🗑️  Removendo volume do banco de dados..."
docker volume rm artflow_postgres_data 2>/dev/null || true

# Sobe os containers novamente (isso vai recriar o banco com o init.sql)
echo "🚀 Subindo containers com nova estrutura..."
docker-compose up -d

# Aguarda o banco estar pronto
echo "⏳ Aguardando banco de dados ficar pronto..."
sleep 10

# Verifica se o banco está acessível
echo "🔍 Verificando conexão com o banco..."
until docker-compose exec -T postgres pg_isready -U postgres -d artflow; do
  echo "Aguardando PostgreSQL..."
  sleep 2
done

echo "✅ Banco de dados resetado com sucesso!"
echo ""
echo "📋 Usuários criados:"
echo "🔹 Admin Master: admin@artflow.com (senha: senha123)"
echo "🔹 Funcionários: joao@artflow.com, maria@artflow.com (senha: func123)"
echo "🔹 Clientes: cliente.a@artflow.com, cliente.b@artflow.com, cliente.c@artflow.com (senha: cliente123)"
echo ""
echo "🚀 Agora você pode iniciar o backend: npm run dev"
