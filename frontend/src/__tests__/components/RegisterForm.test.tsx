import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils'
import { RegisterForm } from '@/components/RegisterForm'
import { useAuthStore } from '@/stores/authStore'
import { vi } from 'vitest'

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('RegisterForm Component', () => {
  const mockRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      user: null,
      token: null,
      isAuthenticated: false,
      hasRole: vi.fn()
    })
  })

  describe('Initial Render', () => {
    it('should render register form with all fields', () => {
      // Arrange & Act
      render(<RegisterForm />)

      // Assert
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument()
      expect(screen.getByText(/já tem uma conta\?/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /entre aqui/i })).toBeInTheDocument()
    })

    it('should have submit button disabled initially', () => {
      // Arrange & Act
      render(<RegisterForm />)

      // Assert
      const submitButton = screen.getByRole('button', { name: /cadastrar/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('should enable submit button when all fields are filled and valid', async () => {
      // Arrange
      render(<RegisterForm />)
      const nameInput = screen.getByLabelText(/nome completo/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^senha$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i)
      const submitButton = screen.getByRole('button', { name: /cadastrar/i })

      // Act
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

      // Assert
      expect(submitButton).not.toBeDisabled()
    })

    it('should show name validation error', async () => {
      // Arrange
      render(<RegisterForm />)
      const nameInput = screen.getByLabelText(/nome completo/i)

      // Act
      fireEvent.change(nameInput, { target: { value: 'T' } })
      fireEvent.blur(nameInput)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/nome deve ter pelo menos 3 caracteres/i)).toBeInTheDocument()
      })
    })

    it('should show email validation error', async () => {
      // Arrange
      render(<RegisterForm />)
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
      render(<RegisterForm />)
      const passwordInput = screen.getByLabelText(/^senha$/i)

      // Act
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.blur(passwordInput)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/senha deve ter pelo menos 8 caracteres/i)).toBeInTheDocument()
      })
    })

    it('should show password mismatch error', async () => {
      // Arrange
      render(<RegisterForm />)
      const passwordInput = screen.getByLabelText(/^senha$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i)

      // Act
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
      fireEvent.blur(confirmPasswordInput)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call auth store register with correct data', async () => {
      // Arrange
      render(<RegisterForm />)
      const nameInput = screen.getByLabelText(/nome completo/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^senha$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i)
      const submitButton = screen.getByRole('button', { name: /cadastrar/i })

      // Act
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          nome: 'Test User',
          email: 'test@example.com',
          senha: 'password123'
        })
      })
    })

    it('should show loading state during submission', async () => {
      // Arrange
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<RegisterForm />)
      const nameInput = screen.getByLabelText(/nome completo/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^senha$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i)
      const submitButton = screen.getByRole('button', { name: /cadastrar/i })

      // Act
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Assert
      expect(screen.getByRole('button', { name: /cadastrando\.\.\./i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cadastrando\.\.\./i })).toBeDisabled()
    })

    it('should show error message on registration failure', async () => {
      // Arrange
      mockRegister.mockRejectedValue(new Error('Email já cadastrado'))
      render(<RegisterForm />)
      const nameInput = screen.getByLabelText(/nome completo/i)
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^senha$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i)
      const submitButton = screen.getByRole('button', { name: /cadastrar/i })

      // Act
      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/email já cadastrado/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should have link to login page', () => {
      // Arrange & Act
      render(<RegisterForm />)

      // Assert
      const loginLink = screen.getByRole('link', { name: /entre aqui/i })
      expect(loginLink).toHaveAttribute('href', '/login')
    })
  })
})
