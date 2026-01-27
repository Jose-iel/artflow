import { SquadController } from '../../../controllers/squad.controller';
import { ISquadService } from '../../../interfaces/squad-service.interface';
import { UserRole } from '../../../entities/User';

describe('SquadController', () => {
  let squadController: SquadController;
  let mockSquadService: jest.Mocked<ISquadService>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSquadService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addFuncionario: jest.fn(),
      removeFuncionario: jest.fn(),
      addCliente: jest.fn(),
      removeCliente: jest.fn(),
      getMembers: jest.fn()
    };

    squadController = new SquadController(mockSquadService);
    
    mockRequest = {
      body: {},
      params: {},
      user: {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getAll', () => {
    it('should return all squads', async () => {
      const squads = [
        { id: 'squad-1', nome: 'Squad 1' },
        { id: 'squad-2', nome: 'Squad 2' }
      ];

      mockSquadService.findAll.mockResolvedValue(squads as any);

      await squadController.getAll(mockRequest, mockResponse);

      expect(mockSquadService.findAll).toHaveBeenCalledWith(mockRequest.user);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: squads
      });
    });
  });

  describe('getById', () => {
    it('should return squad by id', async () => {
      mockRequest.params = { id: 'squad-1' };

      const squad = {
        id: 'squad-1',
        nome: 'Squad 1'
      };

      mockSquadService.findById.mockResolvedValue(squad as any);

      await squadController.getById(mockRequest, mockResponse);

      expect(mockSquadService.findById).toHaveBeenCalledWith('squad-1', mockRequest.user);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: squad
      });
    });
  });

  describe('create', () => {
    it('should create squad successfully', async () => {
      mockRequest.body = {
        nome: 'New Squad',
        descricao: 'Description',
        empresaId: 'empresa-1'
      };

      const newSquad = {
        id: 'new-squad-id',
        nome: 'New Squad',
        descricao: 'Description',
        empresaId: 'empresa-1'
      };

      mockSquadService.create.mockResolvedValue(newSquad as any);

      await squadController.create(mockRequest, mockResponse);

      expect(mockSquadService.create).toHaveBeenCalledWith('New Squad', 'Description', 'empresa-1');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: newSquad
      });
    });
  });

  describe('update', () => {
    it('should update squad successfully', async () => {
      mockRequest.params = { id: 'squad-1' };
      mockRequest.body = {
        nome: 'Updated Squad',
        descricao: 'Updated description',
        ativo: true
      };

      const updatedSquad = {
        id: 'squad-1',
        nome: 'Updated Squad',
        descricao: 'Updated description',
        ativo: true
      };

      mockSquadService.update.mockResolvedValue(updatedSquad as any);

      await squadController.update(mockRequest, mockResponse);

      expect(mockSquadService.update).toHaveBeenCalledWith('squad-1', {
        nome: 'Updated Squad',
        descricao: 'Updated description',
        ativo: true
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: updatedSquad
      });
    });
  });

  describe('delete', () => {
    it('should delete squad successfully', async () => {
      mockRequest.params = { id: 'squad-1' };

      mockSquadService.delete.mockResolvedValue(undefined);

      await squadController.delete(mockRequest, mockResponse);

      expect(mockSquadService.delete).toHaveBeenCalledWith('squad-1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Squad excluída com sucesso'
      });
    });
  });

  describe('addFuncionario', () => {
    it('should add funcionario to squad successfully', async () => {
      mockRequest.params = { id: 'squad-1' };
      mockRequest.body = {
        usuarioId: 'user-1'
      };

      const funcionario = {
        id: 'user-1',
        nome: 'Funcionario 1'
      };

      mockSquadService.addFuncionario.mockResolvedValue(funcionario as any);

      await squadController.addFuncionario(mockRequest, mockResponse);

      expect(mockSquadService.addFuncionario).toHaveBeenCalledWith(
        'squad-1',
        { usuarioId: 'user-1' },
        mockRequest.user
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Funcionário adicionado à squad com sucesso',
        data: {
          squadId: 'squad-1',
          usuarioId: 'user-1',
          usuarioNome: 'Funcionario 1'
        }
      });
    });
  });

  describe('removeFuncionario', () => {
    it('should remove funcionario from squad successfully', async () => {
      mockRequest.params = {
        id: 'squad-1',
        usuarioId: 'user-1'
      };

      mockSquadService.removeFuncionario.mockResolvedValue(undefined);

      await squadController.removeFuncionario(mockRequest, mockResponse);

      expect(mockSquadService.removeFuncionario).toHaveBeenCalledWith(
        'squad-1',
        'user-1',
        mockRequest.user
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Funcionário removido da squad com sucesso'
      });
    });
  });

  describe('addCliente', () => {
    it('should add cliente to squad successfully', async () => {
      mockRequest.params = { id: 'squad-1' };
      mockRequest.body = {
        clienteId: 'client-1'
      };

      const cliente = {
        id: 'client-1',
        nome: 'Cliente 1',
        email: 'client@example.com',
        squadId: 'squad-1'
      };

      mockSquadService.addCliente.mockResolvedValue(cliente as any);

      await squadController.addCliente(mockRequest, mockResponse);

      expect(mockSquadService.addCliente).toHaveBeenCalledWith(
        'squad-1',
        { clienteId: 'client-1' },
        mockRequest.user
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Cliente adicionado à squad com sucesso',
        data: {
          id: 'client-1',
          nome: 'Cliente 1',
          email: 'client@example.com',
          squadId: 'squad-1'
        }
      });
    });

    it('should create new cliente when creating', async () => {
      mockRequest.params = { id: 'squad-1' };
      mockRequest.body = {
        nome: 'New Cliente',
        email: 'new@example.com',
        senha: 'password123'
      };

      const newCliente = {
        id: 'new-client-id',
        nome: 'New Cliente',
        email: 'new@example.com',
        squadId: 'squad-1'
      };

      mockSquadService.addCliente.mockResolvedValue(newCliente as any);

      await squadController.addCliente(mockRequest, mockResponse);

      expect(mockSquadService.addCliente).toHaveBeenCalledWith(
        'squad-1',
        {
          nome: 'New Cliente',
          email: 'new@example.com',
          senha: 'password123'
        },
        mockRequest.user
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('removeCliente', () => {
    it('should remove cliente from squad successfully', async () => {
      mockRequest.params = {
        id: 'squad-1',
        clienteId: 'client-1'
      };

      mockSquadService.removeCliente.mockResolvedValue(undefined);

      await squadController.removeCliente(mockRequest, mockResponse);

      expect(mockSquadService.removeCliente).toHaveBeenCalledWith(
        'squad-1',
        'client-1',
        mockRequest.user
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Cliente removido da squad com sucesso'
      });
    });
  });

  describe('getMembers', () => {
    it('should return squad members', async () => {
      mockRequest.params = { id: 'squad-1' };

      const members = {
        squad: {
          id: 'squad-1',
          nome: 'Squad 1'
        },
        funcionarios: [
          { id: 'user-1', nome: 'User 1', email: 'user1@example.com' }
        ],
        clientes: [
          { id: 'client-1', nome: 'Client 1', email: 'client1@example.com' }
        ]
      };

      mockSquadService.getMembers.mockResolvedValue(members);

      await squadController.getMembers(mockRequest, mockResponse);

      expect(mockSquadService.getMembers).toHaveBeenCalledWith('squad-1', mockRequest.user);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: members
      });
    });
  });

  describe('getStatistics', () => {
    it('should return squad statistics', async () => {
      mockRequest.params = { id: 'squad-1' };

      const members = {
        squad: {
          id: 'squad-1',
          nome: 'Squad 1'
        },
        funcionarios: [
          { id: 'user-1', nome: 'User 1', email: 'user1@example.com' },
          { id: 'user-2', nome: 'User 2', email: 'user2@example.com' }
        ],
        clientes: [
          { id: 'client-1', nome: 'Client 1', email: 'client1@example.com' }
        ]
      };

      mockSquadService.getMembers.mockResolvedValue(members);

      await squadController.getStatistics(mockRequest, mockResponse);

      expect(mockSquadService.getMembers).toHaveBeenCalledWith('squad-1', mockRequest.user);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          squad: {
            id: 'squad-1',
            nome: 'Squad 1'
          },
          totalFuncionarios: 2,
          totalClientes: 1
        }
      });
    });
  });
});
