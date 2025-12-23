// React Query hooks para Users (Admin Master)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/services/adminApi'
import type { CreateUserDto, UpdateUserDto, AdminUserRole } from '@/types/admin'

const USERS_KEY = ['admin-users']

export const useAdminUsers = () => {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: usersApi.getAll
  })
}

export const useAdminUser = (id: string) => {
  return useQuery({
    queryKey: [...USERS_KEY, id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id
  })
}

export const useAdminUsersByRole = (role?: AdminUserRole) => {
  const { data: users, ...rest } = useAdminUsers()

  const filteredUsers = role
    ? users?.filter((user) => user.role === role)
    : users

  return { data: filteredUsers, ...rest }
}

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    }
  })
}

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    }
  })
}

export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    }
  })
}
