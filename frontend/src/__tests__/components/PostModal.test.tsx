import { render, screen } from '@/__tests__/test-utils'
import { PostModal } from '@/features/posts/components/PostModal'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('PostModal Component', () => {
  const mockPost = {
    id: '1',
    imagemUrl: 'https://drive.google.com/file/d/ABC123/view',
    legenda: 'Test post',
    dataAgendada: null,
    status: 'Pendente',
    comentarioCliente: null,
    comentarioAdmin: null,
    criadoEm: new Date().toISOString(),
  }

  const mockOnClose = vi.fn()
  const mockOnUpdateStatus = vi.fn()

  beforeEach(() => {
    // Ensure IntersectionObserver is properly mocked
    if (!globalThis.IntersectionObserver) {
      globalThis.IntersectionObserver = class IntersectionObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any
    }
  })

  it('should render mobile image with referrerPolicy="no-referrer"', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    )

    // Busca todas as imagens renderizadas
    const images = screen.getAllByRole('img')
    
    // Verifica que pelo menos uma imagem tem referrerPolicy="no-referrer"
    const hasReferrerPolicy = images.some(
      (img) => img.getAttribute('referrerpolicy') === 'no-referrer'
    )
    
    expect(hasReferrerPolicy).toBe(true)
  })

  it('should render mobile actions container with safe-area padding', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    )

    // Busca o container de ações mobile pelo texto "Ações do Post"
    const actionsTitle = screen.getAllByText('Ações do Post')[0]
    const actionsContainer = actionsTitle.closest('.bg-white')
    
    expect(actionsContainer).toBeTruthy()
    
    // Verifica que o container tem a classe de safe-area padding
    const hasClass = actionsContainer?.className.includes('pb-[calc(1.5rem+env(safe-area-inset-bottom))]')
    
    expect(hasClass).toBe(true)
  })

  it('should render action buttons in mobile layout', () => {
    render(
      <PostModal
        post={mockPost}
        isOpen={true}
        onClose={mockOnClose}
        onUpdateStatus={mockOnUpdateStatus}
      />
    )

    // Verifica que os botões de ação estão presentes (mobile e desktop)
    const actionButtons = screen.getAllByText('Selecionar uma Ação')
    const cancelButtons = screen.getAllByText('Cancelar')
    
    expect(actionButtons.length).toBeGreaterThan(0)
    expect(cancelButtons.length).toBeGreaterThan(0)
  })
})
