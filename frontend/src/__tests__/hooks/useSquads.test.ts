import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useSquads, 
  useSquad, 
  useSquadMembers,
  useCreateSquad, 
  useUpdateSquad, 
  useDeleteSquad,
  useAddFuncionarioToSquad,
  useRemoveFuncionarioFromSquad
} from '@/hooks/useSquads'
import { squadsApi } from '@/services/adminApi'
import { vi } from 'vitest'
import React from 'react'

vi.mock('@/services/adminApi', () => ({
  squadsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getMembers: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addFuncionario: vi.fn(),
    removeFuncionario: vi.fn()
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useSquads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSquads', () => {
    it('should fetch squads successfully', async () => {
      const mockSquads = [
        { id: '1', nome: 'Squad 1', empresaId: 'empresa-1', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' },
        { id: '2', nome: 'Squad 2', empresaId: 'empresa-1', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }
      ]

      vi.mocked(squadsApi.getAll).mockResolvedValue(mockSquads)

      const { result } = renderHook(() => useSquads(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockSquads)
      expect(squadsApi.getAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('useSquad', () => {
    it('should fetch single squad successfully', async () => {
      const mockSquad = { id: '1', nome: 'Squad 1', empresaId: 'empresa-1', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }

      vi.mocked(squadsApi.getById).mockResolvedValue(mockSquad)

      const { result } = renderHook(() => useSquad('1'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockSquad)
      expect(squadsApi.getById).toHaveBeenCalledWith('1')
    })
  })

  describe('useSquadMembers', () => {
    it('should fetch squad members successfully', async () => {
      const mockMembers = {
        squad: { id: '1', nome: 'Squad 1', empresaId: 'empresa-1', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' },
        funcionarios: [{ id: '1', nome: 'Member 1', email: 'member1@test.com', role: 'FUNCIONARIO' as const, ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }],
        clientes: [{ id: '2', nome: 'Member 2', email: 'member2@test.com', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }]
      }

      vi.mocked(squadsApi.getMembers).mockResolvedValue(mockMembers)

      const { result } = renderHook(() => useSquadMembers('1'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockMembers)
      expect(squadsApi.getMembers).toHaveBeenCalledWith('1')
    })
  })

  describe('useCreateSquad', () => {
    it('should create squad successfully', async () => {
      const newSquad = { id: '3', nome: 'New Squad', empresaId: 'empresa-1', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }
      vi.mocked(squadsApi.create).mockResolvedValue(newSquad)

      const { result } = renderHook(() => useCreateSquad(), { wrapper: createWrapper() })

      result.current.mutate({ nome: 'New Squad', empresaId: 'empresa-1' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(squadsApi.create).toHaveBeenCalledWith({ nome: 'New Squad', empresaId: 'empresa-1' })
    })
  })

  describe('useUpdateSquad', () => {
    it('should update squad successfully', async () => {
      const updatedSquad = { id: '1', nome: 'Updated Squad', empresaId: 'empresa-1', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }
      vi.mocked(squadsApi.update).mockResolvedValue(updatedSquad)

      const { result } = renderHook(() => useUpdateSquad(), { wrapper: createWrapper() })

      result.current.mutate({ id: '1', data: { nome: 'Updated Squad' } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(squadsApi.update).toHaveBeenCalledWith('1', { nome: 'Updated Squad' })
    })
  })

  describe('useDeleteSquad', () => {
    it('should delete squad successfully', async () => {
      vi.mocked(squadsApi.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteSquad(), { wrapper: createWrapper() })

      result.current.mutate('1')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(squadsApi.delete).toHaveBeenCalledWith('1')
    })
  })

  describe('useAddFuncionarioToSquad', () => {
    it('should add funcionario to squad successfully', async () => {
      vi.mocked(squadsApi.addFuncionario).mockResolvedValue(undefined)

      const { result } = renderHook(() => useAddFuncionarioToSquad(), { wrapper: createWrapper() })

      result.current.mutate({ squadId: 'squad-1', usuarioId: 'user-1' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(squadsApi.addFuncionario).toHaveBeenCalledWith('squad-1', 'user-1')
    })
  })

  describe('useRemoveFuncionarioFromSquad', () => {
    it('should remove funcionario from squad successfully', async () => {
      vi.mocked(squadsApi.removeFuncionario).mockResolvedValue(undefined)

      const { result } = renderHook(() => useRemoveFuncionarioFromSquad(), { wrapper: createWrapper() })

      result.current.mutate({ squadId: 'squad-1', usuarioId: 'user-1' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(squadsApi.removeFuncionario).toHaveBeenCalledWith('squad-1', 'user-1')
    })
  })
})
