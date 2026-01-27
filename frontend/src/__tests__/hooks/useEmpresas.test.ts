import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEmpresas, useEmpresa, useCreateEmpresa, useUpdateEmpresa, useDeleteEmpresa } from '@/hooks/useEmpresas'
import { empresasApi } from '@/services/adminApi'
import { vi } from 'vitest'
import React from 'react'

vi.mock('@/services/adminApi', () => ({
  empresasApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getStatistics: vi.fn(),
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

describe('useEmpresas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useEmpresas', () => {
    it('should fetch empresas successfully', async () => {
      const mockEmpresas = [
        { id: '1', nome: 'Empresa 1', cnpj: '12345678000190', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' },
        { id: '2', nome: 'Empresa 2', cnpj: '98765432000190', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }
      ]

      vi.mocked(empresasApi.getAll).mockResolvedValue(mockEmpresas)

      const { result } = renderHook(() => useEmpresas(), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockEmpresas)
      expect(empresasApi.getAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('useEmpresa', () => {
    it('should fetch single empresa successfully', async () => {
      const mockEmpresa = { id: '1', nome: 'Empresa 1', cnpj: '12345678000190', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }

      vi.mocked(empresasApi.getById).mockResolvedValue(mockEmpresa)

      const { result } = renderHook(() => useEmpresa('1'), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockEmpresa)
      expect(empresasApi.getById).toHaveBeenCalledWith('1')
    })

    it('should not fetch when id is empty', () => {
      const { result } = renderHook(() => useEmpresa(''), { wrapper: createWrapper() })

      expect(result.current.isFetching).toBe(false)
      expect(empresasApi.getById).not.toHaveBeenCalled()
    })
  })

  describe('useCreateEmpresa', () => {
    it('should create empresa successfully', async () => {
      const newEmpresa = { id: '3', nome: 'New Empresa', cnpj: '11111111000190', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }
      vi.mocked(empresasApi.create).mockResolvedValue(newEmpresa)

      const { result } = renderHook(() => useCreateEmpresa(), { wrapper: createWrapper() })

      result.current.mutate({ nome: 'New Empresa', cnpj: '11111111000190' })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(empresasApi.create).toHaveBeenCalledWith({ nome: 'New Empresa', cnpj: '11111111000190' })
    })
  })

  describe('useUpdateEmpresa', () => {
    it('should update empresa successfully', async () => {
      const updatedEmpresa = { id: '1', nome: 'Updated Empresa', cnpj: '12345678000190', ativo: true, criadoEm: '2024-01-01', atualizadoEm: '2024-01-01' }
      vi.mocked(empresasApi.update).mockResolvedValue(updatedEmpresa)

      const { result } = renderHook(() => useUpdateEmpresa(), { wrapper: createWrapper() })

      result.current.mutate({ id: '1', data: { nome: 'Updated Empresa' } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(empresasApi.update).toHaveBeenCalledWith('1', { nome: 'Updated Empresa' })
    })
  })

  describe('useDeleteEmpresa', () => {
    it('should delete empresa successfully', async () => {
      vi.mocked(empresasApi.delete).mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteEmpresa(), { wrapper: createWrapper() })

      result.current.mutate('1')

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(empresasApi.delete).toHaveBeenCalledWith('1')
    })
  })
})
