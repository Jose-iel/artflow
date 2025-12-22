import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore, AuthStore } from '@/stores/authStore'

// Custom render with providers
interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
  authStore?: Partial<AuthStore>
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
  authStore = {}
}) => {
  // Initialize auth store with test values
  const store = useAuthStore.getState()
  Object.assign(store, authStore)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options: RenderOptions & {
    queryClient?: QueryClient
    authStore?: Partial<AuthStore>
  } = {}
) => {
  const { queryClient, authStore, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient} authStore={authStore}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  nome: 'Test User',
  email: 'test@example.com',
  role: 'CLIENT' as const,
  ativo: true,
  criadoEm: '2023-12-09T12:00:00.000Z',
  atualizadoEm: '2023-12-09T12:00:00.000Z',
  ...overrides,
})

export const createMockAdmin = (overrides = {}) => ({
  id: 'test-admin-id',
  nome: 'Test Admin',
  email: 'admin@example.com',
  role: 'SUPER_USER' as const,
  ativo: true,
  criadoEm: '2023-12-09T12:00:00.000Z',
  atualizadoEm: '2023-12-09T12:00:00.000Z',
  ...overrides,
})

export const createMockAuthStore = (overrides = {}) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  hasRole: vi.fn(),
  updateUser: vi.fn(),
  ...overrides,
})

// Re-export everything from Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Helper functions for AAA pattern
export const arrange = customRender
export const act = async (callback: () => Promise<void> | void) => {
  await callback()
}

export const assert = {
  element: {
    isVisible: (element: HTMLElement) => {
      expect(element).toBeInTheDocument()
      expect(element).toBeVisible()
    },
    hasText: (element: HTMLElement, text: string) => {
      expect(element).toHaveTextContent(text)
    },
    isDisabled: (element: HTMLElement) => {
      expect(element).toBeDisabled()
    },
    isEnabled: (element: HTMLElement) => {
      expect(element).not.toBeDisabled()
    }
  },
  form: {
    hasError: (element: HTMLElement, message: string) => {
      expect(element).toHaveTextContent(message)
    },
    isValid: (element: HTMLElement) => {
      expect(element).toBeValid()
    }
  },
  route: {
    isAt: (path: string) => {
      expect(window.location.pathname).toBe(path)
    }
  }
}
