// API Service para Funcionários
import { api } from './api'
import type { Funcionario, CreateFuncionarioDto, UpdateFuncionarioDto } from '@/types/funcionario'

export const funcionarioApi = {
  getAll: async (): Promise<Funcionario[]> => {
    const response = await api.get('/users')
    const users = response.data.data || []
    return users.filter((user: Funcionario) => user.role === 'FUNCIONARIO')
  },

  getById: async (id: string): Promise<Funcionario> => {
    const response = await api.get(`/users/${id}`)
    return response.data.data
  },

  create: async (data: CreateFuncionarioDto): Promise<Funcionario> => {
    const response = await api.post('/users', {
      ...data,
      role: 'FUNCIONARIO'
    })
    return response.data.data
  },

  update: async (id: string, data: UpdateFuncionarioDto): Promise<Funcionario> => {
    const response = await api.put(`/users/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  }
}
