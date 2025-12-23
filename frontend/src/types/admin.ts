// Types para Admin Master - Empresas, Squads e Users

// ═══════════════════════════════════════════════════════════
// EMPRESA
// ═══════════════════════════════════════════════════════════

export interface Empresa {
  id: string
  nome: string
  cnpj: string
  descricao?: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
  squads?: Squad[]
}

export interface CreateEmpresaDto {
  nome: string
  cnpj: string
  descricao?: string
}

export interface UpdateEmpresaDto {
  nome?: string
  cnpj?: string
  descricao?: string
  ativo?: boolean
}

export interface EmpresaStatistics {
  empresa: {
    id: string
    nome: string
    totalSquads: number
    totalFuncionarios: number
    totalClientes: number
  }
}

// ═══════════════════════════════════════════════════════════
// SQUAD
// ═══════════════════════════════════════════════════════════

export interface Squad {
  id: string
  nome: string
  descricao?: string
  empresaId: string
  empresa?: Empresa
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
  funcionarios?: AdminUser[]
  clientes?: Cliente[]
}

export interface CreateSquadDto {
  nome: string
  descricao?: string
  empresaId: string
}

export interface UpdateSquadDto {
  nome?: string
  descricao?: string
  ativo?: boolean
}

export interface SquadMembers {
  squad: Squad
  funcionarios: AdminUser[]
  clientes: Cliente[]
}

// ═══════════════════════════════════════════════════════════
// USER (Admin Master perspective)
// ═══════════════════════════════════════════════════════════

export type AdminUserRole = 'ADMIN_MASTER' | 'FUNCIONARIO' | 'CLIENT'

export interface AdminUser {
  id: string
  nome: string
  email: string
  role: AdminUserRole
  squadId?: string
  squad?: Squad
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CreateUserDto {
  nome: string
  email: string
  senha: string
  role: AdminUserRole
  squadId?: string
}

export interface UpdateUserDto {
  nome?: string
  email?: string
  role?: AdminUserRole
  squadId?: string
  ativo?: boolean
}

// ═══════════════════════════════════════════════════════════
// CLIENTE (para referência em squads)
// ═══════════════════════════════════════════════════════════

export interface Cliente {
  id: string
  nome: string
  email: string
  squadId?: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

// ═══════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════

export interface ApiListResponse<T> {
  status: 'success' | 'error'
  data: T[]
}

export interface ApiSingleResponse<T> {
  status: 'success' | 'error'
  data: T
}

export interface ApiMessageResponse {
  status: 'success' | 'error'
  message: string
}
