import { EmpresaController } from '../../../controllers/empresa.controller';
import { AppDataSource } from '../../../config/data-source';
import { Empresa } from '../../../entities/Empresa';
import { Squad } from '../../../entities/Squad';
import { UserRole } from '../../../entities/User';

jest.mock('../../../config/data-source');

describe('EmpresaController', () => {
  let empresaController: EmpresaController;
  let mockRequest: any;
  let mockResponse: any;
  let mockEmpresaRepository: any;
  let mockSquadRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    empresaController = new EmpresaController();
    
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

    mockEmpresaRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn()
    };

    mockSquadRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn()
    };

    Object.defineProperty(empresaController, 'empresaRepository', {
      get: () => mockEmpresaRepository
    });
    Object.defineProperty(empresaController, 'squadRepository', {
      get: () => mockSquadRepository
    });
  });

  describe('getAll', () => {
    it('should return all empresas', async () => {
      const empresas = [
        { id: 'empresa-1', nome: 'Empresa 1', squads: [] },
        { id: 'empresa-2', nome: 'Empresa 2', squads: [] }
      ];

      mockEmpresaRepository.find.mockResolvedValue(empresas);

      await empresaController.getAll(mockRequest, mockResponse);

      expect(mockEmpresaRepository.find).toHaveBeenCalledWith({
        relations: ['squads'],
        order: { criadoEm: 'DESC' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: empresas
      });
    });
  });

  describe('getById', () => {
    it('should return empresa by id', async () => {
      mockRequest.params = { id: 'empresa-1' };

      const empresa = {
        id: 'empresa-1',
        nome: 'Empresa 1',
        squads: []
      };

      mockEmpresaRepository.findOne.mockResolvedValue(empresa);

      await empresaController.getById(mockRequest, mockResponse);

      expect(mockEmpresaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'empresa-1' },
        relations: ['squads', 'squads.funcionarios', 'squads.clientes']
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: empresa
      });
    });

    it('should return 404 when empresa not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      mockEmpresaRepository.findOne.mockResolvedValue(null);

      await empresaController.getById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    });
  });

  describe('create', () => {
    it('should create empresa successfully', async () => {
      mockRequest.body = {
        nome: 'Nova Empresa',
        cnpj: '12345678901234',
        descricao: 'Descrição'
      };

      const newEmpresa = {
        id: 'new-empresa-id',
        nome: 'Nova Empresa',
        cnpj: '12345678901234',
        descricao: 'Descrição'
      };

      mockEmpresaRepository.findOne.mockResolvedValue(null);
      mockEmpresaRepository.create.mockReturnValue(newEmpresa);
      mockEmpresaRepository.save.mockResolvedValue(newEmpresa);

      await empresaController.create(mockRequest, mockResponse);

      expect(mockEmpresaRepository.findOne).toHaveBeenCalledWith({
        where: { cnpj: '12345678901234' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: newEmpresa
      });
    });

    it('should return 400 when CNPJ already exists', async () => {
      mockRequest.body = {
        nome: 'Nova Empresa',
        cnpj: '12345678901234',
        descricao: 'Descrição'
      };

      mockEmpresaRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await empresaController.create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'CNPJ já cadastrado'
      });
    });
  });

  describe('update', () => {
    it('should update empresa successfully', async () => {
      mockRequest.params = { id: 'empresa-1' };
      mockRequest.body = {
        nome: 'Empresa Atualizada'
      };

      const empresa = {
        id: 'empresa-1',
        nome: 'Empresa Original',
        cnpj: '12345678901234'
      };

      mockEmpresaRepository.findOne.mockResolvedValue(empresa);
      mockEmpresaRepository.save.mockResolvedValue({
        ...empresa,
        nome: 'Empresa Atualizada'
      });

      await empresaController.update(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          nome: 'Empresa Atualizada'
        })
      });
    });

    it('should return 404 when empresa not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { nome: 'Updated' };

      mockEmpresaRepository.findOne.mockResolvedValue(null);

      await empresaController.update(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    });

    it('should return 400 when updating to existing CNPJ', async () => {
      mockRequest.params = { id: 'empresa-1' };
      mockRequest.body = {
        cnpj: '98765432109876'
      };

      const empresa = {
        id: 'empresa-1',
        cnpj: '12345678901234'
      };

      mockEmpresaRepository.findOne
        .mockResolvedValueOnce(empresa)
        .mockResolvedValueOnce({ id: 'other-empresa' });

      await empresaController.update(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'CNPJ já cadastrado'
      });
    });
  });

  describe('delete', () => {
    it('should delete empresa successfully', async () => {
      mockRequest.params = { id: 'empresa-1' };

      const empresa = {
        id: 'empresa-1',
        squads: []
      };

      mockEmpresaRepository.findOne.mockResolvedValue(empresa);
      mockEmpresaRepository.remove.mockResolvedValue(empresa);

      await empresaController.delete(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Empresa excluída com sucesso'
      });
    });

    it('should return 404 when empresa not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      mockEmpresaRepository.findOne.mockResolvedValue(null);

      await empresaController.delete(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    });

    it('should return 400 when empresa has squads', async () => {
      mockRequest.params = { id: 'empresa-1' };

      const empresa = {
        id: 'empresa-1',
        squads: [{ id: 'squad-1' }]
      };

      mockEmpresaRepository.findOne.mockResolvedValue(empresa);

      await empresaController.delete(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Não é possível excluir empresa que possui squads'
      });
    });
  });

  describe('getStatistics', () => {
    it('should return empresa statistics', async () => {
      mockRequest.params = { id: 'empresa-1' };

      const empresa = {
        id: 'empresa-1',
        nome: 'Empresa 1',
        squads: [
          { id: 'squad-1' },
          { id: 'squad-2' }
        ]
      };

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn()
      };

      mockEmpresaRepository.findOne.mockResolvedValue(empresa);
      mockSquadRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ count: '5' })
        .mockResolvedValueOnce({ count: '10' });

      await empresaController.getStatistics(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          empresa: {
            id: 'empresa-1',
            nome: 'Empresa 1',
            totalSquads: 2,
            totalFuncionarios: 5,
            totalClientes: 10
          }
        }
      });
    });

    it('should return 404 when empresa not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      mockEmpresaRepository.findOne.mockResolvedValue(null);

      await empresaController.getStatistics(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    });
  });
});
