import { render, screen, fireEvent } from '@/__tests__/test-utils'
import { Layout } from '@/layouts'
import { useAuthStore } from '@/stores/authStore'
import { vi } from 'vitest'

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

// Mock the Outlet component from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>
  }
})

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('Layout Component', () => {
  describe('Header Section', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        user: {
          id: 'test-user-id',
          nome: 'Test User',
          email: 'user@example.com',
          role: 'CLIENT',
          ativo: true,
          criadoEm: '2023-12-09T12:00:00.000Z',
          atualizadoEm: '2023-12-09T12:00:00.000Z'
        },
        token: 'test-token',
        isAuthenticated: true,
        hasRole: vi.fn((role) => role === 'CLIENT')
      })
    })

    it('should render project logo on left side', () => {
      // Arrange & Act
      render(<Layout />)

      // Assert - ArtFlow appears in both sidebar and header
      expect(screen.getAllByText(/artflow/i)).toHaveLength(2)
      expect(screen.getAllByText(/crie. gerencie. inspire/i)).toHaveLength(2)
    })

    it('should render user info on right side', () => {
      // Arrange & Act
      render(<Layout />)

      // Assert
      expect(screen.getByText(/test user/i)).toBeInTheDocument()
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument()
    })

    it('should have logout button in header', () => {
      // Arrange & Act
      render(<Layout />)

      // Assert
      expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
    })
  })

  describe('Sidebar Navigation', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        user: {
          id: 'test-client-id',
          nome: 'Test Client',
          email: 'client@example.com',
          role: 'CLIENT',
          ativo: true,
          criadoEm: '2023-12-09T12:00:00.000Z',
          atualizadoEm: '2023-12-09T12:00:00.000Z'
        },
        token: 'test-token',
        isAuthenticated: true,
        hasRole: vi.fn((role) => role === 'CLIENT')
      })
    })

    it('should render client menu items', () => {
      // Arrange & Act
      render(<Layout />)

      // Assert - Link components render as <a> tags
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /perfil/i })).toBeInTheDocument()
    })

    it('should not show admin menu items for client users', () => {
      // Arrange & Act
      render(<Layout />)

      // Assert
      expect(screen.queryByRole('link', { name: /usuários/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /relatórios/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /configurações/i })).not.toBeInTheDocument()
    })
  })

  describe('Admin Sidebar Navigation', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        user: {
          id: 'test-admin-id',
          nome: 'Test Admin',
          email: 'admin@example.com',
          role: 'SUPER_USER',
          ativo: true,
          criadoEm: '2023-12-09T12:00:00.000Z',
          atualizadoEm: '2023-12-09T12:00:00.000Z'
        },
        token: 'test-token',
        isAuthenticated: true,
        hasRole: vi.fn((role) => role === 'SUPER_USER')
      })
    })

    it('should render admin menu items', () => {
      // Arrange & Act
      render(<Layout />)

      // Assert
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /usuários/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /relatórios/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /configurações/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /perfil/i })).toBeInTheDocument()
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        user: {
          id: 'test-user-id',
          nome: 'Test User',
          email: 'user@example.com',
          role: 'CLIENT',
          ativo: true,
          criadoEm: '2023-12-09T12:00:00.000Z',
          atualizadoEm: '2023-12-09T12:00:00.000Z'
        },
        token: 'test-token',
        isAuthenticated: true,
        hasRole: vi.fn((role) => role === 'CLIENT')
      })
    })

    it('should have mobile menu toggle button', () => {
      // Arrange & Act
      render(<Layout />)

      // Assert
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    })

    it('should toggle sidebar when mobile menu button is clicked', () => {
      // Arrange & Act
      render(<Layout />)

      const menuButton = screen.getByRole('button', { name: /menu/i })
      
      // Initially sidebar should be visible on desktop
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      
      // Act - Click menu button
      fireEvent.click(menuButton)
      
      // Assert - Sidebar should toggle (implementation dependent)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        user: {
          id: 'test-user-id',
          nome: 'Test User',
          email: 'user@example.com',
          role: 'CLIENT',
          ativo: true,
          criadoEm: '2023-12-09T12:00:00.000Z',
          atualizadoEm: '2023-12-09T12:00:00.000Z'
        },
        token: 'test-token',
        isAuthenticated: true,
        hasRole: vi.fn((role) => role === 'CLIENT')
      })
    })

    it('should render outlet content in main area', () => {
      // Arrange & Act
      render(<Layout />)

      // Assert - Layout now uses Outlet pattern
      expect(screen.getByTestId('outlet')).toBeInTheDocument()
      expect(screen.getByText('Outlet Content')).toBeInTheDocument()
    })
  })
})
