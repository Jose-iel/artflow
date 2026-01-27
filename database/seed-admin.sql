/*
 * Script de Seed do Admin Master - PRODUÇÃO
 * Executar APENAS UMA VEZ após o primeiro deploy
 * Cria o primeiro usuário administrador com senha temporária
 * 
 * IMPORTANTE: Trocar a senha imediatamente após primeiro login!
 */

DO $$
DECLARE
    v_admin_id UUID;
    -- Senha temporária: Admin@123 (hash bcrypt gerado com bcryptjs rounds=10)
    -- DEVE SER TROCADA IMEDIATAMENTE APÓS PRIMEIRO LOGIN
    v_senha_temp TEXT := '$2b$10$xRZ/RAIulCZgaILqToeIfepmwXJB9Xv6jnads4O2SYMu8dPRRQsmC';
BEGIN
    -- Verifica se já existe algum Admin Master
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN_MASTER') THEN
        
        -- Gera UUID para o admin
        v_admin_id := gen_random_uuid();
        
        -- Insere diretamente na tabela users (sem usar função que pode causar hash duplo)
        INSERT INTO users (id, nome, email, senha, role, squad_id, ativo)
        VALUES (
            v_admin_id,
            'Admin Master',
            'admin@artflow.com',
            v_senha_temp,
            'ADMIN_MASTER',
            NULL,
            true
        );
        
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ Admin Master criado com sucesso!';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Email: admin@artflow.com';
        RAISE NOTICE 'Senha temporária: Admin@123';
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ATENÇÃO: TROCAR SENHA IMEDIATAMENTE!';
        RAISE NOTICE '';
        RAISE NOTICE 'Próximos passos:';
        RAISE NOTICE '1. Acessar: https://artflow.iel-company.com.br';
        RAISE NOTICE '2. Fazer login com as credenciais acima';
        RAISE NOTICE '3. Ir em Perfil/Configurações';
        RAISE NOTICE '4. Trocar senha para uma senha forte';
        RAISE NOTICE '========================================';
        
    ELSE
        RAISE NOTICE '========================================';
        RAISE NOTICE 'ℹ️  Admin Master já existe no banco';
        RAISE NOTICE 'Nenhuma ação necessária';
        RAISE NOTICE '========================================';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '❌ Erro ao criar Admin Master';
    RAISE NOTICE 'Erro: %', SQLERRM;
    RAISE NOTICE '========================================';
    RAISE EXCEPTION '%', SQLERRM;
END $$;
