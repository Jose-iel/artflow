import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Squad } from './Squad';
import { Post } from './Post';

@Entity('clientes')
export class Cliente {
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

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm: Date;

  @ManyToOne(() => Squad, squad => squad.clientes, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'squad_id' })
  squad: Squad;

  @Column({ name: 'squad_id', nullable: true })
  squadId: string | null;

  @OneToMany(() => Post, post => post.cliente)
  posts: Post[];
}
