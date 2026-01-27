-- Migration: Tornar squad_id nullable na tabela clientes
-- Data: 2026-01-27
-- Descrição: Permite que clientes sejam criados sem squad inicialmente

ALTER TABLE clientes 
ALTER COLUMN squad_id DROP NOT NULL;
