// React Query hooks para Empresas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { empresasApi } from '@/services/adminApi'
import type { CreateEmpresaDto, UpdateEmpresaDto } from '@/types/admin'

const EMPRESAS_KEY = ['empresas']

export const useEmpresas = () => {
  return useQuery({
    queryKey: EMPRESAS_KEY,
    queryFn: empresasApi.getAll
  })
}

export const useEmpresa = (id: string) => {
  return useQuery({
    queryKey: [...EMPRESAS_KEY, id],
    queryFn: () => empresasApi.getById(id),
    enabled: !!id
  })
}

export const useEmpresaStatistics = (id: string) => {
  return useQuery({
    queryKey: [...EMPRESAS_KEY, id, 'statistics'],
    queryFn: () => empresasApi.getStatistics(id),
    enabled: !!id
  })
}

export const useCreateEmpresa = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEmpresaDto) => empresasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPRESAS_KEY })
    }
  })
}

export const useUpdateEmpresa = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmpresaDto }) =>
      empresasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPRESAS_KEY })
    }
  })
}

export const useDeleteEmpresa = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => empresasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPRESAS_KEY })
    }
  })
}
