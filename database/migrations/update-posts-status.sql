-- Migration: Remover status 'Alteração' e atualizar posts existentes
-- Data: 2026-01-29
-- Descrição: Atualiza todos os posts com status 'Alteração' para 'Não aprovado'

-- Atualizar posts existentes
UPDATE posts 
SET status = 'Não aprovado' 
WHERE status = 'Alteração';

-- Verificar resultado
SELECT COUNT(*) as posts_atualizados 
FROM posts 
WHERE status = 'Não aprovado';
