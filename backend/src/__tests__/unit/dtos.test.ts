import {
  CreateClienteDto,
  ClienteResponseDto,
  LoginDto,
  LoginResponseDto
} from '../../dtos/cliente.dto';
import {
  CreatePostDto,
  UpdatePostStatusDto,
  PostResponseDto,
  PostListResponseDto,
  CalendarPostResponseDto
} from '../../dtos/post.dto';

describe('DTOs', () => {
  describe('Cliente DTOs', () => {
    describe('CreateClienteDto', () => {
      it('should create valid CreateClienteDto', () => {
        // Arrange
        const clienteData = {
          nome: 'Test User',
          email: 'test@example.com',
          senha: 'password123'
        };

        // Act
        const dto = new CreateClienteDto();
        Object.assign(dto, clienteData);

        // Assert
        expect(dto.nome).toBe('Test User');
        expect(dto.email).toBe('test@example.com');
        expect(dto.senha).toBe('password123');
      });
    });

    describe('ClienteResponseDto', () => {
      it('should create valid ClienteResponseDto', () => {
        // Arrange
        const clienteResponse = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test User',
          email: 'test@example.com',
          active: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        };

        // Act
        const dto = new ClienteResponseDto();
        Object.assign(dto, clienteResponse);

        // Assert
        expect(dto.id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(dto.name).toBe('Test User');
        expect(dto.email).toBe('test@example.com');
        expect(dto.active).toBe(true);
        expect(dto.createdAt).toEqual(new Date('2023-01-01'));
        expect(dto.updatedAt).toEqual(new Date('2023-01-01'));
      });
    });

    describe('LoginDto', () => {
      it('should create valid LoginDto', () => {
        // Arrange
        const loginData = {
          email: 'test@example.com',
          senha: 'password123'
        };

        // Act
        const dto = new LoginDto();
        Object.assign(dto, loginData);

        // Assert
        expect(dto.email).toBe('test@example.com');
        expect(dto.senha).toBe('password123');
      });
    });

    describe('LoginResponseDto', () => {
      it('should create valid LoginResponseDto', () => {
        // Arrange
        const clienteResponse = new ClienteResponseDto();
        Object.assign(clienteResponse, {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test User',
          email: 'test@example.com',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        const loginResponse = {
          message: 'Login successful',
          token: 'jwt-token-here',
          cliente: clienteResponse
        };

        // Act
        const dto = new LoginResponseDto();
        Object.assign(dto, loginResponse);

        // Assert
        expect(dto.message).toBe('Login successful');
        expect(dto.token).toBe('jwt-token-here');
        expect(dto.cliente).toEqual(clienteResponse);
      });
    });
  });

  describe('Post DTOs', () => {
    describe('CreatePostDto', () => {
      it('should create valid CreatePostDto with all fields', () => {
        // Arrange
        const postData = {
          imagemUrl: 'https://example.com/image.jpg',
          legenda: 'Test caption',
          dataAgendada: '2023-12-01T10:00:00Z'
        };

        // Act
        const dto = new CreatePostDto();
        Object.assign(dto, postData);

        // Assert
        expect(dto.imagemUrl).toBe('https://example.com/image.jpg');
        expect(dto.legenda).toBe('Test caption');
        expect(dto.dataAgendada).toBe('2023-12-01T10:00:00Z');
      });

      it('should create valid CreatePostDto with only required fields', () => {
        // Arrange
        const postData = {
          imagemUrl: 'https://example.com/image.jpg'
        };

        // Act
        const dto = new CreatePostDto();
        Object.assign(dto, postData);

        // Assert
        expect(dto.imagemUrl).toBe('https://example.com/image.jpg');
        expect(dto.legenda).toBeUndefined();
        expect(dto.dataAgendada).toBeUndefined();
      });
    });

    describe('UpdatePostStatusDto', () => {
      it('should create valid UpdatePostStatusDto with all fields', () => {
        // Arrange
        const statusData = {
          status: 'Aprovado' as const,
          comentarioCliente: 'Client comment',
          comentarioAdmin: 'Admin comment'
        };

        // Act
        const dto = new UpdatePostStatusDto();
        Object.assign(dto, statusData);

        // Assert
        expect(dto.status).toBe('Aprovado');
        expect(dto.comentarioCliente).toBe('Client comment');
        expect(dto.comentarioAdmin).toBe('Admin comment');
      });

      it('should create valid UpdatePostStatusDto with only status', () => {
        // Arrange
        const statusData = {
          status: 'Não aprovado' as const
        };

        // Act
        const dto = new UpdatePostStatusDto();
        Object.assign(dto, statusData);

        // Assert
        expect(dto.status).toBe('Não aprovado');
        expect(dto.comentarioCliente).toBeUndefined();
        expect(dto.comentarioAdmin).toBeUndefined();
      });

      it('should accept all valid status values', () => {
        const validStatuses = ['Aprovado', 'Não aprovado', 'Alteração', 'Agendado', 'Publicado'] as const;

        validStatuses.forEach(status => {
          // Act
          const dto = new UpdatePostStatusDto();
          Object.assign(dto, { status });

          // Assert
          expect(dto.status).toBe(status);
        });
      });
    });

    describe('PostResponseDto', () => {
      it('should create valid PostResponseDto', () => {
        // Arrange
        const postResponse = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          imagemUrl: 'https://example.com/image.jpg',
          legenda: 'Test caption',
          dataAgendada: '2023-12-01T10:00:00Z',
          status: 'Aprovado',
          comentarioCliente: 'Client comment',
          comentarioAdmin: 'Admin comment',
          criadoEm: '2023-01-01T10:00:00Z',
          atualizadoEm: '2023-01-01T10:00:00Z'
        };

        // Act
        const dto = new PostResponseDto();
        Object.assign(dto, postResponse);

        // Assert
        expect(dto.id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(dto.imagemUrl).toBe('https://example.com/image.jpg');
        expect(dto.legenda).toBe('Test caption');
        expect(dto.dataAgendada).toBe('2023-12-01T10:00:00Z');
        expect(dto.status).toBe('Aprovado');
        expect(dto.comentarioCliente).toBe('Client comment');
        expect(dto.comentarioAdmin).toBe('Admin comment');
        expect(dto.criadoEm).toBe('2023-01-01T10:00:00Z');
        expect(dto.atualizadoEm).toBe('2023-01-01T10:00:00Z');
      });

      it('should handle null values for optional fields', () => {
        // Arrange
        const postResponse = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          imagemUrl: 'https://example.com/image.jpg',
          legenda: null,
          dataAgendada: null,
          status: 'Não aprovado',
          comentarioCliente: null,
          comentarioAdmin: null,
          criadoEm: '2023-01-01T10:00:00Z',
          atualizadoEm: '2023-01-01T10:00:00Z'
        };

        // Act
        const dto = new PostResponseDto();
        Object.assign(dto, postResponse);

        // Assert
        expect(dto.legenda).toBeNull();
        expect(dto.dataAgendada).toBeNull();
        expect(dto.comentarioCliente).toBeNull();
        expect(dto.comentarioAdmin).toBeNull();
      });
    });

    describe('PostListResponseDto', () => {
      it('should create valid PostListResponseDto', () => {
        // Arrange
        const post1 = new PostResponseDto();
        Object.assign(post1, {
          id: '123e4567-e89b-12d3-a456-426614174000',
          imagemUrl: 'https://example.com/image1.jpg',
          legenda: 'Post 1',
          dataAgendada: null,
          status: 'Aprovado',
          comentarioCliente: null,
          comentarioAdmin: null,
          criadoEm: '2023-01-01T10:00:00Z',
          atualizadoEm: '2023-01-01T10:00:00Z'
        });

        const post2 = new PostResponseDto();
        Object.assign(post2, {
          id: '123e4567-e89b-12d3-a456-426614174001',
          imagemUrl: 'https://example.com/image2.jpg',
          legenda: 'Post 2',
          dataAgendada: null,
          status: 'Não aprovado',
          comentarioCliente: null,
          comentarioAdmin: null,
          criadoEm: '2023-01-01T10:00:00Z',
          atualizadoEm: '2023-01-01T10:00:00Z'
        });

        const listData = {
          posts: [post1, post2]
        };

        // Act
        const dto = new PostListResponseDto();
        Object.assign(dto, listData);

        // Assert
        expect(dto.posts).toHaveLength(2);
        expect(dto.posts[0]).toEqual(post1);
        expect(dto.posts[1]).toEqual(post2);
      });

      it('should create empty PostListResponseDto', () => {
        // Arrange
        const listData = {
          posts: []
        };

        // Act
        const dto = new PostListResponseDto();
        Object.assign(dto, listData);

        // Assert
        expect(dto.posts).toEqual([]);
        expect(dto.posts).toHaveLength(0);
      });
    });

    describe('CalendarPostResponseDto', () => {
      it('should create valid CalendarPostResponseDto', () => {
        // Arrange
        const post = new PostResponseDto();
        Object.assign(post, {
          id: '123e4567-e89b-12d3-a456-426614174000',
          imagemUrl: 'https://example.com/image.jpg',
          legenda: 'Calendar post',
          dataAgendada: '2023-12-01T10:00:00Z',
          status: 'Agendado',
          comentarioCliente: null,
          comentarioAdmin: null,
          criadoEm: '2023-01-01T10:00:00Z',
          atualizadoEm: '2023-01-01T10:00:00Z'
        });

        const calendarData = {
          posts: [post]
        };

        // Act
        const dto = new CalendarPostResponseDto();
        Object.assign(dto, calendarData);

        // Assert
        expect(dto.posts).toHaveLength(1);
        expect(dto.posts[0]).toEqual(post);
      });

      it('should create empty CalendarPostResponseDto', () => {
        // Arrange
        const calendarData = {
          posts: []
        };

        // Act
        const dto = new CalendarPostResponseDto();
        Object.assign(dto, calendarData);

        // Assert
        expect(dto.posts).toEqual([]);
        expect(dto.posts).toHaveLength(0);
      });
    });
  });

  describe('DTO Type Safety', () => {
    it('should maintain type structure for all DTOs', () => {
      // Test that all DTOs can be instantiated and have expected properties
      const createClienteDto = new CreateClienteDto();
      const clienteResponseDto = new ClienteResponseDto();
      const loginDto = new LoginDto();
      const loginResponseDto = new LoginResponseDto();
      const createPostDto = new CreatePostDto();
      const updatePostStatusDto = new UpdatePostStatusDto();
      const postResponseDto = new PostResponseDto();
      const postListResponseDto = new PostListResponseDto();
      const calendarPostResponseDto = new CalendarPostResponseDto();

      // Assert all DTOs are properly instantiated
      expect(createClienteDto).toBeDefined();
      expect(clienteResponseDto).toBeDefined();
      expect(loginDto).toBeDefined();
      expect(loginResponseDto).toBeDefined();
      expect(createPostDto).toBeDefined();
      expect(updatePostStatusDto).toBeDefined();
      expect(postResponseDto).toBeDefined();
      expect(postListResponseDto).toBeDefined();
      expect(calendarPostResponseDto).toBeDefined();
    });
  });
});
