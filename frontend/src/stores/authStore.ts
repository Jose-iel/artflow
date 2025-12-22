import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiPost } from '@/services/api'

// Types
export type UserRole = 'CLIENT' | 'SUPER_USER'

export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface LoginCredentials {
  email: string
  senha: string
}

export interface RegisterCredentials {
  nome: string
  email: string
  senha: string
}

export interface LoginResponse {
  message: string
  token: string
  cliente: {
    id: string
    name: string
    email: string
    active: boolean
    role: string
    createdAt: string
    updatedAt: string
  }
}

export interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
  hasRole: (role: UserRole) => boolean
  updateUser: (userData: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
  
  login: async (credentials: LoginCredentials) => {
    try {
      const response: LoginResponse = await apiPost('/auth/login', credentials)
      
      // Map backend fields to frontend interface
      const mappedUser: User = {
        id: response.cliente.id,
        nome: response.cliente.name,
        email: response.cliente.email,
        role: response.cliente.role as UserRole,
        ativo: response.cliente.active,
        criadoEm: response.cliente.createdAt,
        atualizadoEm: response.cliente.updatedAt
      }
      
      set({
        user: mappedUser,
        token: response.token,
        isAuthenticated: true
      })
    } catch (error) {
      // Ensure store is reset on failed login
      set({
        user: null,
        token: null,
        isAuthenticated: false
      })
      throw error
    }
  },
  
  register: async (credentials: RegisterCredentials) => {
    try {
      const response: LoginResponse = await apiPost('/auth/register', credentials)
      
      // Map backend fields to frontend interface
      const mappedUser: User = {
        id: response.cliente.id,
        nome: response.cliente.name,
        email: response.cliente.email,
        role: response.cliente.role as UserRole,
        ativo: response.cliente.active,
        criadoEm: response.cliente.createdAt,
        atualizadoEm: response.cliente.updatedAt
      }
      
      set({
        user: mappedUser,
        token: response.token,
        isAuthenticated: true
      })
    } catch (error) {
      // Ensure store is reset on failed registration
      set({
        user: null,
        token: null,
        isAuthenticated: false
      })
      throw error
    }
  },
  
  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false
    })
    // Clear any stored auth data
    localStorage.removeItem('auth-storage')
  },
  
  hasRole: (role: UserRole) => {
    const { user } = get()
    return user?.role === role
  },
  
  updateUser: (userData: Partial<User>) => {
    const { user } = get()
    console.log('updateUser called with:', userData)
    console.log('Current user:', user)
    if (user) {
      const updatedUser = { ...user, ...userData }
      console.log('Setting user to:', updatedUser)
      set({
        user: updatedUser
      })
      console.log('User updated in store')
    }
  }
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name)
          return item ? JSON.parse(item) : null
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      }
    }
  )
)
