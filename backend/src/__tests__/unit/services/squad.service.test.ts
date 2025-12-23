import { SquadService } from '../../../services/squad.service';
import { ISquadRepository, IUserRepository, IClienteRepository, IEmpresaRepository } from '../../../interfaces/squad-repository.interface';
import { UserRole } from '../../../entities/User';
import { AuthUser } from '../../../interfaces/squad-service.interface';
import AppError from '../../../utils/AppError';

describe('SquadService', () => {
  let service: SquadService;
  let mockSquadRepository: jest.Mocked<ISquadRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockClienteRepository: jest.Mocked<IClienteRepository>;
  let mockEmpresaRepository: jest.Mocked<IEmpresaRepository>;

  const adminUser: AuthUser = {
    id: 'admin-id',
    role: UserRole.ADMIN_MASTER,
    squadId: undefined
  };

  const funcionarioUser: AuthUser = {
    id: 'func-id',
    role: UserRole.FUNCIONARIO,
    squadId: 'squad-1'
  };

  const clienteUser: AuthUser = {
    id: 'cliente-id',
    role: UserRole.CLIENT,
    squadId: 'squad-1'
  };

  const mockSquad = {
    id: 'squad-1',
    nome: 'Test Squad',
    descricao: 'Test description',
    empresaId: 'empresa-1',
    ativo: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    empresa: { id: 'empresa-1', nome: 'Test Empresa' },
    funcionarios: [],
    clientes: [],
    posts: []
  };

  const mockFuncionario = {
    id: 'func-2',
    nome: 'Funcionario Test',
    email: 'func@test.com',
    senha: 'hashed',
    role: UserRole.FUNCIONARIO,
    squadId: null,
    ativo: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    squad: null,
    createdPosts: []
  };

  const mockCliente = {
    id: 'cliente-1',
    nome: 'Cliente Test',
    email: 'cliente@test.com',
    senha: 'hashed',
    squadId: null,
    ativo: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    squad: null,
    posts: []
  };

  beforeEach(() => {
    mockSquadRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIdWithMembers: jest.fn(),
      findByEmpresaId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    };

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findBySquadId: jest.fn(),
      save: jest.fn(),
      updateSquadId: jest.fn()
    };

    mockClienteRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findBySquadId: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      updateSquadId: jest.fn()
    };

    mockEmpresaRepository = {
      findById: jest.fn()
    };

    service = new SquadService(
      mockSquadRepository,
      mockUserRepository,
      mockClienteRepository,
      mockEmpresaRepository
    );
  });

  // ═══════════════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════════════

  describe('findAll', () => {
    it('should return all squads for admin master', async () => {
      const squads = [mockSquad, { ...mockSquad, id: 'squad-2' }];
      mockSquadRepository.findAll.mockResolvedValue(squads as any);

      const result = await service.findAll(adminUser);

      expect(mockSquadRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return only own squad for funcionário', async () => {
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(mockSquad as any);

      const result = await service.findAll(funcionarioUser);

      expect(mockSquadRepository.findByIdWithMembers).toHaveBeenCalledWith('squad-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('squad-1');
    });

    it('should return empty array for funcionário without squad', async () => {
      const userWithoutSquad: AuthUser = {
        id: 'func-id',
        role: UserRole.FUNCIONARIO,
        squadId: undefined
      };

      const result = await service.findAll(userWithoutSquad);

      expect(result).toHaveLength(0);
    });

    it('should return only own squad for cliente', async () => {
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(mockSquad as any);

      const result = await service.findAll(clienteUser);

      expect(mockSquadRepository.findByIdWithMembers).toHaveBeenCalledWith('squad-1');
      expect(result).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // findById
  // ═══════════════════════════════════════════════════════════

  describe('findById', () => {
    it('should return squad when admin master requests', async () => {
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(mockSquad as any);

      const result = await service.findById('squad-1', adminUser);

      expect(result.id).toBe('squad-1');
    });

    it('should return squad when funcionário requests own squad', async () => {
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(mockSquad as any);

      const result = await service.findById('squad-1', funcionarioUser);

      expect(result.id).toBe('squad-1');
    });

    it('should throw 403 when funcionário requests different squad', async () => {
      const otherSquad = { ...mockSquad, id: 'squad-2' };
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(otherSquad as any);

      await expect(
        service.findById('squad-2', funcionarioUser)
      ).rejects.toThrow(AppError);

      await expect(
        service.findById('squad-2', funcionarioUser)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw 404 when squad not found', async () => {
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(null);

      await expect(
        service.findById('invalid-id', adminUser)
      ).rejects.toThrow(AppError);

      await expect(
        service.findById('invalid-id', adminUser)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // addFuncionario
  // ═══════════════════════════════════════════════════════════

  describe('addFuncionario', () => {
    it('should add funcionário to squad when admin master', async () => {
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockUserRepository.findById.mockResolvedValue(mockFuncionario as any);
      mockUserRepository.save.mockResolvedValue({ ...mockFuncionario, squadId: 'squad-1' } as any);

      const result = await service.addFuncionario(
        'squad-1',
        { usuarioId: 'func-2' },
        adminUser
      );

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('func-2');
    });

    it('should add funcionário to squad when funcionário of same squad', async () => {
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockUserRepository.findById.mockResolvedValue(mockFuncionario as any);
      mockUserRepository.save.mockResolvedValue({ ...mockFuncionario, squadId: 'squad-1' } as any);

      const result = await service.addFuncionario(
        'squad-1',
        { usuarioId: 'func-2' },
        funcionarioUser
      );

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('func-2');
    });

    it('should throw 403 when funcionário tries to add to different squad', async () => {
      const otherSquad = { ...mockSquad, id: 'squad-2' };
      mockSquadRepository.findById.mockResolvedValue(otherSquad as any);

      await expect(
        service.addFuncionario('squad-2', { usuarioId: 'func-2' }, funcionarioUser)
      ).rejects.toThrow(AppError);

      await expect(
        service.addFuncionario('squad-2', { usuarioId: 'func-2' }, funcionarioUser)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw 404 when squad not found', async () => {
      mockSquadRepository.findById.mockResolvedValue(null);

      await expect(
        service.addFuncionario('invalid', { usuarioId: 'func-2' }, adminUser)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Squad não encontrada' });
    });

    it('should throw 404 when funcionário not found', async () => {
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.addFuncionario('squad-1', { usuarioId: 'invalid' }, adminUser)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Funcionário não encontrado' });
    });

    it('should throw 400 when user is not FUNCIONARIO role', async () => {
      const adminUserEntity = { ...mockFuncionario, role: UserRole.ADMIN_MASTER };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockUserRepository.findById.mockResolvedValue(adminUserEntity as any);

      await expect(
        service.addFuncionario('squad-1', { usuarioId: 'admin-id' }, adminUser)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Usuário não é um funcionário' });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // removeFuncionario
  // ═══════════════════════════════════════════════════════════

  describe('removeFuncionario', () => {
    it('should remove funcionário from squad when admin master', async () => {
      const funcInSquad = { ...mockFuncionario, squadId: 'squad-1' };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockUserRepository.findById.mockResolvedValue(funcInSquad as any);
      mockUserRepository.updateSquadId.mockResolvedValue(undefined);

      await service.removeFuncionario('squad-1', 'func-2', adminUser);

      expect(mockUserRepository.updateSquadId).toHaveBeenCalledWith('func-2', null);
    });

    it('should remove funcionário from squad when funcionário of same squad', async () => {
      const funcInSquad = { ...mockFuncionario, squadId: 'squad-1' };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockUserRepository.findById.mockResolvedValue(funcInSquad as any);
      mockUserRepository.updateSquadId.mockResolvedValue(undefined);

      await service.removeFuncionario('squad-1', 'func-2', funcionarioUser);

      expect(mockUserRepository.updateSquadId).toHaveBeenCalledWith('func-2', null);
    });

    it('should throw 400 when funcionário tries to remove himself', async () => {
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);

      await expect(
        service.removeFuncionario('squad-1', 'func-id', funcionarioUser)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Não pode remover a si mesmo da squad' });
    });

    it('should throw 403 when funcionário tries to remove from different squad', async () => {
      const otherSquad = { ...mockSquad, id: 'squad-2' };
      mockSquadRepository.findById.mockResolvedValue(otherSquad as any);

      await expect(
        service.removeFuncionario('squad-2', 'func-2', funcionarioUser)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw 404 when funcionário not in squad', async () => {
      const funcInOtherSquad = { ...mockFuncionario, squadId: 'squad-2' };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockUserRepository.findById.mockResolvedValue(funcInOtherSquad as any);

      await expect(
        service.removeFuncionario('squad-1', 'func-2', adminUser)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Funcionário não encontrado nesta squad' });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // addCliente
  // ═══════════════════════════════════════════════════════════

  describe('addCliente', () => {
    it('should add existing cliente to squad when admin master', async () => {
      const updatedCliente = { ...mockCliente, squadId: 'squad-1' };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockClienteRepository.findById
        .mockResolvedValueOnce(mockCliente as any)
        .mockResolvedValueOnce(updatedCliente as any);
      mockClienteRepository.updateSquadId.mockResolvedValue(undefined);

      const result = await service.addCliente(
        'squad-1',
        { clienteId: 'cliente-1' },
        adminUser
      );

      expect(mockClienteRepository.updateSquadId).toHaveBeenCalledWith('cliente-1', 'squad-1');
      expect(result.squadId).toBe('squad-1');
    });

    it('should add existing cliente to squad when funcionário of same squad', async () => {
      const updatedCliente = { ...mockCliente, squadId: 'squad-1' };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockClienteRepository.findById
        .mockResolvedValueOnce(mockCliente as any)
        .mockResolvedValueOnce(updatedCliente as any);
      mockClienteRepository.updateSquadId.mockResolvedValue(undefined);

      const result = await service.addCliente(
        'squad-1',
        { clienteId: 'cliente-1' },
        funcionarioUser
      );

      expect(result.squadId).toBe('squad-1');
    });

    it('should create new cliente when no clienteId provided', async () => {
      const newCliente = {
        nome: 'New Cliente',
        email: 'new@test.com',
        senha: 'senha123'
      };

      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockClienteRepository.findByEmail.mockResolvedValue(null);
      mockClienteRepository.create.mockReturnValue({ ...mockCliente, ...newCliente } as any);
      mockClienteRepository.save.mockResolvedValue({ 
        ...mockCliente, 
        ...newCliente, 
        squadId: 'squad-1' 
      } as any);

      const result = await service.addCliente('squad-1', newCliente, adminUser);

      expect(mockClienteRepository.create).toHaveBeenCalled();
      expect(mockClienteRepository.save).toHaveBeenCalled();
      expect(result.squadId).toBe('squad-1');
    });

    it('should throw 400 when email already exists', async () => {
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockClienteRepository.findByEmail.mockResolvedValue(mockCliente as any);

      await expect(
        service.addCliente('squad-1', {
          nome: 'New Cliente',
          email: 'cliente@test.com',
          senha: 'senha123'
        }, adminUser)
      ).rejects.toMatchObject({ statusCode: 400, message: 'Email já cadastrado' });
    });

    it('should throw 403 when funcionário tries to add to different squad', async () => {
      const otherSquad = { ...mockSquad, id: 'squad-2' };
      mockSquadRepository.findById.mockResolvedValue(otherSquad as any);

      await expect(
        service.addCliente('squad-2', { clienteId: 'cliente-1' }, funcionarioUser)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw 404 when cliente not found', async () => {
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockClienteRepository.findById.mockResolvedValue(null);

      await expect(
        service.addCliente('squad-1', { clienteId: 'invalid' }, adminUser)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Cliente não encontrado' });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // removeCliente
  // ═══════════════════════════════════════════════════════════

  describe('removeCliente', () => {
    it('should remove cliente from squad when admin master', async () => {
      const clienteInSquad = { ...mockCliente, squadId: 'squad-1' };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockClienteRepository.findById.mockResolvedValue(clienteInSquad as any);
      mockClienteRepository.updateSquadId.mockResolvedValue(undefined);

      await service.removeCliente('squad-1', 'cliente-1', adminUser);

      expect(mockClienteRepository.updateSquadId).toHaveBeenCalledWith('cliente-1', null);
    });

    it('should remove cliente from squad when funcionário of same squad', async () => {
      const clienteInSquad = { ...mockCliente, squadId: 'squad-1' };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockClienteRepository.findById.mockResolvedValue(clienteInSquad as any);
      mockClienteRepository.updateSquadId.mockResolvedValue(undefined);

      await service.removeCliente('squad-1', 'cliente-1', funcionarioUser);

      expect(mockClienteRepository.updateSquadId).toHaveBeenCalledWith('cliente-1', null);
    });

    it('should throw 403 when funcionário tries to remove from different squad', async () => {
      const otherSquad = { ...mockSquad, id: 'squad-2' };
      mockSquadRepository.findById.mockResolvedValue(otherSquad as any);

      await expect(
        service.removeCliente('squad-2', 'cliente-1', funcionarioUser)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw 404 when cliente not in squad', async () => {
      const clienteInOtherSquad = { ...mockCliente, squadId: 'squad-2' };
      mockSquadRepository.findById.mockResolvedValue(mockSquad as any);
      mockClienteRepository.findById.mockResolvedValue(clienteInOtherSquad as any);

      await expect(
        service.removeCliente('squad-1', 'cliente-1', adminUser)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Cliente não encontrado nesta squad' });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getMembers
  // ═══════════════════════════════════════════════════════════

  describe('getMembers', () => {
    it('should return squad members when admin master', async () => {
      const squadWithMembers = {
        ...mockSquad,
        funcionarios: [mockFuncionario],
        clientes: [mockCliente]
      };
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(squadWithMembers as any);

      const result = await service.getMembers('squad-1', adminUser);

      expect(result.squad.id).toBe('squad-1');
      expect(result.funcionarios).toHaveLength(1);
      expect(result.clientes).toHaveLength(1);
    });

    it('should return squad members when funcionário of same squad', async () => {
      const squadWithMembers = {
        ...mockSquad,
        funcionarios: [mockFuncionario],
        clientes: [mockCliente]
      };
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(squadWithMembers as any);

      const result = await service.getMembers('squad-1', funcionarioUser);

      expect(result.squad.id).toBe('squad-1');
      expect(result.funcionarios).toHaveLength(1);
    });

    it('should throw 403 when funcionário tries to get members of different squad', async () => {
      const otherSquad = { ...mockSquad, id: 'squad-2' };
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(otherSquad as any);

      await expect(
        service.getMembers('squad-2', funcionarioUser)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should throw 404 when squad not found', async () => {
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(null);

      await expect(
        service.getMembers('invalid', adminUser)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // delete
  // ═══════════════════════════════════════════════════════════

  describe('delete', () => {
    it('should delete empty squad', async () => {
      const emptySquad = { ...mockSquad, funcionarios: [], clientes: [] };
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(emptySquad as any);
      mockSquadRepository.delete.mockResolvedValue(undefined);

      await service.delete('squad-1');

      expect(mockSquadRepository.delete).toHaveBeenCalledWith('squad-1');
    });

    it('should throw 400 when squad has funcionários', async () => {
      const squadWithFuncionarios = { ...mockSquad, funcionarios: [mockFuncionario], clientes: [] };
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(squadWithFuncionarios as any);

      await expect(
        service.delete('squad-1')
      ).rejects.toMatchObject({ 
        statusCode: 400, 
        message: 'Não é possível excluir squad que possui funcionários ou clientes' 
      });
    });

    it('should throw 400 when squad has clientes', async () => {
      const squadWithClientes = { ...mockSquad, funcionarios: [], clientes: [mockCliente] };
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(squadWithClientes as any);

      await expect(
        service.delete('squad-1')
      ).rejects.toMatchObject({ 
        statusCode: 400, 
        message: 'Não é possível excluir squad que possui funcionários ou clientes' 
      });
    });

    it('should throw 404 when squad not found', async () => {
      mockSquadRepository.findByIdWithMembers.mockResolvedValue(null);

      await expect(
        service.delete('invalid')
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
