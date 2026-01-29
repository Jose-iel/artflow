# Convenções do Backend - ArtFlow

> **📌 Este é o arquivo de FONTE ÚNICA** para todas as convenções do backend.
> Arquitetura baseada em **SOLID**, **Clean Architecture** e **Domain-Driven Design**.

---

## Princípios SOLID

| Princípio | Aplicação no Projeto |
|-----------|---------------------|
| **S** - Single Responsibility | Cada classe tem uma única responsabilidade |
| **O** - Open/Closed | Extensível via interfaces, fechado para modificação |
| **L** - Liskov Substitution | Interfaces permitem substituição de implementações |
| **I** - Interface Segregation | Interfaces específicas por contexto |
| **D** - Dependency Inversion | Dependências injetadas, não instanciadas |

---

## Stack Tecnológica

| Tecnologia       | Versão | Uso                    |
| ---------------- | ------ | ---------------------- |
| Node.js          | 20+    | Runtime                |
| TypeScript       | 5.x    | Tipagem estrita        |
| Express          | 4.x    | Framework HTTP         |
| TypeORM          | 0.3.x  | ORM                    |
| PostgreSQL       | 15+    | Banco de Dados         |
| JWT              | latest | Autenticação           |
| bcrypt           | latest | Hash de senhas         |
| class-validator  | latest | Validação de DTOs      |
| class-transformer| latest | Transformação de dados |
| Jest             | 30+    | Testes                 |
| Supertest        | latest | Testes de integração   |

---

## Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                        ROUTES                                │
│              (Define endpoints e middlewares)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      CONTROLLERS                             │
│         (HTTP: extrai request, formata response)             │
│              Responsabilidade: Transporte                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVICES                               │
│              (Lógica de negócio e orquestração)              │
│              Responsabilidade: Regras de Negócio             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     REPOSITORIES                             │
│                (Acesso a dados via TypeORM)                  │
│              Responsabilidade: Persistência                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       ENTITIES                               │
│           (Modelo de domínio com comportamento)              │
│              Responsabilidade: Domínio                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Projeto

```
backend/src/
├── config/               # Configurações
│   └── data-source.ts    # Configuração TypeORM
├── controllers/          # Controllers (HTTP layer)
├── services/             # Services (Business logic)
├── repositories/         # Repositories (Data access)
├── entities/             # Entities (Domain models)
├── dtos/                 # Data Transfer Objects
│   ├── request/          # DTOs de entrada
│   └── response/         # DTOs de saída
├── interfaces/           # Contratos e tipos
├── middlewares/          # Middlewares Express
│   ├── auth.ts           # Autenticação
│   ├── validation.ts     # Validação de DTOs
│   └── errorHandler.ts   # Tratamento de erros
├── routes/               # Definição de rotas
├── errors/               # Classes de erro customizadas
├── utils/                # Utilitários
├── __tests__/
│   ├── unit/             # Testes unitários
│   ├── integration/      # Testes de integração
│   └── helpers/          # Helpers de teste
├── app.ts                # Configuração do Express
└── server.ts             # Entry point
```

### Nomenclatura

| Tipo         | Padrão                | Exemplo                      |
| ------------ | --------------------- | ---------------------------- |
| Controllers  | `*.controller.ts`     | `post.controller.ts`         |
| Services     | `*.service.ts`        | `post.service.ts`            |
| Repositories | `*.repository.ts`     | `post.repository.ts`         |
| Entities     | `PascalCase.ts`       | `Post.ts`                    |
| DTOs Request | `*.request.dto.ts`    | `create-post.request.dto.ts` |
| DTOs Response| `*.response.dto.ts`   | `post.response.dto.ts`       |
| Interfaces   | `*.interface.ts`      | `post-service.interface.ts`  |
| Middlewares  | `camelCase.ts`        | `errorHandler.ts`            |
| Testes       | `*.test.ts`           | `post.service.test.ts`       |

