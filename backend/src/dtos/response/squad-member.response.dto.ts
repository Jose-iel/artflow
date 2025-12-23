import { User } from '../../entities/User';
import { Cliente } from '../../entities/Cliente';
import { Squad } from '../../entities/Squad';

export class SquadMemberResponseDto {
  id: string;
  nome: string;
  email: string;

  static fromUser(user: User): SquadMemberResponseDto {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email
    };
  }

  static fromCliente(cliente: Cliente): SquadMemberResponseDto {
    return {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email
    };
  }

  static fromUsers(users: User[]): SquadMemberResponseDto[] {
    return users.map(user => SquadMemberResponseDto.fromUser(user));
  }

  static fromClientes(clientes: Cliente[]): SquadMemberResponseDto[] {
    return clientes.map(cliente => SquadMemberResponseDto.fromCliente(cliente));
  }
}

export class SquadMembersResponseDto {
  squad: { id: string; nome: string };
  funcionarios: SquadMemberResponseDto[];
  clientes: SquadMemberResponseDto[];

  static fromSquad(squad: Squad): SquadMembersResponseDto {
    return {
      squad: {
        id: squad.id,
        nome: squad.nome
      },
      funcionarios: squad.funcionarios 
        ? SquadMemberResponseDto.fromUsers(squad.funcionarios)
        : [],
      clientes: squad.clientes
        ? SquadMemberResponseDto.fromClientes(squad.clientes)
        : []
    };
  }
}
