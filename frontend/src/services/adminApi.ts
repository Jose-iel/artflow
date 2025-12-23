// API Service para Admin Master - Empresas, Squads e Users
import { api } from './api'
import type {
  Empresa,
  CreateEmpresaDto,
  UpdateEmpresaDto,
  EmpresaStatistics,
  Squad,
  CreateSquadDto,
  UpdateSquadDto,
  SquadMembers,
  AdminUser,
  CreateUserDto,
  UpdateUserDto
} from '@/types/admin'

// ═══════════════════════════════════════════════════════════
// EMPRESAS API
// ═══════════════════════════════════════════════════════════

export const empresasApi = {
  getAll: async (): Promise<Empresa[]> => {
    const response = await api.get('/empresas')
    return response.data.data
  },

  getById: async (id: string): Promise<Empresa> => {
    const response = await api.get(`/empresas/${id}`)
    return response.data.data
  },

  create: async (data: CreateEmpresaDto): Promise<Empresa> => {
    const response = await api.post('/empresas', data)
    return response.data.data
  },

  update: async (id: string, data: UpdateEmpresaDto): Promise<Empresa> => {
    const response = await api.put(`/empresas/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/empresas/${id}`)
  },

  getStatistics: async (id: string): Promise<EmpresaStatistics> => {
    const response = await api.get(`/empresas/${id}/statistics`)
    return response.data.data
  }
}

// ═══════════════════════════════════════════════════════════
// SQUADS API
// ═══════════════════════════════════════════════════════════

export const squadsApi = {
  getAll: async (): Promise<Squad[]> => {
    const response = await api.get('/squads')
    return response.data.data
  },

  getById: async (id: string): Promise<Squad> => {
    const response = await api.get(`/squads/${id}`)
    return response.data.data
  },

  create: async (data: CreateSquadDto): Promise<Squad> => {
    const response = await api.post('/squads', data)
    return response.data.data
  },

  update: async (id: string, data: UpdateSquadDto): Promise<Squad> => {
    const response = await api.put(`/squads/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/squads/${id}`)
  },

  getMembers: async (id: string): Promise<SquadMembers> => {
    const response = await api.get(`/squads/${id}/membros`)
    return response.data.data
  },

  addFuncionario: async (squadId: string, usuarioId: string): Promise<void> => {
    await api.post(`/squads/${squadId}/funcionarios`, { usuarioId })
  },

  removeFuncionario: async (squadId: string, usuarioId: string): Promise<void> => {
    await api.delete(`/squads/${squadId}/funcionarios/${usuarioId}`)
  },

  addCliente: async (squadId: string, data: { nome: string; email: string; senha: string }): Promise<void> => {
    await api.post(`/squads/${squadId}/clientes`, data)
  },

  removeCliente: async (squadId: string, clienteId: string): Promise<void> => {
    await api.delete(`/squads/${squadId}/clientes/${clienteId}`)
  }
}

// ═══════════════════════════════════════════════════════════
// USERS API (Admin Master)
// ═══════════════════════════════════════════════════════════

export const usersApi = {
  getAll: async (): Promise<AdminUser[]> => {
    const response = await api.get('/users')
    return response.data.data
  },

  getById: async (id: string): Promise<AdminUser> => {
    const response = await api.get(`/users/${id}`)
    return response.data.data
  },

  create: async (data: CreateUserDto): Promise<AdminUser> => {
    const response = await api.post('/users', data)
    return response.data.data
  },

  update: async (id: string, data: UpdateUserDto): Promise<AdminUser> => {
    const response = await api.put(`/users/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  }
}

// ═══════════════════════════════════════════════════════════
// CLIENTES API (Tabela legado)
// ═══════════════════════════════════════════════════════════

export interface Cliente {
  id: string
  nome: string
  email: string
  ativo: boolean
  squadId?: string
  criadoEm: string
  atualizadoEm?: string
}

export interface CreateClienteDto {
  nome: string
  email: string
  senha: string
  squadId: string
}

export interface UpdateClienteDto {
  nome?: string
  email?: string
  ativo?: boolean
  squadId?: string
}

export const clientesApi = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get('/admin/clientes')
    return response.data.clients || []
  },

  create: async (squadId: string, data: { nome: string; email: string; senha: string }): Promise<Cliente> => {
    const response = await api.post(`/squads/${squadId}/clientes`, data)
    return response.data.data
  },

  update: async (id: string, data: UpdateClienteDto): Promise<Cliente> => {
    const response = await api.patch(`/admin/users/${id}`, data)
    return response.data.usuario
  },

  delete: async (squadId: string, clienteId: string): Promise<void> => {
    await api.delete(`/squads/${squadId}/clientes/${clienteId}`)
  }
}