---

## Padrões de TypeScript

### Exports

```typescript
// ✅ CORRETO - Named exports
export { PostController };
export { PostService };
export type { IPostService };

// ❌ INCORRETO - Default exports (exceto routes)
export default PostController;
```

### Tipagem Estrita

```typescript
// ✅ CORRETO - Tipagem explícita
const userId: string = req.user.id;
async function findById(id: string): Promise<Post | null> { }

// ❌ INCORRETO - Nunca usar any
const data: any = req.body;

// ✅ CORRETO - Usar unknown quando tipo é desconhecido
const data: unknown = req.body;
if (isValidDto(data)) { }
```

---

## Interfaces (Contratos)

> **DIP**: Dependa de abstrações, não de implementações concretas.

### Interface de Service

```typescript
// interfaces/post-service.interface.ts
import { Post } from '../entities/Post';
import { CreatePostRequestDto } from '../dtos/request/create-post.request.dto';
import { UpdatePostStatusRequestDto } from '../dtos/request/update-post-status.request.dto';

export interface IPostService {
  findAll(userId: string, role: UserRole): Promise<Post[]>;
  findById(id: string, userId: string, role: UserRole): Promise<Post>;
  create(dto: CreatePostRequestDto, userId: string, role: UserRole): Promise<Post>;
  updateStatus(id: string, dto: UpdatePostStatusRequestDto, userId: string, role: UserRole): Promise<Post>;
  delete(id: string, userId: string, role: UserRole): Promise<void>;
}
```

### Interface de Repository

```typescript
// interfaces/post-repository.interface.ts
import { Post } from '../entities/Post';

export interface IPostRepository {
  findAll(): Promise<Post[]>;
  findById(id: string): Promise<Post | null>;
  findByClienteId(clienteId: string): Promise<Post[]>;
  findBySquadId(squadId: string): Promise<Post[]>;
  save(post: Partial<Post>): Promise<Post>;
  delete(id: string): Promise<void>;
}
```

---

## Entities (Domain Models)

> **SRP**: Entity representa o domínio e contém regras de negócio do próprio objeto.

### Template Base

```typescript
// entities/Post.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn 
} from 'typeorm';
import { AppError } from '../errors/AppError';

export enum PostStatus {
  NAO_APROVADO = 'Não aprovado',
  APROVADO = 'Aprovado',
  AGENDADO = 'Agendado',
  PUBLICADO = 'Publicado'
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'imagem_url', type: 'text' })
  imagemUrl: string;

  @Column({ type: 'text', nullable: true })
  legenda: string | null;

  @Column({ 
    type: 'text', 
    default: PostStatus.NAO_APROVADO 
  })
  status: PostStatus;

  @Column({ name: 'data_agendada', type: 'timestamp with time zone', nullable: true })
  dataAgendada: Date | null;

  @Column({ name: 'comentario_cliente', type: 'text', nullable: true })
  comentarioCliente: string | null;

  @Column({ name: 'comentario_admin', type: 'text', nullable: true })
  comentarioAdmin: string | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm: Date;

  // Relacionamentos
  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'squad_id', type: 'uuid' })
  squadId: string;

  @ManyToOne(() => Cliente, cliente => cliente.posts)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  // ═══════════════════════════════════════════════════════════
  // DOMAIN METHODS - Regras de negócio do próprio objeto
  // ═══════════════════════════════════════════════════════════

  /**
   * Verifica se o post pode ser aprovado
   */
  canBeApproved(): boolean {
    return this.status === PostStatus.NAO_APROVADO;
  }

  /**
   * Aprova o post
   * @throws AppError se não puder ser aprovado
   */
  approve(): void {
    if (!this.canBeApproved()) {
      throw new AppError(
        `Post não pode ser aprovado no status atual: ${this.status}`,
        400
      );
    }
    this.status = PostStatus.APROVADO;
  }

  /**
   * Reprova o post
   * @param comentario Comentário obrigatório explicando a reprovação
   */
  reject(comentario: string): void {
    if (!comentario?.trim()) {
      throw new AppError('Comentário é obrigatório ao reprovar', 400);
    }
    this.status = PostStatus.NAO_APROVADO;
    this.comentarioAdmin = comentario;
  }

  /**
   * Agenda o post para publicação
   * @param dataAgendada Data futura para publicação
   */
  schedule(dataAgendada: Date): void {
    if (this.status !== PostStatus.APROVADO) {
      throw new AppError('Post precisa estar aprovado para ser agendado', 400);
    }
    if (dataAgendada <= new Date()) {
      throw new AppError('Data de agendamento deve ser futura', 400);
    }
    this.dataAgendada = dataAgendada;
    this.status = PostStatus.AGENDADO;
  }

  /**
   * Verifica se o usuário tem permissão para acessar este post
   */
  canBeAccessedBy(userId: string, userRole: string, userSquadId?: string): boolean {
    if (userRole === 'ADMIN_MASTER') return true;
    if (userRole === 'FUNCIONARIO') return this.squadId === userSquadId;
    return this.clienteId === userId;
  }
}
```

