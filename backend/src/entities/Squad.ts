import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Empresa } from './Empresa';
import { User } from './User';
import { Cliente } from './Cliente';
import { Post } from './Post';

@Entity('squads')
export class Squad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamp with time zone' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamp with time zone' })
  atualizadoEm: Date;

  @ManyToOne(() => Empresa, empresa => empresa.squads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @OneToMany(() => User, user => user.squad)
  funcionarios: User[];

  @OneToMany(() => Cliente, cliente => cliente.squad)
  clientes: Cliente[];

  @OneToMany(() => Post, post => post.squad)
  posts: Post[];
}
