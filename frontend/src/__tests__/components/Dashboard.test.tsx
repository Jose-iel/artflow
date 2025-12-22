import { render, screen } from '@/__tests__/test-utils'
import { Dashboard } from '@/components/Dashboard'
import { useAuthStore } from '@/stores/authStore'
import { vi } from 'vitest'

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('Dashboard Component', () => {
  describe('Client User Dashboard', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
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

    it('should render client dashboard with welcome message', () => {
      // Arrange & Act
      render(<Dashboard />)

      // Assert
      expect(screen.getByText(/bem-vindo, test client/i)).toBeInTheDocument()
      expect(screen.getByText(/painel do cliente/i)).toBeInTheDocument()
    })

    it('should display client-specific actions', () => {
      // Arrange & Act
      render(<Dashboard />)

      // Assert - Client dashboard shows posts section
      expect(screen.getByText(/seus posts/i)).toBeInTheDocument()
      expect(screen.getByText(/carregando posts/i)).toBeInTheDocument()
    })

    it('should display client dashboard title', () => {
      // Arrange & Act
      render(<Dashboard />)

      // Assert
      expect(screen.getByText(/Painel do Cliente/i)).toBeInTheDocument()
    })

    it('should show client posts section', () => {
      // Arrange & Act
      render(<Dashboard />)

      // Assert
      expect(screen.getByText(/seus posts/i)).toBeInTheDocument()
    })
  })

  describe('Admin User Dashboard', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
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

    it('should render admin dashboard with welcome message', () => {
      // Arrange & Act
      render(<Dashboard />)

      // Assert
      expect(screen.getByText(/bem-vindo, test admin/i)).toBeInTheDocument()
      expect(screen.getByText(/painel administrativo/i)).toBeInTheDocument()
    })

    it('should display admin dashboard title', () => {
      // Arrange & Act
      render(<Dashboard />)

      // Assert
      expect(screen.getByText(/Painel Administrativo/i)).toBeInTheDocument()
    })
  })

  describe('User Actions', () => {
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
        hasRole: vi.fn()
      })
    })

    it('should display user information', () => {
      // Arrange & Act
      render(<Dashboard />)

      // Assert
      expect(screen.getByText(/test user/i)).toBeInTheDocument()
    })

    it('should display welcome message', () => {
      // Arrange & Act
      render(<Dashboard />)

      // Assert
      expect(screen.getByText(/bem-vindo, test user/i)).toBeInTheDocument()
    })
  })
})
