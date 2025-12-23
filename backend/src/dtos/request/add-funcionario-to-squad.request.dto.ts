import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddFuncionarioToSquadRequestDto {
  @IsUUID('4', { message: 'ID do usuário inválido' })
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  usuarioId: string;
}
