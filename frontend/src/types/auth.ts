// UserRole enum to match backend
export enum UserRole {
  CLIENT = 'CLIENT',
  FUNCIONARIO = 'FUNCIONARIO',
  ADMIN_MASTER = 'ADMIN_MASTER',
  SUPER_USER = 'SUPER_USER' // Legacy - mantido para compatibilidade
}

// Helper para verificar se é admin (ADMIN_MASTER ou SUPER_USER legacy)
export const isAdminRole = (role: UserRole): boolean => {
  return role === UserRole.ADMIN_MASTER || role === UserRole.SUPER_USER
}

// Helper para verificar se pode gerenciar (ADMIN_MASTER, FUNCIONARIO ou SUPER_USER)
export const canManageRole = (role: UserRole): boolean => {
  return role === UserRole.ADMIN_MASTER || role === UserRole.FUNCIONARIO || role === UserRole.SUPER_USER
}

// Re-export types from auth store for component usage
export type { User, LoginCredentials, RegisterCredentials, LoginResponse } from '@/stores/authStore'
