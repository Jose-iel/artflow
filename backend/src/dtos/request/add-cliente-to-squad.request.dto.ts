import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ValidateIf } from 'class-validator';

export class AddClienteToSquadRequestDto {
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente inválido' })
  clienteId?: string;

  @ValidateIf(o => !o.clienteId)
  @IsNotEmpty({ message: 'Nome é obrigatório para novo cliente' })
  @IsString()
  nome?: string;

  @ValidateIf(o => !o.clienteId)
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ValidateIf(o => !o.clienteId)
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  senha?: string;
}
