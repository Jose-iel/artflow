import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from '@/hooks/useClientes'
import { clientesApi } from '@/services/adminApi'
import { vi } from 'vitest'
import React from 'react'

vi.mock('@/services/adminApi', () => ({
  clientesApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
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

describe('useClientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useClientes', () => {
    it('should fetch clientes successfully', async () => {
      const mockClientes = [
        { id: '1', nome: 'Cliente 1', email: 'cliente1@test.com', squadId: 'squad-1', ativo: true, criadoEm: '2024-01-01' },
        { id: '2', nome: 'Cliente 2', email: 'cliente2@test.com', squadId: 'squad-1', ativo: true, criadoEm: '2024-01-01' }
      ]

      vi.mocked(clientesApi.getAll).mockResolvedValue(mockClientes)

      const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockClientes)
      expect(clientesApi.getAll).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch error', async () => {
      vi.mocked(clientesApi.getAll).mockRejectedValue(new Error('Failed to fetch'))

      const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(new Error('Failed to fetch'))
    })
  })

  describe('useCreateCliente', () => {
    it('should create cliente successfully', async () => {
      const newCliente = { id: '3', nome: 'New Cliente', email: 'new@test.com', squadId: 'squad-1', ativo: true, criadoEm: '2024-01-01' }
      vi.mocked(clientesApi.create).mockResolvedValue(newCliente)

      const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper() })

      result.current.mutate({ squadId: 'squad-1', data: { nome: 'New Cliente', email: 'new@test.com', senha: 'password123' } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(clientesApi.create).toHaveBeenCalledWith('squad-1', { nome: 'New Cliente', email: 'new@test.com', senha: 'password123' })
    })
  })

  describe('useUpdateCliente', () => {
    it('should update cliente successfully', async () => {
      const updatedCliente = { id: '1', nome: 'Updated Cliente', email: 'updated@test.com', squadId: 'squad-1', ativo: true, criadoEm: '2024-01-01' }
      vi.mocked(clientesApi.update).mockResolvedValue(updatedCliente)

      const { result } = renderHook(() => useUpdateCliente(), { wrapper: createWrapper() })

      result.current.mutate({ id: '1', data: { nome: 'Updated Cliente' } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(clientesApi.update).toHaveBeenCalledWith('1', { nome: 'Updated Cliente' })
    })
  })

  describe('useDeleteCliente', () => {
    it('should delete cliente successfully', async () => {
      vi.mocked(clientesApi.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteCliente(), { wrapper: createWrapper() })

      result.current.mutate({ squadId: 'squad-1', clienteId: '1' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(clientesApi.delete).toHaveBeenCalledWith('squad-1', '1')
    })
  })
})
