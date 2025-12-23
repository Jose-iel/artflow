// React Query hooks para Squads
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { squadsApi } from '@/services/adminApi'
import type { CreateSquadDto, UpdateSquadDto } from '@/types/admin'

const SQUADS_KEY = ['squads']

export const useSquads = () => {
  return useQuery({
    queryKey: SQUADS_KEY,
    queryFn: squadsApi.getAll
  })
}

export const useSquad = (id: string) => {
  return useQuery({
    queryKey: [...SQUADS_KEY, id],
    queryFn: () => squadsApi.getById(id),
    enabled: !!id
  })
}

export const useSquadMembers = (id: string) => {
  return useQuery({
    queryKey: [...SQUADS_KEY, id, 'members'],
    queryFn: () => squadsApi.getMembers(id),
    enabled: !!id
  })
}

export const useCreateSquad = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSquadDto) => squadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SQUADS_KEY })
    }
  })
}

export const useUpdateSquad = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSquadDto }) =>
      squadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SQUADS_KEY })
    }
  })
}

export const useDeleteSquad = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => squadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SQUADS_KEY })
    }
  })
}

export const useAddFuncionarioToSquad = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ squadId, usuarioId }: { squadId: string; usuarioId: string }) =>
      squadsApi.addFuncionario(squadId, usuarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SQUADS_KEY })
    }
  })
}

export const useRemoveFuncionarioFromSquad = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ squadId, usuarioId }: { squadId: string; usuarioId: string }) =>
      squadsApi.removeFuncionario(squadId, usuarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SQUADS_KEY })
    }
  })
}
