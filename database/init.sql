/*
 * Script de inicialização do banco de dados do ArtFlow
 * Contém a estrutura inicial das tabelas, índices, funções e triggers
 * Versão 2.0 - Com estrutura hierárquica multi-tenant
 */

-- Habilitar extensão para criptografia e geração de UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domínios para validação
CREATE DOMAIN email_type AS TEXT
    CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE DOMAIN user_role AS TEXT
    CHECK (VALUE IN ('ADMIN_MASTER', 'FUNCIONARIO', 'CLIENT'));

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL CHECK (LENGTH(TRIM(nome)) > 0),
    cnpj TEXT UNIQUE NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de squads
CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL CHECK (LENGTH(TRIM(nome)) > 0),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de usuários (nova estrutura unificada)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL CHECK (LENGTH(TRIM(nome)) > 0),
    email email_type UNIQUE NOT NULL,
    senha TEXT NOT NULL CHECK (LENGTH(senha) >= 8),
    ativo BOOLEAN DEFAULT TRUE,
    role user_role DEFAULT 'CLIENT',
    squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clientes (mantida para compatibilidade)
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL CHECK (LENGTH(TRIM(nome)) > 0),
    email email_type UNIQUE NOT NULL,
    senha TEXT NOT NULL CHECK (LENGTH(senha) >= 8),
    ativo BOOLEAN DEFAULT TRUE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON empresas(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);

CREATE INDEX IF NOT EXISTS idx_squads_ativo ON squads(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_squads_empresa_id ON squads(empresa_id);

CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_squad_id ON users(squad_id);

CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_clientes_squad_id ON clientes(squad_id);

-- Tabela de posts
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data_postagem TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_agendada TIMESTAMP WITH TIME ZONE,
    imagem_url TEXT NOT NULL CHECK (imagem_url ~* '^https?://.+'),
    legenda TEXT,
    status TEXT NOT NULL 
        DEFAULT 'Não aprovado' 
        CHECK (status IN ('Aprovado', 'Não aprovado', 'Alteração', 'Agendado', 'Publicado')),
    comentario_cliente TEXT,
    comentario_admin TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Garante que a data agendada seja futura (apenas para novos posts)
    CONSTRAINT chk_data_agendada_valida 
        CHECK (data_agendada IS NULL OR data_agendada >= CURRENT_TIMESTAMP)
);

-- Índices para posts
CREATE INDEX IF NOT EXISTS idx_posts_cliente_id ON posts(cliente_id);
CREATE INDEX IF NOT EXISTS idx_posts_squad_id ON posts(squad_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_by_id ON posts(created_by_id) WHERE created_by_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status) WHERE status != 'Publicado';
CREATE INDEX IF NOT EXISTS idx_posts_data_postagem ON posts(data_postagem);
CREATE INDEX IF NOT EXISTS idx_posts_data_agendada ON posts(data_agendada) 
    WHERE data_agendada IS NOT NULL AND status = 'Agendado';

-- Função para atualizar o campo atualizado_em
CREATE OR REPLACE FUNCTION atualiza_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática do campo atualizado_em
CREATE TRIGGER atualiza_empresas
BEFORE UPDATE ON empresas
FOR EACH ROW EXECUTE FUNCTION atualiza_data_atualizacao();

CREATE TRIGGER atualiza_squads
BEFORE UPDATE ON squads
FOR EACH ROW EXECUTE FUNCTION atualiza_data_atualizacao();

CREATE TRIGGER atualiza_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION atualiza_data_atualizacao();

CREATE TRIGGER atualiza_clientes
BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION atualiza_data_atualizacao();

CREATE TRIGGER atualiza_posts
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION atualiza_data_atualizacao();

