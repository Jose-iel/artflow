import { render, screen, fireEvent } from '@/__tests__/test-utils'
import { MediaCarousel } from '@/components'
import type { MediaItem } from '@/components/MediaCarousel'

describe('MediaCarousel Component', () => {
  const imageMedia: MediaItem[] = [
    { url: '/uploads/a.jpg', mimeType: 'image/jpeg' },
    { url: '/uploads/b.png', mimeType: 'image/png' },
    { url: '/uploads/c.webp', mimeType: 'image/webp' }
  ]

  describe('Empty state', () => {
    it('should render placeholder when media is empty', () => {
      render(<MediaCarousel media={[]} />)
      expect(screen.getByText(/sem mídia/i)).toBeInTheDocument()
    })
  })

  describe('Single media', () => {
    it('should render an image and not show navigation controls', () => {
      render(<MediaCarousel media={[imageMedia[0]]} />)

      expect(screen.getByAltText(/mídia 1 de 1/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/próxima mídia/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/mídia anterior/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/ir para mídia/i)).not.toBeInTheDocument()
    })

    it('should render a video element for video mime types', () => {
      const { container } = render(
        <MediaCarousel media={[{ url: '/uploads/v.mp4', mimeType: 'video/mp4' }]} />
      )
      expect(container.querySelector('video')).toBeInTheDocument()
    })

    it('should render fallback text for unsupported mime types', () => {
      render(<MediaCarousel media={[{ url: '/uploads/f.pdf', mimeType: 'application/pdf' }]} />)
      expect(screen.getByText(/formato não suportado/i)).toBeInTheDocument()
    })
  })

  describe('Multiple media navigation', () => {
    it('should render navigation arrows and dots when more than one item', () => {
      render(<MediaCarousel media={imageMedia} />)

      expect(screen.getByLabelText(/próxima mídia/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mídia anterior/i)).toBeInTheDocument()
      expect(screen.getAllByLabelText(/ir para mídia/i)).toHaveLength(3)
    })

    it('should advance to the next media when clicking the next arrow', () => {
      render(<MediaCarousel media={imageMedia} />)

      expect(screen.getByAltText(/mídia 1 de 3/i)).toBeInTheDocument()
      fireEvent.click(screen.getByLabelText(/próxima mídia/i))
      expect(screen.getByAltText(/mídia 2 de 3/i)).toBeInTheDocument()
    })

    it('should wrap around to the last media when clicking previous on the first item', () => {
      render(<MediaCarousel media={imageMedia} />)

      fireEvent.click(screen.getByLabelText(/mídia anterior/i))
      expect(screen.getByAltText(/mídia 3 de 3/i)).toBeInTheDocument()
    })

    it('should wrap around to the first media when clicking next on the last item', () => {
      render(<MediaCarousel media={imageMedia} />)

      // go to last (index 2)
      fireEvent.click(screen.getByLabelText(/mídia anterior/i))
      expect(screen.getByAltText(/mídia 3 de 3/i)).toBeInTheDocument()

      // next should wrap to first
      fireEvent.click(screen.getByLabelText(/próxima mídia/i))
      expect(screen.getByAltText(/mídia 1 de 3/i)).toBeInTheDocument()
    })

    it('should jump to a specific media when clicking a dot', () => {
      render(<MediaCarousel media={imageMedia} />)

      fireEvent.click(screen.getByLabelText(/ir para mídia 3/i))
      expect(screen.getByAltText(/mídia 3 de 3/i)).toBeInTheDocument()
    })
  })

  describe('Control visibility props', () => {
    it('should hide arrows when showArrows is false', () => {
      render(<MediaCarousel media={imageMedia} showArrows={false} />)
      expect(screen.queryByLabelText(/próxima mídia/i)).not.toBeInTheDocument()
    })

    it('should hide dots when showDots is false', () => {
      render(<MediaCarousel media={imageMedia} showDots={false} />)
      expect(screen.queryByLabelText(/ir para mídia/i)).not.toBeInTheDocument()
    })
  })
})
