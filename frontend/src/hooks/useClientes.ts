// React Query hooks para Clientes (tabela legado)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesApi, Cliente, UpdateClienteDto } from '@/services/adminApi'

// Query keys
const CLIENTES_KEY = ['clientes']

// Hook para listar todos os clientes
export const useClientes = () => {
  return useQuery<Cliente[], Error>({
    queryKey: CLIENTES_KEY,
    queryFn: clientesApi.getAll
  })
}

// Hook para criar cliente
export const useCreateCliente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ squadId, data }: { squadId: string; data: { nome: string; email: string; senha: string } }) =>
      clientesApi.create(squadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY })
    }
  })
}

// Hook para atualizar cliente
export const useUpdateCliente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClienteDto }) =>
      clientesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY })
    }
  })
}

// Hook para deletar cliente
export const useDeleteCliente = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ squadId, clienteId }: { squadId: string; clienteId: string }) =>
      clientesApi.delete(squadId, clienteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY })
    }
  })
}
