import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils'
import { LoginForm } from '@/features/auth'
import { useAuthStore } from '@/stores/authStore'
import { vi } from 'vitest'

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('LoginForm Component', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
      hasRole: vi.fn()
    })
  })

  describe('Initial Render', () => {
    it('should render login form with all fields', () => {
      // Arrange & Act
      render(<LoginForm />)

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
      expect(screen.getByText(/ou/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /cadastre-se/i })).toBeInTheDocument()
    })

    it('should have submit button disabled initially', () => {
      // Arrange & Act
      render(<LoginForm />)

      // Assert
      const submitButton = screen.getByRole('button', { name: /entrar/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('should enable submit button when fields are filled', async () => {
      // Arrange
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      // Act
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Assert
      expect(submitButton).not.toBeDisabled()
    })

    it('should show email validation error', async () => {
      // Arrange
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email/i)

      // Act
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
      })
    })

    it('should show password validation error', async () => {
      // Arrange
      render(<LoginForm />)
      const passwordInput = screen.getByLabelText(/senha/i)

      // Act
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.blur(passwordInput)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/senha deve ter pelo menos 8 caracteres/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call auth store login with correct credentials', async () => {
      // Arrange
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      // Act
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          senha: 'password123'
        })
      })
    })

    it('should show loading state during submission', async () => {
      // Arrange
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      // Act
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Assert
      expect(screen.getByRole('button', { name: /entrando\.\.\./i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /entrando\.\.\./i })).toBeDisabled()
    })

    it('should show error message on login failure', async () => {
      // Arrange
      mockLogin.mockRejectedValue(new Error('Credenciais inválidas'))
      render(<LoginForm />)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/senha/i)
      const submitButton = screen.getByRole('button', { name: /entrar/i })

      // Act
      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should have link to register page', () => {
      // Arrange & Act
      render(<LoginForm />)

      // Assert
      const registerLink = screen.getByRole('link', { name: /cadastre-se/i })
      expect(registerLink).toHaveAttribute('href', '/register')
    })
  })
})
