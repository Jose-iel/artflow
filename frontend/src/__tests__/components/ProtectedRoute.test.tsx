import { render, screen } from '@/__tests__/test-utils'
import { ProtectedRoute } from '@/routes'
import { useAuthStore } from '@/stores/authStore'
import { vi } from 'vitest'
import { Navigate } from 'react-router-dom'

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: vi.fn(() => <div data-testid="navigate-component">Navigate</div>)
  }
})

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        logout: vi.fn(),
        user: null,
        token: null,
        isAuthenticated: false,
        hasRole: vi.fn()
      })
    })

    it('should redirect to login when user is not authenticated', () => {
      // Arrange & Act
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      // Assert
      expect(screen.getByTestId('navigate-component')).toBeInTheDocument()
      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/login', replace: true }),
        undefined
      )
    })
  })

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        logout: vi.fn(),
        user: {
          id: 'test-user-id',
          nome: 'Test User',
          email: 'test@example.com',
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

    it('should render children when user is authenticated', () => {
      // Arrange & Act
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      // Assert
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate-component')).not.toBeInTheDocument()
    })
  })

  describe('Role-based Access Control', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        logout: vi.fn(),
        user: {
          id: 'test-user-id',
          nome: 'Test User',
          email: 'test@example.com',
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

    it('should render children when user has required role', () => {
      // Arrange
      const mockHasRole = vi.fn().mockReturnValue(true)
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
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
        hasRole: mockHasRole
      })

      // Act
      render(
        <ProtectedRoute requiredRole="SUPER_USER">
          <div>Admin Content</div>
        </ProtectedRoute>
      )

      // Assert
      expect(screen.getByText('Admin Content')).toBeInTheDocument()
      expect(mockHasRole).toHaveBeenCalledWith('SUPER_USER')
    })

    it('should redirect to unauthorized when user lacks required role', () => {
      // Arrange
      const mockHasRole = vi.fn().mockReturnValue(false)
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        logout: vi.fn(),
        user: {
          id: 'test-user-id',
          nome: 'Test User',
          email: 'test@example.com',
          role: 'CLIENT',
          ativo: true,
          criadoEm: '2023-12-09T12:00:00.000Z',
          atualizadoEm: '2023-12-09T12:00:00.000Z'
        },
        token: 'test-token',
        isAuthenticated: true,
        hasRole: mockHasRole
      })

      // Act
      render(
        <ProtectedRoute requiredRole="SUPER_USER">
          <div>Admin Content</div>
        </ProtectedRoute>
      )

      // Assert
      expect(screen.getByTestId('navigate-component')).toBeInTheDocument()
      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/unauthorized', replace: true }),
        undefined
      )
      expect(mockHasRole).toHaveBeenCalledWith('SUPER_USER')
    })
  })

  describe('Fallback Component', () => {
    it('should render fallback component when provided and user is not authenticated', () => {
      // Arrange
      mockUseAuthStore.mockReturnValue({
        login: vi.fn(),
        logout: vi.fn(),
        user: null,
        token: null,
        isAuthenticated: false,
        hasRole: vi.fn()
      })

      const FallbackComponent = () => <div>Custom Fallback</div>

      // Act
      render(
        <ProtectedRoute fallback={<FallbackComponent />}>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      // Assert
      expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate-component')).not.toBeInTheDocument()
    })
  })
})
