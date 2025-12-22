import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Post, PostStatus } from '../entities/Post';
import { Cliente } from '../entities/Cliente';
import { User, UserRole } from '../entities/User';
import { CreatePostDto, UpdatePostStatusDto, PostResponseDto, PostListResponseDto, CalendarPostResponseDto } from '../dtos/post.dto';
import { AuthenticatedRequest } from '../middlewares/auth';
import AppError from '../utils/AppError';

export class PostController {
  private get postRepository() {
    return AppDataSource.getRepository(Post);
  }

  private mapPostToResponse(post: Post): PostResponseDto {
    return {
      id: post.id,
      imagemUrl: post.imagemUrl,
      legenda: post.legenda || null,
      dataAgendada: post.dataAgendada ? post.dataAgendada.toISOString() : null,
      status: post.status,
      comentarioCliente: post.comentarioCliente || null,
      comentarioAdmin: post.comentarioAdmin || null,
      clienteId: post.clienteId,
      squadId: post.squadId,
      createdById: post.createdById || null,
      criadoEm: post.criadoEm.toISOString(),
      atualizadoEm: post.atualizadoEm.toISOString()
    };
  }

  async listPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, start_date, end_date } = req.query;

      let query = this.postRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.cliente', 'cliente')
        .leftJoinAndSelect('post.createdBy', 'createdBy')
        .leftJoinAndSelect('post.squad', 'squad');

      // Apply permission-based filtering
      if (req.user?.role === UserRole.ADMIN_MASTER) {
        // Admin Master can see all posts
      } else if (req.user?.role === UserRole.FUNCIONARIO) {
        // Funcionário can see posts from their squad
        query = query.where('post.squadId = :squadId', { squadId: req.user.squadId });
      } else {
        // Cliente can only see their own posts
        query = query.where('post.clienteId = :clienteId', { clienteId: req.user?.id });
      }

      // Filter by status
      if (status) {
        query = query.andWhere('post.status = :status', { status });
      }

      // Filter by date range
      if (start_date) {
        query = query.andWhere('post.dataAgendada >= :startDate', { 
          startDate: new Date(start_date as string) 
        });
      }

      if (end_date) {
        query = query.andWhere('post.dataAgendada <= :endDate', { 
          endDate: new Date(end_date as string) 
        });
      }

      const posts = await query.orderBy('post.dataAgendada', 'ASC').getMany();

      const response: PostListResponseDto = {
        posts: posts.map(post => this.mapPostToResponse(post))
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('List posts error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }

  async getPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const post = await this.postRepository.findOne({
        where: { id },
        relations: ['cliente', 'squad']
      });

      if (!post) {
        throw new AppError('Post não encontrado', 404);
      }

      // Log post object for debugging
      console.log('Post object:', {
        id: post.id,
        criadoEm: post.criadoEm,
        criadoEmType: typeof post.criadoEm,
        atualizadoEm: post.atualizadoEm,
        atualizadoEmType: typeof post.atualizadoEm
      });

      // Check permissions
      if (req.user?.role === UserRole.ADMIN_MASTER) {
        // Admin Master can access any post
      } else if (req.user?.role === UserRole.FUNCIONARIO) {
        // Funcionário can only access posts from their squad
        if (post.squadId !== req.user.squadId) {
          throw new AppError('Acesso negado', 403);
        }
      } else {
        // Cliente can only access their own posts
        if (post.clienteId !== req.user?.id) {
          throw new AppError('Acesso negado', 403);
        }
      }

      const mappedPost = this.mapPostToResponse(post);
      res.status(200).json({
        post: mappedPost
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Get post error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        reqUser: req.user,
        params: req.params
      });
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor',
        details: {
          errorMessage,
          errorStack
        }
      });
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { imagemUrl, legenda, dataAgendada, clienteId: formClienteId }: CreatePostDto = req.body;
      
      // Determine clienteId based on user role
      let clienteId: string;
      let squadId: string;
      let createdById: string | null = null;

      if (req.user?.role === UserRole.ADMIN_MASTER || req.user?.role === UserRole.FUNCIONARIO) {
        // Admin/Funcionário creating post for a client
        if (!formClienteId) {
          throw new AppError('Cliente é obrigatório', 400);
        }
        clienteId = formClienteId;
        createdById = req.user.id;
        
        // Get client's squad
        const cliente = await AppDataSource.getRepository(Cliente).findOne({
          where: { id: clienteId },
          relations: ['squad']
        });
        
        if (!cliente) {
          throw new AppError('Cliente não encontrado', 404);
        }
        
        // Check permissions: Funcionário can only create posts for clients in same squad
        if (req.user.role === UserRole.FUNCIONARIO && cliente.squadId !== req.user.squadId) {
          throw new AppError('Acesso negado - cliente de outra squad', 403);
        }
        
        squadId = cliente.squadId!;
      } else {
        // Cliente creating post for themselves
        clienteId = req.user!.id;
        squadId = req.user!.squadId!;
      }

      // Validation
      if (!imagemUrl) {
        throw new AppError('URL da imagem é obrigatória', 400);
      }

      if (!imagemUrl.match(/^https?:\/\/.+/)) {
        throw new AppError('URL da imagem inválida', 400);
      }

      // Validate scheduled date if provided
      if (dataAgendada) {
        const scheduledDate = new Date(dataAgendada);
        if (scheduledDate <= new Date()) {
          throw new AppError('Data agendada deve ser futura', 400);
        }
      }

      const newPost = {
        clienteId,
        squadId,
        createdById,
        imagemUrl: imagemUrl,
        legenda: legenda || null,
        dataAgendada: dataAgendada ? new Date(dataAgendada) : null,
        status: PostStatus.NAO_APROVADO
      };

      const savedPost = await this.postRepository.save(newPost);

      res.status(201).json({
        message: 'Post criado com sucesso',
        post: this.mapPostToResponse(savedPost as Post)
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Create post error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }

  async updatePostStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, comentarioCliente, comentarioAdmin }: UpdatePostStatusDto = req.body;
      
      // Validate status
      const validStatuses = Object.values(PostStatus);
      if (!validStatuses.includes(status as PostStatus)) {
        throw new AppError('Status inválido', 400);
      }

      // Require comment when requesting changes
      if (status === PostStatus.ALTERACAO && !comentarioAdmin) {
        throw new AppError('Comentário do administrador é obrigatório quando solicitar alterações', 400);
      }

      const post = await this.postRepository.findOne({
        where: { id },
        relations: ['cliente', 'squad']
      });

      if (!post) {
        throw new AppError('Post não encontrado', 404);
      }

      // Check permissions
      if (req.user?.role === UserRole.ADMIN_MASTER) {
        // Admin Master can update any post status
      } else if (req.user?.role === UserRole.FUNCIONARIO) {
        // Funcionário can only update posts from their squad
        if (post.squadId !== req.user.squadId) {
          throw new AppError('Acesso negado', 403);
        }
        // Funcionário can only approve, schedule, or request changes
        if (![PostStatus.APROVADO, PostStatus.AGENDADO, PostStatus.ALTERACAO].includes(status as PostStatus)) {
          throw new AppError('Funcionário só pode aprovar, agendar ou solicitar alterações', 403);
        }
      } else {
        // Cliente can only update their own posts and only request changes or approve
        if (post.clienteId !== req.user?.id) {
          throw new AppError('Acesso negado', 403);
        }
        if (![PostStatus.NAO_APROVADO, PostStatus.APROVADO].includes(status as PostStatus)) {
          throw new AppError('Cliente só pode aprovar ou reprovar posts', 403);
        }
      }

      post.status = status as PostStatus;

      if (comentarioCliente) {
        post.comentarioCliente = comentarioCliente;
      }

      if (comentarioAdmin) {
        post.comentarioAdmin = comentarioAdmin;
      }

      const updatedPost = await this.postRepository.save(post);
      
      res.status(200).json({
        message: 'Status atualizado com sucesso',
        post: this.mapPostToResponse(updatedPost)
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Update post status error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }

  async getCalendarPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const { year, month } = req.params;

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new AppError('Parâmetros de ano e mês inválidos', 400);
      }

      // Get start and end dates for the month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

      let query = this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.cliente', 'cliente')
        .leftJoinAndSelect('post.createdBy', 'createdBy')
        .leftJoinAndSelect('post.squad', 'squad')
        .where('post.dataAgendada >= :startDate', { startDate })
        .andWhere('post.dataAgendada <= :endDate', { endDate });

      // Apply permission-based filtering
      if (req.user?.role === UserRole.ADMIN_MASTER) {
        // Admin Master can see all posts
      } else if (req.user?.role === UserRole.FUNCIONARIO) {
        // Funcionário can see posts from their squad
        query = query.andWhere('post.squadId = :squadId', { squadId: req.user.squadId });
      } else {
        // Cliente can only see their own posts
        query = query.andWhere('post.clienteId = :clienteId', { clienteId: req.user?.id });
      }

      const posts = await query.orderBy('post.dataAgendada', 'ASC').getMany();

      const response: CalendarPostResponseDto = {
        posts: posts.map(post => this.mapPostToResponse(post))
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Get calendar posts error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }
}
