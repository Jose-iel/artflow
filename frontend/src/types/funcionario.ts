// Types para Funcionário
import type { Squad } from './admin'

// ═══════════════════════════════════════════════════════════
// FUNCIONÁRIO
// ═══════════════════════════════════════════════════════════

export interface Funcionario {
  id: string
  nome: string
  email: string
  role: 'FUNCIONARIO'
  squadId?: string
  squad?: Squad
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CreateFuncionarioDto {
  nome: string
  email: string
  senha: string
  squadId: string
}

export interface UpdateFuncionarioDto {
  nome?: string
  email?: string
  squadId?: string
  ativo?: boolean
}
