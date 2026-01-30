#!/bin/bash

# Script para executar limpeza manual de posts antigos
# Uso: ./scripts/cleanup-old-posts.sh

echo "=== Script de Limpeza de Posts Antigos ==="
echo "Data: $(date)"
echo ""

# Verifica se o backend está rodando
if ! curl -s http://localhost:3333/health > /dev/null; then
    echo "❌ Backend não está rodando na porta 3333"
    echo "Por favor, inicie o backend antes de executar este script"
    exit 1
fi

echo "✅ Backend está rodando"
echo ""

# Executa limpeza de posts antigos
echo "🧹 Executando limpeza de posts antigos..."
RESPONSE=$(curl -s -X POST http://localhost:3333/cleanup/run \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Erro ao executar limpeza:"
    echo "$RESPONSE"
    exit 1
else
    echo "✅ Limpeza executada com sucesso!"
    echo "$RESPONSE"
fi

echo ""
echo "🔍 Verificando arquivos órfãos..."
ORPHANED_RESPONSE=$(curl -s -X GET http://localhost:3333/cleanup/orphaned \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "$ORPHANED_RESPONSE"

# Pergunta se deseja remover arquivos órfãos
if echo "$ORPHANED_RESPONSE" | grep -q '"count":[1-9]'; then
    echo ""
    read -p "Deseja remover os arquivos órfãos? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removendo arquivos órfãos..."
        DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3333/cleanup/orphaned \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -H "Content-Type: application/json")
        echo "$DELETE_RESPONSE"
    fi
fi

echo ""
echo "=== Limpeza concluída ==="
