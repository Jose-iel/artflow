import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { Cliente } from '../entities/Cliente';

async function hashExistingPasswords() {
  try {
    console.log('🔄 Iniciando migração de senhas...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');
    
    const clienteRepository = AppDataSource.getRepository(Cliente);
    
    // Find all users with plain text passwords (length < 50)
    const usersWithPlainPasswords = await clienteRepository
      .createQueryBuilder('cliente')
      .where('LENGTH(cliente.senha) < 50')
      .getMany();
    
    console.log(`📊 Encontrados ${usersWithPlainPasswords.length} usuários com senhas em texto puro`);
    
    if (usersWithPlainPasswords.length === 0) {
      console.log('✅ Nenhuma senha precisa ser atualizada');
      return;
    }
    
    // Hash passwords for each user
    for (const user of usersWithPlainPasswords) {
      console.log(`🔐 Hasheando senha para: ${user.email}`);
      
      // Hash the password with bcrypt
      const hashedPassword = await bcrypt.hash(user.senha, 8);
      
      // Update the user with hashed password
      await clienteRepository
        .createQueryBuilder()
        .update(Cliente)
        .set({ senha: hashedPassword })
        .where('id = :id', { id: user.id })
        .execute();
      
      console.log(`✅ Senha atualizada para: ${user.email}`);
    }
    
    console.log('🎉 Migração de senhas concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante migração de senhas:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexão com banco de dados encerrada');
    }
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  hashExistingPasswords()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar script:', error);
      process.exit(1);
    });
}

export { hashExistingPasswords };
