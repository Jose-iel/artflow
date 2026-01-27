import { AdminController } from '../../controllers/admin.controller';
import { AppDataSource } from '../../config/data-source';
import { Cliente } from '../../entities/Cliente';
import { UserRole } from '../../entities/User';
import { Post, PostStatus } from '../../entities/Post';
import { AuthRequest } from '../../middlewares/auth';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../config/data-source');
jest.mock('bcrypt');

describe('AdminController', () => {
  let adminController: AdminController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: any;
  let mockClienteRepository: any;
  let mockPostRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    adminController = new AdminController();
    
    mockRequest = {
      user: {
        id: 'admin-id',
        email: 'admin@test.com',
        role: UserRole.ADMIN_MASTER,
        squadId: 'mock-squad-id'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock repositories
    mockClienteRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn()
    };

    mockPostRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn()
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Cliente) {
        return mockClienteRepository;
      } else if (entity === Post) {
        return mockPostRepository;
      }
      return null;
    });

    // Mock bcrypt
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  describe('createClient', () => {
    it('should create a new client successfully', async () => {
      // Arrange
      mockRequest.body = {
        nome: 'Test Client',
        email: 'client@test.com',
        senha: 'password123'
      };

      const newClient = {
        id: 'client-id',
        nome: 'Test Client',
        email: 'client@test.com',
        senha: 'hashed-password',
        ativo: true,
        squadId: 'mock-squad-id',
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      mockClienteRepository.findOne.mockResolvedValue(null);
      mockClienteRepository.create.mockReturnValue(newClient);
      mockClienteRepository.save.mockResolvedValue(newClient);

      // Act
      await adminController.createClient(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 8);
      expect(mockClienteRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'client@test.com' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return error when nome is empty', async () => {
      // Arrange
      mockRequest.body = {
        nome: '',
        email: 'client@test.com',
        senha: 'password123'
      };

      // Act
      await adminController.createClient(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Nome é obrigatório'
      });
    });

    it('should return error when email is invalid', async () => {
      // Arrange
      mockRequest.body = {
        nome: 'Test Client',
        email: 'invalid-email',
        senha: 'password123'
      };

      // Act
      await adminController.createClient(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email inválido'
      });
    });

    it('should return error when senha is too short', async () => {
      // Arrange
      mockRequest.body = {
        nome: 'Test Client',
        email: 'client@test.com',
        senha: '123'
      };

      // Act
      await adminController.createClient(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Senha deve ter pelo menos 8 caracteres'
      });
    });

    it('should return error when email already exists', async () => {
      // Arrange
      mockRequest.body = {
        nome: 'Test Client',
        email: 'existing@test.com',
        senha: 'password123'
      };

      mockClienteRepository.findOne.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@test.com'
      });

      // Act
      await adminController.createClient(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email já cadastrado'
      });
    });
  });

  describe('listUsers', () => {
    it('should list all users successfully', async () => {
      // Arrange
      const users = [
        {
          id: 'user-1',
          nome: 'User 1',
          email: 'user1@test.com',
          ativo: true,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        },
        {
          id: 'user-2',
          nome: 'User 2',
          email: 'user2@test.com',
          ativo: true,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        }
      ];

      mockClienteRepository.find.mockResolvedValue(users);

      // Act
      await adminController.listUsers(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockClienteRepository.find).toHaveBeenCalledWith({
        select: ['id', 'nome', 'email', 'ativo', 'criadoEm', 'atualizadoEm'],
        order: { criadoEm: 'DESC' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        usuarios: users
      });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'user-to-deactivate' };

      const userToDeactivate = {
        id: 'user-to-deactivate',
        nome: 'User To Deactivate',
        email: 'user@test.com',
        ativo: true
      };

      mockClienteRepository.findOne.mockResolvedValue(userToDeactivate);
      mockClienteRepository.count.mockResolvedValue(2); // More than 1 active user
      mockClienteRepository.save.mockResolvedValue({ ...userToDeactivate, ativo: false });

      // Act
      await adminController.deactivateUser(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockClienteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-to-deactivate' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Usuário desativado com sucesso'
      });
    });

    it('should return error when user not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockClienteRepository.findOne.mockResolvedValue(null);

      // Act
      await adminController.deactivateUser(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    });

    it('should prevent deactivating yourself', async () => {
      // Arrange
      mockRequest.params = { id: 'admin-id' };

      const selfUser = {
        id: 'admin-id',
        ativo: true
      };

      mockClienteRepository.findOne.mockResolvedValue(selfUser);

      // Act
      await adminController.deactivateUser(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Não pode desativar seu próprio usuário'
      });
    });

    it('should prevent deactivating last active user', async () => {
      // Arrange
      mockRequest.params = { id: 'last-user' };

      const lastUser = {
        id: 'last-user',
        ativo: true
      };

      mockClienteRepository.findOne.mockResolvedValue(lastUser);
      mockClienteRepository.count.mockResolvedValue(1); // Only 1 active user

      // Act
      await adminController.deactivateUser(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockClienteRepository.count).toHaveBeenCalledWith({
        where: { ativo: true }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Não pode desativar o último usuário ativo'
      });
    });
  });

  describe('createPostForClient', () => {
    it('should create post for client successfully', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      mockRequest.body = {
        clienteId: 'client-id',
        imagemUrl: 'https://example.com/image.jpg',
        legenda: 'Test caption',
        dataAgendada: futureDate
      };

      const client = {
        id: 'client-id',
        nome: 'Test Client',
        email: 'client@test.com',
        ativo: true,
        squadId: 'client-squad-id'
      };

      const newPost = {
        id: 'post-id',
        clienteId: 'client-id',
        createdById: 'admin-id',
        imagemUrl: 'https://example.com/image.jpg',
        legenda: 'Test caption',
        dataAgendada: futureDate,
        status: PostStatus.NAO_APROVADO,
        squadId: 'client-squad-id'
      };

      mockClienteRepository.findOne.mockResolvedValue(client);
      mockPostRepository.create.mockReturnValue(newPost);
      mockPostRepository.save.mockResolvedValue(newPost);

      // Act
      await adminController.createPostForClient(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockClienteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'client-id', ativo: true }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return error when client not found', async () => {
      // Arrange
      mockRequest.body = {
        clienteId: 'non-existent',
        imagemUrl: 'https://example.com/image.jpg'
      };

      mockClienteRepository.findOne.mockResolvedValue(null);

      // Act
      await adminController.createPostForClient(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Cliente não encontrado ou inativo'
      });
    });

    it('should return error when imagemUrl is invalid', async () => {
      // Arrange
      mockRequest.body = {
        clienteId: 'client-id',
        imagemUrl: 'invalid-url'
      };

      // Act
      await adminController.createPostForClient(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'URL da imagem inválida'
      });
    });
  });

  describe('getDashboardPosts', () => {
    it('should get dashboard posts successfully', async () => {
      // Arrange
      mockRequest.query = { status: PostStatus.NAO_APROVADO };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      await adminController.getDashboardPosts(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockPostRepository.createQueryBuilder).toHaveBeenCalledWith('post');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.status = :status', {
        status: PostStatus.NAO_APROVADO
      });
    });

    it('should filter posts by clienteId when provided', async () => {
      // Arrange
      mockRequest.query = { clienteId: 'client-id' };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0])
      };

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      await adminController.getDashboardPosts(mockRequest as AuthRequest, mockResponse);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('post.clienteId = :clienteId', {
        clienteId: 'client-id'
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.body = {
        nome: 'Updated Name',
        email: 'updated@test.com'
      };

      const user = {
        id: 'user-1',
        nome: 'Old Name',
        email: 'old@test.com',
        ativo: true
      };

      mockClienteRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);
      mockClienteRepository.save.mockResolvedValue({
        ...user,
        nome: 'Updated Name',
        email: 'updated@test.com',
        senha: 'hashed'
      });

      await adminController.updateUser(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        usuario: expect.objectContaining({
          nome: 'Updated Name',
          email: 'updated@test.com'
        })
      });
    });

    it('should return 404 when user not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { nome: 'Updated' };

      mockClienteRepository.findOne.mockResolvedValue(null);

      await adminController.updateUser(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    });

    it('should prevent user from deactivating themselves', async () => {
      mockRequest.params = { id: 'admin-id' };
      mockRequest.body = { ativo: false };

      const user = {
        id: 'admin-id',
        ativo: true
      };

      mockClienteRepository.findOne.mockResolvedValue(user);

      await adminController.updateUser(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Não pode desativar seu próprio usuário'
      });
    });

    it('should return 400 when email is invalid', async () => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.body = { email: 'invalid-email' };

      const user = { id: 'user-1', ativo: true };
      mockClienteRepository.findOne.mockResolvedValue(user);

      await adminController.updateUser(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email inválido'
      });
    });

    it('should return 400 when email already exists', async () => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.body = { email: 'existing@test.com' };

      const user = { id: 'user-1', email: 'old@test.com', ativo: true };
      mockClienteRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ id: 'other-user' });

      await adminController.updateUser(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email já cadastrado'
      });
    });
  });

  describe('updatePostStatus', () => {
    it('should update post status successfully', async () => {
      mockRequest.params = { id: 'post-1' };
      mockRequest.body = { status: 'Aprovado' };

      const post = {
        id: 'post-1',
        status: 'Não aprovado',
        cliente: { nome: 'Cliente' },
        createdBy: null
      };

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.save.mockResolvedValue({
        ...post,
        status: 'Aprovado'
      });

      await adminController.updatePostStatus(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Status do post atualizado com sucesso',
        post: expect.objectContaining({
          status: 'Aprovado'
        })
      });
    });

    it('should return 404 when post not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { status: 'Aprovado' };

      mockPostRepository.findOne.mockResolvedValue(null);

      await adminController.updatePostStatus(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Post não encontrado'
      });
    });
  });

  describe('updatePost', () => {
    it('should update post successfully', async () => {
      mockRequest.params = { id: 'post-1' };
      mockRequest.body = {
        imagemUrl: 'https://example.com/new-image.jpg',
        legenda: 'Updated caption'
      };

      const post = {
        id: 'post-1',
        imagemUrl: 'https://example.com/old-image.jpg',
        legenda: 'Old caption',
        cliente: { nome: 'Cliente' },
        createdBy: null
      };

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.save.mockResolvedValue({
        ...post,
        imagemUrl: 'https://example.com/new-image.jpg',
        legenda: 'Updated caption'
      });

      await adminController.updatePost(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Post atualizado com sucesso',
        post: expect.objectContaining({
          imagemUrl: 'https://example.com/new-image.jpg',
          legenda: 'Updated caption'
        })
      });
    });

    it('should return 404 when post not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { legenda: 'Updated' };

      mockPostRepository.findOne.mockResolvedValue(null);

      await adminController.updatePost(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Post não encontrado'
      });
    });
  });

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      mockRequest.params = { id: 'post-1' };

      const post = {
        id: 'post-1',
        cliente: { nome: 'Cliente' }
      };

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.delete.mockResolvedValue({ affected: 1 });

      await adminController.deletePost(mockRequest as AuthRequest, mockResponse);

      expect(mockPostRepository.delete).toHaveBeenCalledWith('post-1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Post deletado com sucesso'
      });
    });

    it('should return 404 when post not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      mockPostRepository.findOne.mockResolvedValue(null);

      await adminController.deletePost(mockRequest as AuthRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Post não encontrado'
      });
    });
  });
});
