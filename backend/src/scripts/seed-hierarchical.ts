import { AppDataSource } from '../config/data-source';
import { Empresa } from '../entities/Empresa';
import { Squad } from '../entities/Squad';
import { User, UserRole } from '../entities/User';
import { Cliente } from '../entities/Cliente';
import { Post, PostStatus } from '../entities/Post';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database initialized');

    const empresaRepository = AppDataSource.getRepository(Empresa);
    const squadRepository = AppDataSource.getRepository(Squad);
    const userRepository = AppDataSource.getRepository(User);
    const clienteRepository = AppDataSource.getRepository(Cliente);
    const postRepository = AppDataSource.getRepository(Post);

    // Clear existing data
    await postRepository.delete({});
    await clienteRepository.delete({});
    await userRepository.delete({});
    await squadRepository.delete({});
    await empresaRepository.delete({});

    console.log('Cleared existing data');

    // Create Admin Master
    const adminMasterPassword = await bcrypt.hash('admin123', 10);
    const adminMaster = userRepository.create({
      nome: 'Admin Master',
      email: 'admin@artflow.com',
      senha: adminMasterPassword,
      role: UserRole.ADMIN_MASTER,
      squadId: undefined
    });
    await userRepository.save(adminMaster);
    console.log('Created Admin Master');

    // Create Empresa
    const empresa = empresaRepository.create({
      nome: 'Empresa Exemplo Ltda',
      cnpj: '12.345.678/0001-90',
      descricao: 'Empresa de exemplo para testes'
    });
    await empresaRepository.save(empresa);
    console.log('Created Empresa');

    // Create Squads
    const squad1 = squadRepository.create({
      nome: 'Squad Marketing',
      descricao: 'Equipe responsável pelo marketing digital',
      empresaId: empresa.id
    });
    await squadRepository.save(squad1);

    const squad2 = squadRepository.create({
      nome: 'Squad Design',
      descricao: 'Equipe responsável pelo design gráfico',
      empresaId: empresa.id
    });
    await squadRepository.save(squad2);
    console.log('Created Squads');

    // Create Funcionários
    const funcionario1Password = await bcrypt.hash('func123', 10);
    const funcionario1 = userRepository.create({
      nome: 'João Funcionário',
      email: 'joao@artflow.com',
      senha: funcionario1Password,
      role: UserRole.FUNCIONARIO,
      squadId: squad1.id
    });
    await userRepository.save(funcionario1);

    const funcionario2Password = await bcrypt.hash('func123', 10);
    const funcionario2 = userRepository.create({
      nome: 'Maria Funcionária',
      email: 'maria@artflow.com',
      senha: funcionario2Password,
      role: UserRole.FUNCIONARIO,
      squadId: squad2.id
    });
    await userRepository.save(funcionario2);
    console.log('Created Funcionários');

    // Create Clientes
    const cliente1Password = await bcrypt.hash('cliente123', 10);
    const cliente1 = clienteRepository.create({
      nome: 'Cliente A',
      email: 'cliente.a@artflow.com',
      senha: cliente1Password,
      squadId: squad1.id
    });
    await clienteRepository.save(cliente1);

    const cliente2Password = await bcrypt.hash('cliente123', 10);
    const cliente2 = clienteRepository.create({
      nome: 'Cliente B',
      email: 'cliente.b@artflow.com',
      senha: cliente2Password,
      squadId: squad1.id
    });
    await clienteRepository.save(cliente2);

    const cliente3Password = await bcrypt.hash('cliente123', 10);
    const cliente3 = clienteRepository.create({
      nome: 'Cliente C',
      email: 'cliente.c@artflow.com',
      senha: cliente3Password,
      squadId: squad2.id
    });
    await clienteRepository.save(cliente3);
    console.log('Created Clientes');

    // Create Posts
    const post1 = postRepository.create({
      clienteId: cliente1.id,
      createdById: funcionario1.id,
      squadId: squad1.id,
      imagePath: 'uploads/empresa1/cliente1/images/post1-1640995200000-sample.jpg',
      legenda: 'Post para Cliente A',
      status: PostStatus.NAO_APROVADO
    });
    await postRepository.save(post1);

    const post2 = postRepository.create({
      clienteId: cliente2.id,
      createdById: funcionario1.id,
      squadId: squad1.id,
      imagePath: 'uploads/empresa1/cliente2/images/post2-1640995200000-sample.jpg',
      legenda: 'Post para Cliente B',
      status: PostStatus.APROVADO
    });
    await postRepository.save(post2);

    const post3 = postRepository.create({
      clienteId: cliente3.id,
      createdById: funcionario2.id,
      squadId: squad2.id,
      imagePath: 'uploads/empresa2/cliente3/images/post3-1640995200000-sample.jpg',
      legenda: 'Post para Cliente C',
      status: PostStatus.APROVADO
    });
    await postRepository.save(post3);
    console.log('Created Posts');

    console.log('\n=== Seed completed successfully! ===');
    console.log('\nUsers created:');
    console.log('Admin Master: admin@artflow.com (senha: admin123)');
    console.log('Funcionário 1: joao@artflow.com (senha: func123) - Squad Marketing');
    console.log('Funcionária 2: maria@artflow.com (senha: func123) - Squad Design');
    console.log('Cliente A: cliente.a@artflow.com (senha: cliente123) - Squad Marketing');
    console.log('Cliente B: cliente.b@artflow.com (senha: cliente123) - Squad Marketing');
    console.log('Cliente C: cliente.c@artflow.com (senha: cliente123) - Squad Design');

  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed().catch(console.error);
}

export default seed;
