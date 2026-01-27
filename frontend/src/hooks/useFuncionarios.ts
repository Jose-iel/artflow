// React Query hooks para Funcionários
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { funcionarioApi } from '@/services/funcionarioApi'
import type { CreateFuncionarioDto, UpdateFuncionarioDto } from '@/types/funcionario'

const FUNCIONARIOS_KEY = ['funcionarios']

export const useFuncionarios = () => {
  return useQuery({
    queryKey: FUNCIONARIOS_KEY,
    queryFn: funcionarioApi.getAll
  })
}

export const useFuncionario = (id: string) => {
  return useQuery({
    queryKey: [...FUNCIONARIOS_KEY, id],
    queryFn: () => funcionarioApi.getById(id),
    enabled: !!id
  })
}

export const useCreateFuncionario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFuncionarioDto) => funcionarioApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUNCIONARIOS_KEY })
    }
  })
}

export const useUpdateFuncionario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFuncionarioDto }) =>
      funcionarioApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUNCIONARIOS_KEY })
    }
  })
}

export const useDeleteFuncionario = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => funcionarioApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUNCIONARIOS_KEY })
    }
  })
}
