export class CreateClienteDto {
  nome: string;
  email: string;
  senha: string;
}

export class ClienteResponseDto {
  id: string;
  name: string;
  email: string;
  active: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LoginDto {
  email: string;
  senha: string;
}

export class LoginResponseDto {
  message: string;
  token: string;
  cliente: ClienteResponseDto;
}