### Convenções de Colunas

| Campo TypeScript | Coluna DB        | Tipo                 |
| ---------------- | ---------------- | -------------------- |
| `criadoEm`       | `criado_em`      | `timestamp with tz`  |
| `atualizadoEm`   | `atualizado_em`  | `timestamp with tz`  |
| `squadId`        | `squad_id`       | `uuid`               |
| `imagemUrl`      | `imagem_url`     | `text`               |
| `clienteId`      | `cliente_id`     | `uuid`               |

---

## DTOs com Validação

> **SRP**: DTOs são responsáveis apenas por transporte e validação de dados.

### Request DTO (Entrada)

```typescript
// dtos/request/create-post.request.dto.ts
import { 
  IsNotEmpty, 
  IsUrl, 
  IsOptional, 
  IsString, 
  IsDateString,
  IsUUID 
} from 'class-validator';

export class CreatePostRequestDto {
  @IsNotEmpty({ message: 'URL da imagem é obrigatória' })
  @IsUrl({}, { message: 'URL da imagem inválida' })
  imagemUrl: string;

  @IsOptional()
  @IsString()
  legenda?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data agendada deve ser uma data válida' })
  dataAgendada?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente inválido' })
  clienteId?: string;
}
```

```typescript
// dtos/request/update-post-status.request.dto.ts
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { PostStatus } from '../../entities/Post';

export class UpdatePostStatusRequestDto {
  @IsEnum(PostStatus, { message: 'Status inválido' })
  status: PostStatus;

  @IsOptional()
  @IsString()
  comentarioCliente?: string;

  @ValidateIf(o => o.status === PostStatus.NAO_APROVADO)
  @IsNotEmpty({ message: 'Comentário é obrigatório ao reprovar' })
  @IsString()
  comentarioAdmin?: string;
}
```

### Response DTO (Saída)

```typescript
// dtos/response/post.response.dto.ts
import { Post } from '../../entities/Post';

export class PostResponseDto {
  id: string;
  imagemUrl: string;
  legenda: string | null;
  status: string;
  dataAgendada: string | null;
  comentarioCliente: string | null;
  comentarioAdmin: string | null;
  clienteId: string;
  squadId: string;
  criadoEm: string;
  atualizadoEm: string;

  static fromEntity(post: Post): PostResponseDto {
    return {
      id: post.id,
      imagemUrl: post.imagemUrl,
      legenda: post.legenda,
      status: post.status,
      dataAgendada: post.dataAgendada?.toISOString() ?? null,
      comentarioCliente: post.comentarioCliente,
      comentarioAdmin: post.comentarioAdmin,
      clienteId: post.clienteId,
      squadId: post.squadId,
      criadoEm: post.criadoEm.toISOString(),
      atualizadoEm: post.atualizadoEm.toISOString()
    };
  }

  static fromEntities(posts: Post[]): PostResponseDto[] {
    return posts.map(post => PostResponseDto.fromEntity(post));
  }
}
```

