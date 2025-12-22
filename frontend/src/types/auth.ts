// UserRole enum to match backend
export enum UserRole {
  CLIENT = 'CLIENT',
  SUPER_USER = 'SUPER_USER'
}

// Re-export types from auth store for component usage
export type { User, LoginCredentials, RegisterCredentials, LoginResponse } from '@/stores/authStore'
