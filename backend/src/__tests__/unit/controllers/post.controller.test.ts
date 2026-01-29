import { PostController } from '../../../controllers/post.controller';
import { AppDataSource } from '../../../config/data-source';
import { Post, PostStatus } from '../../../entities/Post';
import { Cliente } from '../../../entities/Cliente';
import { UserRole } from '../../../entities/User';

jest.mock('../../../config/data-source');

describe('PostController', () => {
  let postController: PostController;
  let mockRequest: any;
  let mockResponse: any;
  let mockPostRepository: any;
  let mockClienteRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    postController = new PostController();
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockPostRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn()
    };

    mockClienteRepository = {
      findOne: jest.fn()
    };

    Object.defineProperty(postController, 'postRepository', {
      get: () => mockPostRepository
    });
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Cliente || entity.name === 'Cliente') {
        return mockClienteRepository;
      }
      return mockPostRepository;
    });
  });

  describe('listPosts', () => {
    it('should return all posts for ADMIN_MASTER', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      };

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await postController.listPosts(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        posts: []
      });
    });

    it('should filter posts by squad for FUNCIONARIO', async () => {
      mockRequest.user = {
        id: 'func-id',
        role: UserRole.FUNCIONARIO,
        squadId: 'squad-1'
      };

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      };

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await postController.listPosts(mockRequest, mockResponse);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('post.squadId = :squadId', { squadId: 'squad-1' });
    });

    it('should filter posts by clienteId for CLIENT', async () => {
      mockRequest.user = {
        id: 'client-id',
        role: UserRole.CLIENT
      };

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      };

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await postController.listPosts(mockRequest, mockResponse);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('post.clienteId = :clienteId', { clienteId: 'client-id' });
    });
  });

  describe('getPost', () => {
    it('should return post by id for ADMIN_MASTER', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'post-1' };

      const post = {
        id: 'post-1',
        imagemUrl: 'https://example.com/image.jpg',
        status: PostStatus.APROVADO,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      mockPostRepository.findOne.mockResolvedValue(post);

      await postController.getPost(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        post: expect.objectContaining({
          id: 'post-1'
        })
      });
    });

    it('should return 404 when post not found', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'nonexistent' };

      mockPostRepository.findOne.mockResolvedValue(null);

      await postController.getPost(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Post não encontrado'
      });
    });

    it('should return 403 when FUNCIONARIO tries to access different squad post', async () => {
      mockRequest.user = {
        id: 'func-id',
        role: UserRole.FUNCIONARIO,
        squadId: 'squad-1'
      };
      mockRequest.params = { id: 'post-1' };

      const post = {
        id: 'post-1',
        squadId: 'squad-2'
      };

      mockPostRepository.findOne.mockResolvedValue(post);

      await postController.getPost(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado'
      });
    });
  });

  describe('createPost', () => {
    it('should create post for CLIENT', async () => {
      mockRequest.user = {
        id: 'client-id',
        role: UserRole.CLIENT,
        squadId: 'squad-1'
      };
      mockRequest.body = {
        imagemUrl: 'https://example.com/image.jpg',
        legenda: 'Test caption'
      };

      const newPost = {
        id: 'new-post-id',
        clienteId: 'client-id',
        squadId: 'squad-1',
        imagemUrl: 'https://example.com/image.jpg',
        legenda: 'Test caption',
        status: PostStatus.NAO_APROVADO,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        dataPostagem: new Date()
      };

      mockPostRepository.save.mockResolvedValue(newPost);

      await postController.createPost(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Post criado com sucesso',
        post: expect.objectContaining({
          id: 'new-post-id'
        })
      });
    });

    it('should create post for client by FUNCIONARIO', async () => {
      mockRequest.user = {
        id: 'func-id',
        role: UserRole.FUNCIONARIO,
        squadId: 'squad-1'
      };
      mockRequest.body = {
        clienteId: 'client-id',
        imagemUrl: 'https://example.com/image.jpg',
        legenda: 'Test caption'
      };

      const cliente = {
        id: 'client-id',
        squadId: 'squad-1'
      };

      mockClienteRepository.findOne.mockResolvedValue(cliente);
      mockPostRepository.save.mockResolvedValue({
        id: 'new-post-id',
        clienteId: 'client-id',
        createdById: 'func-id',
        squadId: 'squad-1'
      });

      await postController.createPost(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when imagemUrl is missing', async () => {
      mockRequest.user = {
        id: 'client-id',
        role: UserRole.CLIENT,
        squadId: 'squad-1'
      };
      mockRequest.body = {
        legenda: 'Test caption'
      };

      await postController.createPost(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'URL da imagem é obrigatória'
      });
    });

    it('should return 400 when imagemUrl is invalid', async () => {
      mockRequest.user = {
        id: 'client-id',
        role: UserRole.CLIENT,
        squadId: 'squad-1'
      };
      mockRequest.body = {
        imagemUrl: 'invalid-url'
      };

      await postController.createPost(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'URL da imagem inválida'
      });
    });

    it('should return 400 when dataAgendada is in the past', async () => {
      mockRequest.user = {
        id: 'client-id',
        role: UserRole.CLIENT,
        squadId: 'squad-1'
      };
      mockRequest.body = {
        imagemUrl: 'https://example.com/image.jpg',
        dataAgendada: new Date(Date.now() - 86400000).toISOString()
      };

      await postController.createPost(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Data agendada deve ser futura'
      });
    });
  });

  describe('updatePostStatus', () => {
    it('should update post status successfully', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'post-1' };
      mockRequest.body = {
        status: PostStatus.APROVADO
      };

      const post = {
        id: 'post-1',
        status: PostStatus.NAO_APROVADO,
        squadId: 'squad-1',
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };

      mockPostRepository.findOne.mockResolvedValue(post);
      mockPostRepository.save.mockResolvedValue({
        ...post,
        status: PostStatus.APROVADO
      });

      await postController.updatePostStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Status atualizado com sucesso',
        post: expect.objectContaining({
          status: PostStatus.APROVADO
        })
      });
    });

    it('should return 400 when status is invalid', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { id: 'post-1' };
      mockRequest.body = {
        status: 'INVALID_STATUS'
      };

      await postController.updatePostStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Status inválido'
      });
    });

    it('should return 400 when cliente rejects without comment', async () => {
      mockRequest.user = {
        id: 'cliente-id',
        role: UserRole.CLIENT
      };
      mockRequest.params = { id: 'post-1' };
      mockRequest.body = {
        status: PostStatus.NAO_APROVADO
      };

      await postController.updatePostStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Comentário do cliente é obrigatório ao reprovar'
      });
    });

    it('should return 403 when FUNCIONARIO tries to update different squad post', async () => {
      mockRequest.user = {
        id: 'func-id',
        role: UserRole.FUNCIONARIO,
        squadId: 'squad-1'
      };
      mockRequest.params = { id: 'post-1' };
      mockRequest.body = {
        status: PostStatus.APROVADO
      };

      const post = {
        id: 'post-1',
        squadId: 'squad-2'
      };

      mockPostRepository.findOne.mockResolvedValue(post);

      await postController.updatePostStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado'
      });
    });
  });

  describe('getCalendarPosts', () => {
    it('should return calendar posts for valid month', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { year: '2024', month: '12' };

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([])
      };

      mockPostRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await postController.getCalendarPosts(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        posts: []
      });
    });

    it('should return 400 for invalid month', async () => {
      mockRequest.user = {
        id: 'admin-id',
        role: UserRole.ADMIN_MASTER
      };
      mockRequest.params = { year: '2024', month: '13' };

      await postController.getCalendarPosts(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Parâmetros de ano e mês inválidos'
      });
    });
  });
});
