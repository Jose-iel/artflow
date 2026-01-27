-- Migration: Remove constraint chk_data_agendada_valida
-- Data: 27 de Janeiro de 2026
-- Motivo: Permitir que o scheduler atualize posts com data_agendada no passado

-- Remove constraint que impede data_agendada no passado
ALTER TABLE posts DROP CONSTRAINT IF EXISTS chk_data_agendada_valida;

-- Verificação: Listar constraints restantes na tabela posts
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'posts'::regclass;