---

## Repositories

> **SRP**: Repository é responsável apenas por acesso a dados.

```typescript
// repositories/post.repository.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Post } from '../entities/Post';
import { IPostRepository } from '../interfaces/post-repository.interface';

export class PostRepository implements IPostRepository {
  private repository: Repository<Post>;

  constructor() {
    this.repository = AppDataSource.getRepository(Post);
  }

  async findAll(): Promise<Post[]> {
    return this.repository.find({
      relations: ['cliente', 'squad'],
      order: { criadoEm: 'DESC' }
    });
  }

  async findById(id: string): Promise<Post | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['cliente', 'squad']
    });
  }

  async findByClienteId(clienteId: string): Promise<Post[]> {
    return this.repository.find({
      where: { clienteId },
      relations: ['cliente', 'squad'],
      order: { criadoEm: 'DESC' }
    });
  }

  async findBySquadId(squadId: string): Promise<Post[]> {
    return this.repository.find({
      where: { squadId },
      relations: ['cliente', 'squad'],
      order: { criadoEm: 'DESC' }
    });
  }

  async save(post: Partial<Post>): Promise<Post> {
    return this.repository.save(post);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

---

## Services

> **SRP**: Service contém lógica de negócio e orquestração.
> **DIP**: Service depende de interfaces, não de implementações.

```typescript
// services/post.service.ts
import { Post, PostStatus } from '../entities/Post';
import { IPostService } from '../interfaces/post-service.interface';
import { IPostRepository } from '../interfaces/post-repository.interface';
import { CreatePostRequestDto } from '../dtos/request/create-post.request.dto';
import { UpdatePostStatusRequestDto } from '../dtos/request/update-post-status.request.dto';
import { AppError } from '../errors/AppError';
import { UserRole } from '../entities/User';

export class PostService implements IPostService {
  constructor(private readonly postRepository: IPostRepository) {}

  async findAll(userId: string, role: UserRole, squadId?: string): Promise<Post[]> {
    if (role === UserRole.ADMIN_MASTER) {
      return this.postRepository.findAll();
    }
    
    if (role === UserRole.FUNCIONARIO) {
      if (!squadId) throw new AppError('Squad não definida', 400);
      return this.postRepository.findBySquadId(squadId);
    }
    
    return this.postRepository.findByClienteId(userId);
  }

  async findById(id: string, userId: string, role: UserRole, squadId?: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    if (!post.canBeAccessedBy(userId, role, squadId)) {
      throw new AppError('Acesso negado', 403);
    }

    return post;
  }

  async create(
    dto: CreatePostRequestDto, 
    userId: string, 
    role: UserRole,
    squadId?: string
  ): Promise<Post> {
    const post = new Post();
    post.imagemUrl = dto.imagemUrl;
    post.legenda = dto.legenda ?? null;
    post.status = PostStatus.NAO_APROVADO;

    if (dto.dataAgendada) {
      const scheduledDate = new Date(dto.dataAgendada);
      if (scheduledDate <= new Date()) {
        throw new AppError('Data agendada deve ser futura', 400);
      }
      post.dataAgendada = scheduledDate;
    }

    // Define clienteId baseado no role
    if (role === UserRole.ADMIN_MASTER || role === UserRole.FUNCIONARIO) {
      if (!dto.clienteId) {
        throw new AppError('Cliente é obrigatório', 400);
      }
      post.clienteId = dto.clienteId;
      // Buscar squadId do cliente...
    } else {
      post.clienteId = userId;
      post.squadId = squadId!;
    }

    return this.postRepository.save(post);
  }

