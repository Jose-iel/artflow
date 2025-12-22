import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Squad } from './Squad';
import { Post } from './Post';

export enum UserRole {
  ADMIN_MASTER = 'ADMIN_MASTER',
  FUNCIONARIO = 'FUNCIONARIO',
  CLIENT = 'CLIENT'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text' })
  senha: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ 
    type: 'text', 
    default: UserRole.CLIENT,
    enum: Object.values(UserRole)
  })
  role: UserRole;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm: Date;

  @ManyToOne(() => Squad, squad => squad.funcionarios, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'squad_id' })
  squad: Squad;

  @Column({ name: 'squad_id', nullable: true })
  squadId: string | null;

  @OneToMany(() => Post, post => post.createdBy)
  createdPosts: Post[];
}
