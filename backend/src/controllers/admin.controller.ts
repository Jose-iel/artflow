import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Cliente } from '../entities/Cliente';
import { User, UserRole } from '../entities/User';
import { Post, PostStatus } from '../entities/Post';
import { AuthRequest } from '../middlewares/auth';
import AppError from '../utils/AppError';
import { Not } from 'typeorm';
import bcrypt from 'bcrypt';

// DTOs for Admin operations
interface CreateClientDto {
  nome: string;
  email: string;
  senha: string;
}

interface CreatePostForClientDto {
  clienteId: string;
  imagemUrl: string;
  legenda?: string;
  dataAgendada?: Date;
}

interface UpdatePostDto {
  imagemUrl?: string;
  legenda?: string;
  dataAgendada?: Date;
}

interface UpdatePostStatusDto {
  status: PostStatus;
}

export class AdminController {
  private get clienteRepository() {
    return AppDataSource.getRepository(Cliente);
  }

  private get postRepository() {
    return AppDataSource.getRepository(Post);
  }

  // POST STATISTICS ENDPOINTS

  async getPostStats(req: AuthRequest, res: Response) {
    try {
      console.log('Getting post stats for user:', req.user?.email, 'role:', req.user?.role);
      
      let query = this.postRepository
        .createQueryBuilder('post')
        .select('post.status', 'status')
        .addSelect('COUNT(*)', 'count');

      // Funcionário só vê stats da sua squad
      if (req.user?.role === UserRole.FUNCIONARIO && req.user?.squadId) {
        query = query.where('post.squadId = :squadId', { squadId: req.user.squadId });
      }
      // Admin Master vê tudo

      const stats = await query.groupBy('post.status').getRawMany();
      
      console.log('Raw stats from database:', stats);

      // Transform the data for easier consumption
      // Apenas os 3 status usados no sistema
      const formattedStats = {
        'Aprovado': 0,
        'Não aprovado': 0,
        'Publicado': 0
      };

      stats.forEach(stat => {
        const status = stat.status as keyof typeof formattedStats;
        if (status in formattedStats) {
          formattedStats[status] = parseInt(stat.count);
        }
      });

      res.status(200).json({
        status: 'success',
        data: formattedStats
      });
    } catch (error) {
      console.error('Get post stats error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar estatísticas dos posts'
      });
    }
  }

  // USER MANAGEMENT ENDPOINTS

  async createClient(req: AuthRequest, res: Response) {
    try {
      const { nome, email, senha }: CreateClientDto = req.body;

      // Validations
      if (!nome || !nome.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Nome é obrigatório'
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Email é obrigatório'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Email inválido'
        });
      }

      if (!senha || senha.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Senha deve ter pelo menos 8 caracteres'
        });
      }

      // Check if email already exists
      const existingClient = await this.clienteRepository.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingClient) {
        return res.status(400).json({
          status: 'error',
          message: 'Email já cadastrado'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(senha, 8);

      // Create new client
      const newClient = this.clienteRepository.create({
        nome: nome.trim(),
        email: email.toLowerCase(),
        senha: hashedPassword,
        squadId: req.user!.squadId // Use admin's squad for new clients
      });

      const savedClient = await this.clienteRepository.save(newClient);

      // Remove password from response
      const { senha: _, ...clientResponse } = savedClient;

      return res.status(201).json({
        status: 'success',
        message: 'Cliente criado com sucesso',
        cliente: clientResponse
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao criar cliente'
      });
    }
  }

  async listUsers(req: AuthRequest, res: Response) {
    try {
      const users = await this.clienteRepository.find({
        select: ['id', 'nome', 'email', 'ativo', 'criadoEm', 'atualizadoEm'],
        order: { criadoEm: 'DESC' }
      });

      return res.json({
        status: 'success',
        usuarios: users
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao listar usuários'
      });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, email, role, ativo } = req.body;

      const user = await this.clienteRepository.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }

      // Prevent deactivating yourself
      if (user.id === req.user!.id && ativo === false) {
        return res.status(400).json({
          status: 'error',
          message: 'Não pode desativar seu próprio usuário'
        });
      }

      // CRITICAL: Prevent deactivating the last SUPER_USER
      // Cannot deactivate another super user
      if (ativo === false) {
        const activeUserCount = await this.clienteRepository.count({
          where: { ativo: true }
        });

        if (activeUserCount <= 1) {
          return res.status(400).json({
            status: 'error',
            message: 'Não pode desativar o último usuário ativo'
          });
        }
      }

      // Update fields if provided
      if (nome !== undefined) {
        if (!nome || !nome.trim()) {
          return res.status(400).json({
            status: 'error',
            message: 'Nome é obrigatório'
          });
        }
        user.nome = nome.trim();
      }

      if (email !== undefined) {
        if (!email || !email.trim()) {
          return res.status(400).json({
            status: 'error',
            message: 'Email é obrigatório'
          });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            status: 'error',
            message: 'Email inválido'
          });
        }

        // Check if email already exists (excluding current user)
        const existingClient = await this.clienteRepository.findOne({
          where: { email: email.toLowerCase(), id: Not(id) }
        });

        if (existingClient) {
          return res.status(400).json({
            status: 'error',
            message: 'Email já cadastrado'
          });
        }

        user.email = email.toLowerCase();
      }

      if (role !== undefined) {
        // Note: Role is no longer stored in Cliente entity
        // This functionality is now handled by the new User entity system
        return res.status(400).json({
          status: 'error',
          message: 'Alteração de role não é mais suportada. Use o novo sistema de usuários.'
        });
      }

      if (ativo !== undefined) {
        user.ativo = ativo;
      }

      const updatedUser = await this.clienteRepository.save(user);

      // Remove password from response
      const { senha: _, ...userResponse } = updatedUser;

      return res.json({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        usuario: userResponse
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao atualizar usuário'
      });
    }
  }

  async deactivateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await this.clienteRepository.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Usuário não encontrado'
        });
      }

      // Don't allow deactivating yourself
      if (user.id === req.user!.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Não pode desativar seu próprio usuário'
        });
      }

      // CRITICAL: Prevent deactivating the last active user
      const activeUserCount = await this.clienteRepository.count({
        where: { ativo: true }
      });

      if (activeUserCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Não pode desativar o último usuário ativo'
        });
      }

      user.ativo = false;
      await this.clienteRepository.save(user);

      return res.json({
        status: 'success',
        message: 'Usuário desativado com sucesso'
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao desativar usuário'
      });
    }
  }

  // POST MANAGEMENT ENDPOINTS

  async createPostForClient(req: AuthRequest, res: Response) {
    try {
      const { clienteId, imagemUrl, legenda, dataAgendada }: CreatePostForClientDto = req.body;

      // Validations
      if (!clienteId) {
        return res.status(400).json({
          status: 'error',
          message: 'ID do cliente é obrigatório'
        });
      }

      if (!imagemUrl || !imagemUrl.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'URL da imagem é obrigatória'
        });
      }

      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(imagemUrl)) {
        return res.status(400).json({
          status: 'error',
          message: 'URL da imagem inválida'
        });
      }

      if (dataAgendada && new Date(dataAgendada) <= new Date()) {
        return res.status(400).json({
          status: 'error',
          message: 'Data agendada deve ser futura'
        });
      }

      // Check if client exists and is active
      const client = await this.clienteRepository.findOne({
        where: { id: clienteId, ativo: true }
      });

      if (!client) {
        return res.status(404).json({
          status: 'error',
          message: 'Cliente não encontrado ou inativo'
        });
      }

      // Create post
      const newPost = this.postRepository.create({
        clienteId,
        createdById: req.user!.id, // Admin who created the post
        imagemUrl: imagemUrl.trim(),
        legenda: legenda?.trim() || null,
        dataAgendada: dataAgendada || null,
        status: PostStatus.NAO_APROVADO,
        squadId: client.squadId || req.user!.squadId
      });

      const savedPost = await this.postRepository.save(newPost);

      return res.status(201).json({
        status: 'success',
        message: 'Post criado e atribuído com sucesso',
        post: savedPost
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao criar post'
      });
    }
  }

  async getDashboardPosts(req: AuthRequest, res: Response) {
    try {
      const { status, clienteId, clienteNome, postContent, page = 1, limit = 10 } = req.query;
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const offset = (pageNum - 1) * limitNum;

      // Build query
      const queryBuilder = this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.cliente', 'cliente')
        .leftJoinAndSelect('post.createdBy', 'createdBy')
        .orderBy('post.criadoEm', 'DESC');

      // Funcionário só vê posts da sua squad
      if (req.user?.role === UserRole.FUNCIONARIO && req.user?.squadId) {
        queryBuilder.andWhere('post.squadId = :squadId', { squadId: req.user.squadId });
      }
      // Admin Master vê tudo

      // Filter by status if provided
      if (status) {
        queryBuilder.andWhere('post.status = :status', { status });
      }

      // Filter by client if provided
      if (clienteId) {
        queryBuilder.andWhere('post.clienteId = :clienteId', { clienteId });
      }

      // Filter by client name if provided
      if (clienteNome) {
        queryBuilder.andWhere('cliente.nome ILIKE :clienteNome', { 
          clienteNome: `%${clienteNome}%` 
        });
      }

      // Filter by post content/legend if provided
      if (postContent) {
        queryBuilder.andWhere('(post.legenda ILIKE :postContent)', { 
          postContent: `%${postContent}%` 
        });
      }

      // Apply pagination
      queryBuilder.skip(offset).take(limitNum);

      const [posts, total] = await queryBuilder.getManyAndCount();

      // Atualiza automaticamente posts aprovados com data agendada no passado para Publicado
      const now = new Date();
      for (const post of posts) {
        if (post.status === PostStatus.APROVADO && post.dataAgendada && new Date(post.dataAgendada) < now) {
          post.status = PostStatus.PUBLICADO;
          await this.postRepository.save(post);
        }
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      return res.json({
        status: 'success',
        posts: posts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao carregar posts do dashboard'
      });
    }
  }

  async updatePostStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status }: UpdatePostStatusDto = req.body;

      const post = await this.postRepository.findOne({
        where: { id },
        relations: ['cliente', 'createdBy']
      });

      if (!post) {
        return res.status(404).json({
          status: 'error',
          message: 'Post não encontrado'
        });
      }

      post.status = status;

      const updatedPost = await this.postRepository.save(post);

      return res.json({
        status: 'success',
        message: 'Status do post atualizado com sucesso',
        post: updatedPost
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao atualizar status do post'
      });
    }
  }

  async updatePost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { imagemUrl, legenda, dataAgendada }: UpdatePostDto = req.body;

      const post = await this.postRepository.findOne({
        where: { id },
        relations: ['cliente', 'createdBy']
      });

      if (!post) {
        return res.status(404).json({
          status: 'error',
          message: 'Post não encontrado'
        });
      }

      // Update fields if provided
      if (imagemUrl) {
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(imagemUrl)) {
          return res.status(400).json({
            status: 'error',
            message: 'URL da imagem inválida'
          });
        }
        post.imagemUrl = imagemUrl.trim();
      }

      if (legenda !== undefined) {
        post.legenda = legenda?.trim() || null;
      }

      if (dataAgendada !== undefined) {
        if (dataAgendada && new Date(dataAgendada) <= new Date()) {
          return res.status(400).json({
            status: 'error',
            message: 'Data agendada deve ser futura'
          });
        }
        // Convert datetime-local string to proper Date object with Brazil timezone
        post.dataAgendada = dataAgendada ? new Date(dataAgendada) : null;
      }

      const updatedPost = await this.postRepository.save(post);

      return res.json({
        status: 'success',
        message: 'Post atualizado com sucesso',
        post: updatedPost
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao atualizar post'
      });
    }
  }

  async deletePost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const post = await this.postRepository.findOne({ where: { id } });

      if (!post) {
        return res.status(404).json({
          status: 'error',
          message: 'Post não encontrado'
        });
      }

      await this.postRepository.delete(id);

      return res.json({
        status: 'success',
        message: 'Post deletado com sucesso'
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao deletar post'
      });
    }
  }

  async getClients(req: AuthRequest, res: Response) {
    try {
      const clients = await this.clienteRepository.find({
        select: ['id', 'nome', 'email', 'squadId', 'criadoEm'],
        order: { nome: 'ASC' }
      });

      return res.json({
        status: 'success',
        clients
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar clientes'
      });
    }
  }
}