-- Função para criar hash de senha (usando bcrypt compatível)
-- NOTA: As senhas devem ser pré-hasheadas com bcrypt antes de inserir
CREATE OR REPLACE FUNCTION cria_usuario(
    p_nome TEXT,
    p_email TEXT,
    p_senha_hash TEXT,  -- Senha já hasheada com bcrypt
    p_role user_role DEFAULT 'CLIENT',
    p_squad_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_usuario_id UUID;
BEGIN
    -- Verifica se o email já existe
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email já cadastrado';
    END IF;
    
    -- Insere o novo usuário com senha já hasheada
    INSERT INTO users (nome, email, senha, role, squad_id)
    VALUES (p_nome, p_email, p_senha_hash, p_role, p_squad_id)
    RETURNING id INTO v_usuario_id;
    
    RETURN v_usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar cliente (legado)
-- NOTA: As senhas devem ser pré-hasheadas com bcrypt antes de inserir
CREATE OR REPLACE FUNCTION cria_cliente(
    p_nome TEXT,
    p_email TEXT,
    p_senha_hash TEXT,  -- Senha já hasheada com bcrypt
    p_squad_id UUID
) RETURNS UUID AS $$
DECLARE
    v_cliente_id UUID;
BEGIN
    -- Verifica se o email já existe
    IF EXISTS (SELECT 1 FROM clientes WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email já cadastrado';
    END IF;
    
    -- Insere o novo cliente com senha já hasheada
    INSERT INTO clientes (nome, email, senha, squad_id)
    VALUES (p_nome, p_email, p_senha_hash, p_squad_id)
    RETURNING id INTO v_cliente_id;
    
    RETURN v_cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dados iniciais para testes
-- Senhas pré-hasheadas com bcrypt (cost=10)
-- senha123 -> $2b$10$xRZ/RAIulCZgaILqToeIfepmwXJB9Xv6jnads4O2SYMu8dPRRQsmC
-- func123 -> $2b$10$NwKxYAQQuXiZhbQUsNihQucS/E9kI5S0HiE.meyBsAqiGDGoIXmCK
-- cliente123 -> $2b$10$A9d2KjVxKyFG9Sxt8ZP.XeMfzHjnxSayBVfDOQ76nGpwtBVM2kmEO
DO $$
DECLARE
    v_admin_master_id UUID;
    v_empresa_id UUID;
    v_squad_marketing_id UUID;
    v_squad_design_id UUID;
    v_funcionario_joao_id UUID;
    v_funcionario_maria_id UUID;
    v_cliente_a_id UUID;
    v_cliente_b_id UUID;
    v_cliente_c_id UUID;
    -- Senhas hasheadas com bcrypt
    v_senha_admin TEXT := '$2b$10$xRZ/RAIulCZgaILqToeIfepmwXJB9Xv6jnads4O2SYMu8dPRRQsmC';
    v_senha_func TEXT := '$2b$10$NwKxYAQQuXiZhbQUsNihQucS/E9kI5S0HiE.meyBsAqiGDGoIXmCK';
    v_senha_cliente TEXT := '$2b$10$A9d2KjVxKyFG9Sxt8ZP.XeMfzHjnxSayBVfDOQ76nGpwtBVM2kmEO';
BEGIN
    -- Cria Admin Master (senha: senha123)
    SELECT cria_usuario(
        'Admin Master', 
        'admin@artflow.com', 
        v_senha_admin,
        'ADMIN_MASTER',
        NULL
    ) INTO v_admin_master_id;
    
    -- Cria Empresa
    INSERT INTO empresas (nome, cnpj, descricao)
    VALUES (
        'Empresa Exemplo Ltda',
        '12.345.678/0001-90',
        'Empresa de exemplo para testes'
    ) RETURNING id INTO v_empresa_id;
    
    -- Cria Squads
    INSERT INTO squads (nome, descricao, empresa_id)
    VALUES (
        'Squad Marketing',
        'Equipe responsável pelo marketing digital',
        v_empresa_id
    ) RETURNING id INTO v_squad_marketing_id;
    
    INSERT INTO squads (nome, descricao, empresa_id)
    VALUES (
        'Squad Design',
        'Equipe responsável pelo design gráfico',
        v_empresa_id
    ) RETURNING id INTO v_squad_design_id;
    
    -- Cria Funcionários (senha: func123)
    SELECT cria_usuario(
        'João Funcionário', 
        'joao@artflow.com', 
        v_senha_func,
        'FUNCIONARIO',
        v_squad_marketing_id
    ) INTO v_funcionario_joao_id;
    
    SELECT cria_usuario(
        'Maria Funcionária', 
        'maria@artflow.com', 
        v_senha_func,
        'FUNCIONARIO',
        v_squad_design_id
    ) INTO v_funcionario_maria_id;
    
    -- Cria Clientes (legado) (senha: cliente123)
    SELECT cria_cliente(
        'Cliente A', 
        'cliente.a@artflow.com', 
        v_senha_cliente,
        v_squad_marketing_id
    ) INTO v_cliente_a_id;
    
    SELECT cria_cliente(
        'Cliente B', 
        'cliente.b@artflow.com', 
        v_senha_cliente,
        v_squad_marketing_id
    ) INTO v_cliente_b_id;
    
    SELECT cria_cliente(
        'Cliente C', 
        'cliente.c@artflow.com', 
        v_senha_cliente,
        v_squad_design_id
    ) INTO v_cliente_c_id;
    
    -- Adiciona posts criados pelos funcionários para os clientes
    INSERT INTO posts (cliente_id, squad_id, created_by_id, data_postagem, imagem_url, legenda, status)
    VALUES 
        (v_cliente_a_id, v_squad_marketing_id, v_funcionario_joao_id, CURRENT_TIMESTAMP, 'https://example.com/post1.jpg', 'Post para Cliente A', 'Não aprovado'),
        (v_cliente_b_id, v_squad_marketing_id, v_funcionario_joao_id, CURRENT_TIMESTAMP + INTERVAL '1 day', 'https://example.com/post2.jpg', 'Post para Cliente B', 'Aprovado'),
        (v_cliente_c_id, v_squad_design_id, v_funcionario_maria_id, CURRENT_TIMESTAMP + INTERVAL '2 days', 'https://example.com/post3.jpg', 'Post para Cliente C', 'Agendado');
    
    -- Adiciona posts criados pelos próprios clientes (para testes)
    INSERT INTO posts (cliente_id, squad_id, data_postagem, imagem_url, legenda, status)
    VALUES 
        (v_cliente_a_id, v_squad_marketing_id, CURRENT_TIMESTAMP, 'https://example.com/post4.jpg', 'Post criado pelo Cliente A', 'Não aprovado');
    
    RAISE NOTICE 'Dados iniciais criados com sucesso';
    RAISE NOTICE 'Admin Master: admin@artflow.com (senha: senha123)';
    RAISE NOTICE 'Funcionários: joao@artflow.com, maria@artflow.com (senha: func123)';
    RAISE NOTICE 'Clientes: cliente.a@artflow.com, cliente.b@artflow.com, cliente.c@artflow.com (senha: cliente123)';
    
EXCEPTION WHEN OTHERS THEN
    -- Ignora erros (como usuário já existente) e continua
    RAISE NOTICE 'Erro ao criar dados iniciais: %', SQLERRM;
END $$;
