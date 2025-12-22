import { act } from '@testing-library/react'
import { createMockUser, createMockAdmin } from '@/__tests__/test-utils'
import { useAuthStore } from '@/stores/authStore'
import { vi } from 'vitest'

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      // Arrange
      const store = useAuthStore.getState()

      // Assert
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBeFalsy()
    })
  })

  describe('Login functionality', () => {
    it('should set user and token on successful login', async () => {
      // Arrange
      const mockUser = createMockUser()
      const mockToken = 'mock-client-jwt-token' // Token from MSW response
      
      // Act
      await act(async () => {
        await useAuthStore.getState().login({
          email: mockUser.email,
          senha: 'password123'
        })
      })

      // Assert - Re-fetch state after mutation
      const store = useAuthStore.getState()
      expect(store.user).toEqual(mockUser)
      expect(store.token).toBe(mockToken)
      expect(store.isAuthenticated).toBeTruthy()
    })

    it('should handle admin login correctly', async () => {
      // Arrange
      const mockAdmin = createMockAdmin()

      // Act
      await act(async () => {
        await useAuthStore.getState().login({
          email: mockAdmin.email,
          senha: 'password123'
        })
      })

      // Assert - Re-fetch state after mutation
      const store = useAuthStore.getState()
      expect(store.user?.role).toBe('SUPER_USER')
      expect(store.hasRole('SUPER_USER')).toBeTruthy()
      expect(store.hasRole('CLIENT')).toBeFalsy()
    })

    it('should handle login failure gracefully', async () => {
      // Arrange
      const store = useAuthStore.getState()
      
      // Act & Assert
      await expect(
        act(async () => {
          await store.login({
            email: 'invalid@example.com',
            senha: 'wrongpassword'
          })
        })
      ).rejects.toThrow('Credenciais inválidas')

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBeFalsy()
    })
  })

  describe('Logout functionality', () => {
    it('should clear user data on logout', async () => {
      // Arrange
      const mockUser = createMockUser()
      
      // First login
      await act(async () => {
        await useAuthStore.getState().login({
          email: mockUser.email,
          senha: 'password123'
        })
      })

      // Act - await previous act before new one
      await act(async () => {
        useAuthStore.getState().logout()
      })

      // Assert - Re-fetch state after mutation
      const store = useAuthStore.getState()
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBeFalsy()
    })

    it('should handle logout when not logged in', () => {
      // Arrange
      const store = useAuthStore.getState()

      // Act
      act(() => {
        store.logout()
      })

      // Assert - Should not throw error
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBeFalsy()
    })
  })

  describe('Role checking', () => {
    it('should correctly check user roles', async () => {
      // Arrange
      const mockAdmin = createMockAdmin()

      // Act
      await act(async () => {
        await useAuthStore.getState().login({
          email: mockAdmin.email,
          senha: 'password123'
        })
      })

      // Assert - Re-fetch state after mutation
      const store = useAuthStore.getState()
      expect(store.hasRole('SUPER_USER')).toBeTruthy()
      expect(store.hasRole('CLIENT')).toBeFalsy()
    })

    it('should return false for roles when not authenticated', () => {
      // Arrange
      const store = useAuthStore.getState()

      // Act & Assert
      expect(store.hasRole('SUPER_USER')).toBeFalsy()
      expect(store.hasRole('CLIENT')).toBeFalsy()
    })
  })

  describe('Update User functionality', () => {
    it('should update user data when authenticated', async () => {
      // Arrange
      const mockUser = createMockUser()
      
      await act(async () => {
        await useAuthStore.getState().login({
          email: mockUser.email,
          senha: 'password123'
        })
      })

      const store = useAuthStore.getState()
      const originalUser = store.user!

      // Act
      act(() => {
        store.updateUser({
          nome: 'Updated Name',
          email: 'updated@example.com'
        })
      })

      // Assert
      const updatedStore = useAuthStore.getState()
      expect(updatedStore.user?.nome).toBe('Updated Name')
      expect(updatedStore.user?.email).toBe('updated@example.com')
      expect(updatedStore.user?.id).toBe(originalUser.id) // Other fields unchanged
      expect(updatedStore.user?.role).toBe(originalUser.role)
    })

    it('should not update when user is not authenticated', () => {
      // Arrange
      const store = useAuthStore.getState()
      expect(store.user).toBeNull()

      // Act - should not throw error
      act(() => {
        store.updateUser({
          nome: 'Updated Name',
          email: 'updated@example.com'
        })
      })

      // Assert - user should still be null
      const updatedStore = useAuthStore.getState()
      expect(updatedStore.user).toBeNull()
    })

    it('should merge partial updates correctly', async () => {
      // Arrange
      const mockUser = createMockUser()
      
      await act(async () => {
        await useAuthStore.getState().login({
          email: mockUser.email,
          senha: 'password123'
        })
      })

      const store = useAuthStore.getState()
      const originalUser = store.user!

      // Act - update only name
      act(() => {
        store.updateUser({
          nome: 'New Name Only'
        })
      })

      // Assert
      const updatedStore = useAuthStore.getState()
      expect(updatedStore.user?.nome).toBe('New Name Only')
      expect(updatedStore.user?.email).toBe(originalUser.email) // Email unchanged
      expect(updatedStore.user?.id).toBe(originalUser.id) // ID unchanged
    })
  })
})
