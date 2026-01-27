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
    -- Senha temporária: admin123 (hash bcrypt)
    -- DEVE SER TROCADA IMEDIATAMENTE APÓS PRIMEIRO LOGIN
    v_senha_temp TEXT := '$2b$10$xRZ/RAIulCZgaILqToeIfepmwXJB9Xv6jnads4O2SYMu8dPRRQsmC';
BEGIN
    -- Verifica se já existe algum Admin Master
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN_MASTER') THEN
        
        -- Cria o primeiro Admin Master
        SELECT cria_usuario(
            'Admin Master',
            'admin@artflow.com',
            v_senha_temp,
            'ADMIN_MASTER',
            NULL
        ) INTO v_admin_id;
        
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ Admin Master criado com sucesso!';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Email: admin@artflow.com';
        RAISE NOTICE 'Senha temporária: admin123';
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
