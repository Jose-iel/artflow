import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils'
import { PostForm } from '@/features/posts'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'

describe('PostForm Component', () => {
  const mockClients = [
    { id: 'client-1', nome: 'Client 1', email: 'client1@test.com', squadId: 'squad-1' },
    { id: 'client-2', nome: 'Client 2', email: 'client2@test.com', squadId: 'squad-1' }
  ]

  const mockEmpresas = [
    { id: 'empresa-1', nome: 'Empresa 1' },
    { id: 'empresa-2', nome: 'Empresa 2' }
  ]

  const mockSquads = [
    { id: 'squad-1', nome: 'Squad 1', empresaId: 'empresa-1' },
    { id: 'squad-2', nome: 'Squad 2', empresaId: 'empresa-1' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode - Funcionario', () => {
    it('should render post creation form with all fields for funcionario', () => {
      render(<PostForm isFuncionario={true} funcionarioSquadId="squad-1" clients={mockClients} />)

      expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/url da mídia/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/legenda do post/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/data de agendamento/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/status do post/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /criar post/i })).toBeInTheDocument()
    })

    it('should render empresa and squad selects for admin master', () => {
      render(<PostForm isAdminMaster={true} empresas={mockEmpresas} squads={mockSquads} clients={mockClients} />)

      expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/squad/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    const mockPost = {
      imagemUrl: 'https://example.com/test.jpg',
      legenda: 'Post de Teste',
      dataAgendada: '2024-01-01T10:00',
      clienteId: 'client-1',
      squadId: 'squad-1',
      status: 'Aprovado'
    }

    it('should render edit form with existing post data', () => {
      render(<PostForm initialData={mockPost} isFuncionario={true} clients={mockClients} isEditing={true} />)

      expect(screen.getByDisplayValue('https://example.com/test.jpg')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Post de Teste')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-01T10:00')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument()
      expect(screen.getByText(/editar post/i)).toBeInTheDocument()
    })

    it('should pre-fill form fields with post data', () => {
      render(<PostForm initialData={mockPost} isFuncionario={true} clients={mockClients} isEditing={true} />)

      const imageInput = screen.getByLabelText(/url da mídia/i)
      const legendaInput = screen.getByLabelText(/legenda do post/i)
      const dataInput = screen.getByLabelText(/data de agendamento/i)

      expect(imageInput).toHaveValue('https://example.com/test.jpg')
      expect(legendaInput).toHaveValue('Post de Teste')
      expect(dataInput).toHaveValue('2024-01-01T10:00')
    })

    it('should show client name as disabled field in edit mode', () => {
      render(<PostForm initialData={mockPost} isFuncionario={true} clients={mockClients} isEditing={true} />)

      expect(screen.getByText('Client 1')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for missing URL', async () => {
      const mockSubmit = vi.fn()
      render(<PostForm onSubmit={mockSubmit} isFuncionario={true} clients={mockClients} />)
      
      const submitButton = screen.getByRole('button', { name: /criar post/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/url da imagem é obrigatória/i)).toBeInTheDocument()
      })
      expect(mockSubmit).not.toHaveBeenCalled()
    })

    it('should accept valid URL format', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      render(<PostForm onSubmit={mockSubmit} isFuncionario={true} clients={mockClients} />)
      
      const imageInput = screen.getByLabelText(/url da mídia/i)
      const clientSelect = screen.getByLabelText(/cliente/i)
      
      fireEvent.change(clientSelect, { target: { value: 'client-1' } })
      fireEvent.change(imageInput, { target: { value: 'https://example.com/image.jpg' } })
      
      expect(imageInput).toHaveValue('https://example.com/image.jpg')
    })

    it('should show validation error when cliente not selected', async () => {
      const mockSubmit = vi.fn()
      render(<PostForm onSubmit={mockSubmit} isFuncionario={true} clients={mockClients} />)
      
      const imageInput = screen.getByLabelText(/url da mídia/i)
      fireEvent.change(imageInput, { target: { value: 'https://example.com/test.jpg' } })
      
      const submitButton = screen.getByRole('button', { name: /criar post/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/cliente é obrigatório/i)).toBeInTheDocument()
      })
    })

    it('should validate empresa and squad for admin master', async () => {
      const mockSubmit = vi.fn()
      render(<PostForm onSubmit={mockSubmit} isAdminMaster={true} empresas={mockEmpresas} squads={mockSquads} clients={mockClients} />)
      
      const imageInput = screen.getByLabelText(/url da mídia/i)
      fireEvent.change(imageInput, { target: { value: 'https://example.com/test.jpg' } })
      
      const submitButton = screen.getByRole('button', { name: /criar post/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/empresa é obrigatória/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data for funcionario', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      render(<PostForm onSubmit={mockSubmit} isFuncionario={true} funcionarioSquadId="squad-1" clients={mockClients} />)
      
      const clientSelect = screen.getByLabelText(/cliente/i)
      const imageInput = screen.getByLabelText(/url da mídia/i)
      const legendaInput = screen.getByLabelText(/legenda do post/i)
      const submitButton = screen.getByRole('button', { name: /criar post/i })

      fireEvent.change(clientSelect, { target: { value: 'client-1' } })
      fireEvent.change(imageInput, { target: { value: 'https://example.com/test.jpg' } })
      fireEvent.change(legendaInput, { target: { value: 'Legenda teste' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            imagemUrl: 'https://example.com/test.jpg',
            legenda: 'Legenda teste',
            clienteId: 'client-1',
            squadId: 'squad-1'
          })
        )
      })
    })

    it('should submit form with empresa and squad for admin master', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      render(<PostForm onSubmit={mockSubmit} isAdminMaster={true} empresas={mockEmpresas} squads={mockSquads} clients={mockClients} />)
      
      const empresaSelect = screen.getByLabelText(/empresa/i)
      await user.selectOptions(empresaSelect, 'empresa-1')
      
      const squadSelect = screen.getByLabelText(/squad/i)
      await user.selectOptions(squadSelect, 'squad-1')
      
      const clientSelect = screen.getByLabelText(/cliente/i)
      await user.selectOptions(clientSelect, 'client-1')
      
      const imageInput = screen.getByLabelText(/url da mídia/i)
      await user.type(imageInput, 'https://example.com/test.jpg')
      
      const submitButton = screen.getByRole('button', { name: /criar post/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            imagemUrl: 'https://example.com/test.jpg',
            clienteId: 'client-1',
            squadId: 'squad-1'
          })
        )
      })
    })

    it('should handle submission errors gracefully', async () => {
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Erro ao criar post'))
      render(<PostForm onSubmit={mockSubmit} isFuncionario={true} clients={mockClients} />)
      
      const clientSelect = screen.getByLabelText(/cliente/i)
      const imageInput = screen.getByLabelText(/url da mídia/i)
      const submitButton = screen.getByRole('button', { name: /criar post/i })

      fireEvent.change(clientSelect, { target: { value: 'client-1' } })
      fireEvent.change(imageInput, { target: { value: 'https://example.com/test.jpg' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/erro ao criar post/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Actions', () => {
    it('should show cancel button when onCancel provided', () => {
      const mockCancel = vi.fn()
      render(<PostForm onCancel={mockCancel} isFuncionario={true} clients={mockClients} />)

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    })

    it('should call onCancel when cancel button is clicked', () => {
      const mockCancel = vi.fn()
      render(<PostForm onCancel={mockCancel} isFuncionario={true} clients={mockClients} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      expect(mockCancel).toHaveBeenCalled()
    })

    it('should show delete button in edit mode', () => {
      const mockDelete = vi.fn()
      const mockPost = {
        imagemUrl: 'https://example.com/test.jpg',
        legenda: 'Test',
        dataAgendada: null,
        clienteId: 'client-1'
      }
      
      render(<PostForm onDelete={mockDelete} initialData={mockPost} isEditing={true} isFuncionario={true} clients={mockClients} />)

      expect(screen.getByRole('button', { name: /excluir post/i })).toBeInTheDocument()
    })

    it('should toggle preview mode between post and story', () => {
      render(<PostForm isFuncionario={true} clients={mockClients} />)

      const storyButton = screen.getByRole('button', { name: /story.*reels/i })
      fireEvent.click(storyButton)

      expect(storyButton).toHaveClass('bg-white')
    })
  })
})
