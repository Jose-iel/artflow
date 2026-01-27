import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileForm } from '@/features/profile'
import { createMockUser, createMockAdmin, render } from '@/__tests__/test-utils'
import { apiPut } from '@/services/api'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the API service
vi.mock('@/services/api', () => ({
  apiPut: vi.fn()
}))

// @ts-ignore
const mockApiPut = apiPut as vi.MockedFunction<typeof apiPut>

describe('Profile Component', () => {
  const mockUser = createMockUser()
  const mockAdmin = createMockAdmin()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Profile Viewing', () => {
    it('should display user information correctly', () => {
      // Arrange
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Assert
      expect(screen.getByText('Meu Perfil')).toBeInTheDocument()
      expect(screen.getByText(mockUser.nome)).toBeInTheDocument()
      expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      expect(screen.getByText('Cliente')).toBeInTheDocument()
      expect(screen.getByText('Membro desde')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    })

    it('should display admin user information correctly', () => {
      // Arrange
      render(<ProfileForm />, {
        authStore: {
          user: mockAdmin,
          isAuthenticated: true
        }
      })

      // Assert
      expect(screen.getByText(mockAdmin.nome)).toBeInTheDocument()
      expect(screen.getByText(mockAdmin.email)).toBeInTheDocument()
      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })

    it('should show loading state when user is null', () => {
      // Arrange
      render(<ProfileForm />, {
        authStore: {
          user: null,
          isAuthenticated: true
        }
      })

      // Assert
      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })
  })

  describe('Profile Editing', () => {
    it('should enable edit mode when Editar button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Editar' }))

      // Assert
      expect(screen.getByDisplayValue(mockUser.nome)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })

    it('should disable email field for client role', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Editar' }))

      // Assert
      const emailInput = screen.getByDisplayValue(mockUser.email)
      expect(emailInput).toBeDisabled()
      expect(screen.getByText('Email não pode ser alterado. Contate o administrador se precisar atualizar.')).toBeInTheDocument()
    })

    it('should keep email field disabled even for admin role', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockAdmin,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Editar' }))

      // Assert
      const emailInput = screen.getByDisplayValue(mockAdmin.email)
      expect(emailInput).toBeDisabled()
    })

    it('should save profile changes successfully', async () => {
      // Arrange
      const user = userEvent.setup()
      const updatedUser = { ...mockUser, nome: 'Updated Name' }
      
      mockApiPut.mockResolvedValueOnce({
        message: 'Perfil atualizado com sucesso',
        cliente: updatedUser
      })

      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true,
          updateUser: vi.fn()
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Editar' }))
      
      const nameInput = screen.getByDisplayValue(mockUser.nome)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')
      
      await user.click(screen.getByRole('button', { name: 'Salvar' }))

      // Assert
      await waitFor(() => {
        expect(mockApiPut).toHaveBeenCalledWith('/auth/profile', {
          nome: 'Updated Name',
          email: mockUser.email
        })
      })

      expect(screen.getByText('Perfil atualizado com sucesso!')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument()
    })

    it('should validate form fields before submission', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Editar' }))
      
      const nameInput = screen.getByDisplayValue(mockUser.nome)
      await user.clear(nameInput) // Clear name
      
      await user.click(screen.getByRole('button', { name: 'Salvar' }))

      // Assert
      expect(screen.getByText('Nome e email são obrigatórios')).toBeInTheDocument()
      expect(mockApiPut).not.toHaveBeenCalled()
    })

    it('should cancel editing and restore original values', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Editar' }))
      
      const nameInput = screen.getByDisplayValue(mockUser.nome)
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Name')
      
      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      // Assert
      const profileSection = screen.getByText('Informações Pessoais').closest('.bg-white')
      const userNameInProfile = profileSection?.querySelector('p.text-gray-900')
      expect(userNameInProfile).toHaveTextContent(mockUser.nome)
      expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      // Arrange
      const user = userEvent.setup()
      mockApiPut.mockRejectedValueOnce(new Error('API Error'))

      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Editar' }))
      await user.click(screen.getByRole('button', { name: 'Salvar' }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })
    })
  })

  describe('Password Change', () => {
    it('should enable password change mode when Alterar Senha button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))

      // Assert
      expect(screen.getByLabelText('Senha Atual')).toBeInTheDocument()
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar Nova Senha')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Alterar Senha' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })

    it('should validate password fields before submission', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))

      // Assert
      expect(screen.getByText('Todos os campos de senha são obrigatórios')).toBeInTheDocument()
      expect(mockApiPut).not.toHaveBeenCalledWith('/auth/password', expect.any(Object))
    })

    it('should validate password length', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))
      
      const currentPasswordInput = screen.getByLabelText('Senha Atual')
      const newPasswordInput = screen.getByLabelText('Nova Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nova Senha')
      
      await user.type(currentPasswordInput, 'current123')
      await user.type(newPasswordInput, '123') // Too short
      await user.type(confirmPasswordInput, '123')
      
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))

      // Assert
      expect(screen.getByText('A nova senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
    })

    it('should validate password confirmation', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))
      
      const currentPasswordInput = screen.getByLabelText('Senha Atual')
      const newPasswordInput = screen.getByLabelText('Nova Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nova Senha')
      
      await user.type(currentPasswordInput, 'current123')
      await user.type(newPasswordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'differentpassword123')
      
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))

      // Assert
      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument()
    })

    it('should change password successfully', async () => {
      // Arrange
      const user = userEvent.setup()
      mockApiPut.mockResolvedValueOnce({
        message: 'Senha alterada com sucesso'
      })

      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))
      
      const currentPasswordInput = screen.getByLabelText('Senha Atual')
      const newPasswordInput = screen.getByLabelText('Nova Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nova Senha')
      
      await user.type(currentPasswordInput, 'current123')
      await user.type(newPasswordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'newpassword123')
      
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))

      // Assert
      await waitFor(() => {
        expect(mockApiPut).toHaveBeenCalledWith('/auth/password', {
          currentPassword: 'current123',
          newPassword: 'newpassword123'
        })
      })

      expect(screen.getByText('Senha alterada com sucesso!')).toBeInTheDocument()
      expect(screen.getByText('Clique em "Alterar Senha" para atualizar sua senha de acesso.')).toBeInTheDocument()
    })

    it('should cancel password change and clear fields', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))
      
      const currentPasswordInput = screen.getByLabelText('Senha Atual')
      await user.type(currentPasswordInput, 'current123')
      
      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      // Assert
      expect(screen.getByText('Clique em "Alterar Senha" para atualizar sua senha de acesso.')).toBeInTheDocument()
      expect(screen.queryByLabelText('Senha Atual')).not.toBeInTheDocument()
    })

    it('should handle password change API errors gracefully', async () => {
      // Arrange
      const user = userEvent.setup()
      mockApiPut.mockRejectedValueOnce(new Error('Senha atual incorreta'))

      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Act
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))
      
      const currentPasswordInput = screen.getByLabelText('Senha Atual')
      const newPasswordInput = screen.getByLabelText('Nova Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar Nova Senha')
      
      await user.type(currentPasswordInput, 'wrongpassword')
      await user.type(newPasswordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'newpassword123')
      
      await user.click(screen.getByRole('button', { name: 'Alterar Senha' }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Senha atual incorreta')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should be accessible on mobile devices', () => {
      // Arrange - Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      // Act
      render(<ProfileForm />, {
        authStore: {
          user: mockUser,
          isAuthenticated: true
        }
      })

      // Assert
      expect(screen.getByText('Meu Perfil')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    })
  })
})
