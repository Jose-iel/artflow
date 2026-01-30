export class CreatePostDto {
  imagePath: string;
  legenda?: string;
  dataAgendada?: string;
  clienteId?: string;
}

export class UpdatePostStatusDto {
  status: 'Aprovado' | 'Não aprovado' | 'Alteração' | 'Agendado' | 'Publicado';
  comentarioCliente?: string;
  comentarioAdmin?: string;
}

export class PostResponseDto {
  id: string;
  imagePath: string;
  legenda: string | null;
  dataAgendada: string | null;
  status: string;
  comentarioCliente: string | null;
  comentarioAdmin: string | null;
  clienteId: string;
  squadId?: string;
  createdById?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export class PostListResponseDto {
  posts: PostResponseDto[];
}

export class CalendarPostResponseDto {
  posts: PostResponseDto[];
}
