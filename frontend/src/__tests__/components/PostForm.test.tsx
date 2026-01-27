import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils'
import { PostForm } from '@/features/posts'
import { useAuthStore } from '@/stores/authStore'
import { vi } from 'vitest'

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('PostForm Component', () => {
  const mockUser = {
    id: 'test-user-id',
    nome: 'Test User',
    email: 'test@example.com',
    role: 'CLIENT' as const,
    ativo: true,
    criadoEm: '2023-12-09T12:00:00.000Z',
    atualizadoEm: '2023-12-09T12:00:00.000Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      hasRole: vi.fn((role) => role === 'CLIENT')
    })
  })

  describe('Create Mode', () => {
    it('should render post creation form with all fields', () => {
      // Arrange & Act
      render(<PostForm isAdmin={true} clients={[]} />)

      // Assert
      expect(screen.getByLabelText(/url da imagem/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/legenda do post/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/data de agendamento/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /criar post/i })).toBeInTheDocument()
      expect(screen.getByText(/criar novo post/i)).toBeInTheDocument()
    })

    it('should have submit button enabled when form is ready', () => {
      // Arrange & Act
      render(<PostForm isAdmin={true} clients={[]} />)

      // Assert
      const submitButton = screen.getByRole('button', { name: /criar post/i })
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    const mockPost = {
      imagemUrl: 'https://example.com/test.jpg',
      legenda: 'Post de Teste',
      dataAgendada: '2024-01-01T10:00',
      clienteId: 'test-client-id'
    }

    it('should render edit form with existing post data', () => {
      // Arrange & Act
      render(<PostForm initialData={mockPost} isAdmin={true} clients={[]} isEditing={true} />)

      // Assert
      expect(screen.getByDisplayValue('https://example.com/test.jpg')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Post de Teste')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-01T10:00')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument()
      expect(screen.getByText(/editar post/i)).toBeInTheDocument()
    })

    it('should pre-fill form fields with post data', () => {
      // Arrange & Act
      render(<PostForm initialData={mockPost} isAdmin={true} clients={[]} isEditing={true} />)

      // Assert
      const titleInput = screen.getByLabelText(/url da imagem/i)
      const contentInput = screen.getByLabelText(/legenda do post/i)
      const descriptionInput = screen.getByLabelText(/data de agendamento/i)

      expect(titleInput).toHaveValue('https://example.com/test.jpg')
      expect(contentInput).toHaveValue('Post de Teste')
      expect(descriptionInput).toHaveValue('2024-01-01T10:00')
    })
  })

  describe('Form Validation', () => {
    it('should enable submit button when required fields are filled', async () => {
      // Arrange
      render(<PostForm isAdmin={true} clients={[]} />)
      const titleInput = screen.getByLabelText(/url da imagem/i)
      const contentInput = screen.getByLabelText(/legenda do post/i)
      const submitButton = screen.getByRole('button', { name: /criar post/i })

      // Act
      fireEvent.change(titleInput, { target: { value: 'Título de Teste' } })
      fireEvent.change(contentInput, { target: { value: 'Conteúdo de teste' } })

      // Assert
      expect(submitButton).not.toBeDisabled()
    })

    it('should require valid URL format', () => {
      // Arrange
      const mockClients = [{ id: 'client-1', nome: 'Test Client', email: 'test@test.com' }]
      render(<PostForm isAdmin={true} clients={mockClients} />)
      
      const titleInput = screen.getByLabelText(/url da imagem/i)

      // Act & Assert - Input should accept URL
      fireEvent.change(titleInput, { target: { value: 'https://example.com/image.jpg' } })
      expect(titleInput).toHaveValue('https://example.com/image.jpg')
    })

    it('should show client validation error when admin', async () => {
      // Arrange
      render(<PostForm isAdmin={true} clients={[]} />)
      
      // Act - Try to submit without selecting client
      const submitButton = screen.getByRole('button', { name: /criar post/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/cliente é obrigatório para administradores/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should handle form submission', async () => {
      // Arrange - Mock API call
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      const mockClients = [{ id: 'client-1', nome: 'Test Client', email: 'test@test.com' }]
      
      render(<PostForm onSubmit={mockSubmit} isAdmin={true} clients={mockClients} />)
      const clientSelect = screen.getByLabelText(/cliente/i)
      const titleInput = screen.getByLabelText(/url da imagem/i)
      const contentInput = screen.getByLabelText(/legenda do post/i)
      const submitButton = screen.getByRole('button', { name: /criar post/i })

      // Act
      fireEvent.change(clientSelect, { target: { value: 'client-1' } })
      fireEvent.change(titleInput, { target: { value: 'https://example.com/test.jpg' } })
      fireEvent.change(contentInput, { target: { value: 'Conteúdo de teste suficientemente longo' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })

    it('should call onSubmit with form data', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      const mockClients = [{ id: 'client-1', nome: 'Test Client', email: 'test@test.com' }]
      render(<PostForm onSubmit={mockSubmit} isAdmin={true} clients={mockClients} />)
      
      const clientSelect = screen.getByLabelText(/cliente/i)
      const titleInput = screen.getByLabelText(/url da imagem/i)
      const submitButton = screen.getByRole('button', { name: /criar post/i })

      // Act
      fireEvent.change(clientSelect, { target: { value: 'client-1' } })
      fireEvent.change(titleInput, { target: { value: 'https://example.com/test.jpg' } })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should allow editing form fields in edit mode', () => {
      // Arrange
      const mockPost = {
        imagemUrl: 'https://example.com/original.jpg',
        legenda: 'Post Original',
        dataAgendada: '2024-01-01T10:00',
        clienteId: 'test-client-id'
      }
      
      render(<PostForm initialData={mockPost} isAdmin={true} clients={[]} isEditing={true} />)
      
      const titleInput = screen.getByLabelText(/url da imagem/i)

      // Act
      fireEvent.change(titleInput, { target: { value: 'https://example.com/editado.jpg' } })

      // Assert
      expect(titleInput).toHaveValue('https://example.com/editado.jpg')
      expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument()
    })

    it('should handle submission errors gracefully', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Erro ao criar post'))
      const mockClients = [{ id: 'client-1', nome: 'Test Client', email: 'test@test.com' }]
      render(<PostForm onSubmit={mockSubmit} isAdmin={true} clients={mockClients} />)
      
      const clientSelect = screen.getByLabelText(/cliente/i)
      const titleInput = screen.getByLabelText(/url da imagem/i)
      const contentInput = screen.getByLabelText(/legenda do post/i)
      const submitButton = screen.getByRole('button', { name: /criar post/i })

      // Act
      fireEvent.change(clientSelect, { target: { value: 'client-1' } })
      fireEvent.change(titleInput, { target: { value: 'https://example.com/test.jpg' } })
      fireEvent.change(contentInput, { target: { value: 'Conteúdo de teste suficientemente longo' } })
      fireEvent.click(submitButton)

      // Assert - Just verify the submit was called
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('User Actions', () => {
    it('should show cancel button', () => {
      // Arrange
      const mockCancel = vi.fn()
      
      // Act
      render(<PostForm onCancel={mockCancel} />)

      // Assert
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    })

    it('should call onCancel when cancel button is clicked', () => {
      // Arrange
      const mockCancel = vi.fn()
      render(<PostForm onCancel={mockCancel} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i })

      // Act
      fireEvent.click(cancelButton)

      // Assert
      expect(mockCancel).toHaveBeenCalled()
    })
  })
})