  async updateStatus(
    id: string,
    dto: UpdatePostStatusRequestDto,
    userId: string,
    role: UserRole,
    squadId?: string
  ): Promise<Post> {
    const post = await this.findById(id, userId, role, squadId);

    // Usa métodos de domínio da Entity
    switch (dto.status) {
      case PostStatus.APROVADO:
        post.approve();
        break;
      case PostStatus.NAO_APROVADO:
        post.reject(dto.comentarioAdmin!);
        break;
      case PostStatus.AGENDADO:
        if (!post.dataAgendada) {
          throw new AppError('Data de agendamento não definida', 400);
        }
        post.schedule(post.dataAgendada);
        break;
      default:
        post.status = dto.status;
    }

    if (dto.comentarioCliente) {
      post.comentarioCliente = dto.comentarioCliente;
    }

    return this.postRepository.save(post);
  }

  async delete(id: string, userId: string, role: UserRole): Promise<void> {
    if (role !== UserRole.ADMIN_MASTER) {
      throw new AppError('Apenas administradores podem deletar posts', 403);
    }

    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    await this.postRepository.delete(id);
  }
}
```

---

## Controllers

> **SRP**: Controller é responsável apenas por HTTP (request/response).

```typescript
// controllers/post.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { IPostService } from '../interfaces/post-service.interface';
import { CreatePostRequestDto } from '../dtos/request/create-post.request.dto';
import { UpdatePostStatusRequestDto } from '../dtos/request/update-post-status.request.dto';
import { PostResponseDto } from '../dtos/response/post.response.dto';

export class PostController {
  constructor(private readonly postService: IPostService) {}

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id, role, squadId } = req.user!;
    
    const posts = await this.postService.findAll(id, role, squadId);
    
    res.status(200).json({
      posts: PostResponseDto.fromEntities(posts)
    });
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: userId, role, squadId } = req.user!;
    const { id } = req.params;
    
    const post = await this.postService.findById(id, userId, role, squadId);
    
    res.status(200).json({
      post: PostResponseDto.fromEntity(post)
    });
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: userId, role, squadId } = req.user!;
    const dto = req.body as CreatePostRequestDto;
    
    const post = await this.postService.create(dto, userId, role, squadId);
    
    res.status(201).json({
      message: 'Post criado com sucesso',
      post: PostResponseDto.fromEntity(post)
    });
  }

  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: userId, role, squadId } = req.user!;
    const { id } = req.params;
    const dto = req.body as UpdatePostStatusRequestDto;
    
    const post = await this.postService.updateStatus(id, dto, userId, role, squadId);
    
    res.status(200).json({
      message: 'Status atualizado com sucesso',
      post: PostResponseDto.fromEntity(post)
    });
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: userId, role } = req.user!;
    const { id } = req.params;
    
    await this.postService.delete(id, userId, role);
    
    res.status(200).json({
      message: 'Post deletado com sucesso'
    });
  }
}
```

---

## Middlewares

### Validação de DTOs

```typescript
// middlewares/validation.ts
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validateDto<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(DtoClass, req.body);
    const errors = await validate(dto, { 
      whitelist: true,
      forbidNonWhitelisted: true 
    });

    if (errors.length > 0) {
      const messages = errors.map((error: ValidationError) => 
        Object.values(error.constraints || {}).join(', ')
      );
      
      return res.status(400).json({
        status: 'error',
        message: 'Erro de validação',
        errors: messages
      });
    }

    req.body = dto;
    next();
  };
}
```

### Error Handler Global

```typescript
// middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  // Erro conhecido da aplicação
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  // Erro de validação do class-validator
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      details: error.message
    });
  }

  // Erro do TypeORM
  if (error.name === 'QueryFailedError') {
    console.error('Database error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro no banco de dados'
    });
  }

  // Erro desconhecido
  console.error('Unexpected error:', error);
  return res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor'
  });
}
```

### Autenticação

```typescript
// middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../entities/User';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  squadId?: string;
  empresaId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token de autenticação não fornecido'
    });
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET!
    ) as AuthenticatedUser;
    
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido'
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Não autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso negado - permissão insuficiente'
      });
    }

    next();
  };
}
```

---

## Rotas

```typescript
// routes/posts.ts
import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { PostService } from '../services/post.service';
import { PostRepository } from '../repositories/post.repository';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { validateDto } from '../middlewares/validation';
import { CreatePostRequestDto } from '../dtos/request/create-post.request.dto';
import { UpdatePostStatusRequestDto } from '../dtos/request/update-post-status.request.dto';
import { UserRole } from '../entities/User';

