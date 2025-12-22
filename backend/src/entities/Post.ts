import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from './Cliente';
import { User } from './User';
import { Squad } from './Squad';

export enum PostStatus {
  APROVADO = 'Aprovado',
  NAO_APROVADO = 'Não aprovado',
  ALTERACAO = 'Alteração',
  AGENDADO = 'Agendado',
  PUBLICADO = 'Publicado'
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null;

  @Column({ name: 'data_postagem', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  dataPostagem: Date;

  @Column({ name: 'data_agendada', type: 'timestamp with time zone', nullable: true })
  dataAgendada: Date | null;

  @Column({ name: 'imagem_url', type: 'text' })
  imagemUrl: string;

  @Column({ name: 'legenda', type: 'text', nullable: true })
  legenda: string | null;

  @Column({ 
    type: 'text', 
    default: PostStatus.NAO_APROVADO,
    enum: Object.values(PostStatus)
  })
  status: PostStatus;

  @Column({ name: 'comentario_cliente', type: 'text', nullable: true })
  comentarioCliente: string | null;

  @Column({ name: 'comentario_admin', type: 'text', nullable: true })
  comentarioAdmin: string | null;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm: Date;

  @ManyToOne(() => Cliente, cliente => cliente.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => User, user => user.createdPosts, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @ManyToOne(() => Squad, squad => squad.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'squad_id' })
  squad: Squad;

  @Column({ name: 'squad_id' })
  squadId: string;
}