const router = Router();

// Dependency Injection
const postRepository = new PostRepository();
const postService = new PostService(postRepository);
const postController = new PostController(postService);

// Rotas
router.get(
  '/',
  authenticateToken,
  postController.list.bind(postController)
);

router.get(
  '/:id',
  authenticateToken,
  postController.getById.bind(postController)
);

router.post(
  '/',
  authenticateToken,
  validateDto(CreatePostRequestDto),
  postController.create.bind(postController)
);

router.patch(
  '/:id/status',
  authenticateToken,
  validateDto(UpdatePostStatusRequestDto),
  postController.updateStatus.bind(postController)
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole([UserRole.ADMIN_MASTER]),
  postController.delete.bind(postController)
);

export default router;
```

---

## App Setup

```typescript
// app.ts
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', routes);

// Error Handler - DEVE ser o último middleware
app.use(errorHandler);

export { app };
```

---

## Errors

```typescript
// errors/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// errors/NotFoundError.ts
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado(a)`, 404);
  }
}

// errors/UnauthorizedError.ts
export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
  }
}

// errors/ForbiddenError.ts
export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
  }
}
```

---

## Testes

> **📌 Detalhes completos:** Ver `agents/test-engineer.md`

### Convenções

| Aspecto | Convenção |
|---------|-----------|
| Padrão | **AAA**: Arrange, Act, Assert |
| Nomenclatura | `should [resultado] when [condição]` |
| Mocks | Interfaces mockadas, não implementações |
| Isolamento | Cada teste independente |
| Cobertura | Sucesso, erro, edge cases |

### Estrutura de Arquivos

```
__tests__/
├── unit/
│   ├── services/         # Testes de Services (lógica de negócio)
│   └── controllers/      # Testes de Controllers (HTTP)
├── integration/          # Testes de API completos
└── helpers/              # Factories, mocks compartilhados
```

### O que testar em cada camada

| Camada | O que testar |
|--------|--------------|
| **Service** | Lógica de negócio, permissões, validações |
| **Controller** | Extração de request, formatação de response |
| **Integration** | Fluxo completo da API |

---

## Códigos HTTP

| Código | Uso                              |
| ------ | -------------------------------- |
| 200    | Sucesso (GET, PUT, PATCH)        |
| 201    | Criado com sucesso (POST)        |
| 204    | Sucesso sem conteúdo (DELETE)    |
| 400    | Erro de validação                |
| 401    | Não autenticado                  |
| 403    | Sem permissão                    |
| 404    | Não encontrado                   |
| 409    | Conflito (duplicado)             |
| 500    | Erro interno                     |

---

## Pipeline de Desenvolvimento

```
[1] spec-creator    → Desenha arquitetura e matura a ideia
[2] spec-developer  → Implementa o código
[3] test-engineer   → Cria os testes
[4] security-expert → Analisa segurança
[5] code-reviewer   → Valida e aprova ✅
```

> **📌 Checklists detalhados por etapa:**
> - [1] Especificação: `agents/spec-creator.md`
> - [2] Implementação: `agents/spec-developer.md`
> - [3] Testes: `agents/test-engineer.md`
> - [4] Segurança: `agents/security-expert.md`
> - [5] Validação: `agents/code-reviewer.md`

---