# Convenções do Frontend - ArtFlow

> **📌 Este é o arquivo de FONTE ÚNICA** para todas as convenções do frontend.
> Arquitetura baseada em **Component-Driven Development**, **Atomic Design** e **SOLID**.

---

## Princípios de Arquitetura

| Princípio | Aplicação no Projeto |
|-----------|---------------------|
| **Componentes Puros** | Componentes sem side effects, fáceis de testar |
| **Separação de Concerns** | UI separada de lógica de estado e API |
| **Single Responsibility** | Cada componente/hook tem uma única responsabilidade |
| **Composição** | Preferir composição sobre herança |
| **Colocation** | Arquivos relacionados próximos uns dos outros |

---

## Stack Tecnológica

| Tecnologia           | Versão | Uso                        |
| -------------------- | ------ | -------------------------- |
| React                | 19+    | UI Library                 |
| TypeScript           | 5.x    | Tipagem estrita            |
| Vite                 | 7+     | Build tool                 |
| TailwindCSS          | 3.x    | Estilização                |
| Zustand              | 5.x    | Estado global              |
| React Query          | 5.x    | Cache e fetching           |
| React Hook Form      | 7.x    | Formulários                |
| Zod                  | 4.x    | Validação de schemas       |
| React Router         | 7.x    | Roteamento                 |
| Vitest               | 4+     | Testes                     |
| Testing Library      | 16+    | Testes de componentes      |
| MSW                  | 2.x    | Mock de APIs               |

---

## Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                         PAGES                                │
│              (Composição de componentes)                     │
│              Responsabilidade: Layout de página              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      COMPONENTS                              │
│              (UI reutilizável)                               │
│              Responsabilidade: Apresentação                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        HOOKS                                 │
│              (Lógica reutilizável)                           │
│              Responsabilidade: Lógica de UI                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       STORES                                 │
│              (Estado global - Zustand)                       │
│              Responsabilidade: Estado da aplicação           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICES                                │
│              (Comunicação com API)                           │
│              Responsabilidade: Fetching de dados             │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Projeto

```
frontend/src/
├── components/           # Componentes reutilizáveis
│   ├── ui/               # Componentes base (Button, Input, Modal)
│   ├── forms/            # Componentes de formulário
│   └── layout/           # Componentes de layout (Header, Sidebar)
├── pages/                # Páginas da aplicação
├── hooks/                # Custom hooks
├── stores/               # Zustand stores
├── services/             # API services
├── types/                # TypeScript types/interfaces
├── utils/                # Funções utilitárias
├── mocks/                # MSW handlers
├── __tests__/            # Testes
│   ├── components/       # Testes de componentes
│   ├── hooks/            # Testes de hooks
│   ├── stores/           # Testes de stores
│   └── helpers/          # Test utilities
├── App.tsx               # Componente raiz
└── main.tsx              # Entry point
```

### Nomenclatura

| Tipo         | Padrão                | Exemplo                      |
| ------------ | --------------------- | ---------------------------- |
| Componentes  | `PascalCase.tsx`      | `LoginForm.tsx`              |
| Pages        | `PascalCase.tsx`      | `Dashboard.tsx`              |
| Hooks        | `use*.ts`             | `useAuth.ts`                 |
| Stores       | `*Store.ts`           | `authStore.ts`               |
| Services     | `*.ts`                | `api.ts`                     |
| Types        | `*.ts`                | `user.ts`                    |
| Testes       | `*.test.tsx`          | `LoginForm.test.tsx`         |
| Utils        | `camelCase.ts`        | `formatDate.ts`              |

---

## Padrões de TypeScript

### Exports

```typescript
// ✅ CORRETO - Named exports para componentes
export const LoginForm: React.FC = () => { }
export { LoginForm }

// ✅ CORRETO - Named exports para hooks
export const useAuth = () => { }

// ✅ CORRETO - Named exports para types
export interface User { }
export type UserRole = 'CLIENT' | 'ADMIN'
```

### Tipagem Estrita

```typescript
// ✅ CORRETO - Props tipadas
interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectTo }) => { }

// ❌ INCORRETO - Nunca usar any
const data: any = response.data

// ✅ CORRETO - Usar unknown e type guards
const data: unknown = response.data
if (isUser(data)) { }
```

---

## Componentes

### Template Base

```typescript
// components/LoginForm.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  redirectTo = '/' 
}) => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(credentials)
      onSuccess?.()
      navigate(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
    </form>
  )
}
```

### Convenções de Componentes

- **Named exports** (não default)
- **Props interface** definida acima do componente
- **Destructuring** de props com valores default
- **Estados locais** no topo do componente
- **Handlers** com prefixo `handle`
- **Loading e error states** tratados
- **Acessibilidade** com `aria-*` e labels

---

## Hooks Customizados

### Template Base

```typescript
// hooks/useAuth.ts
import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  hasRole: (role: UserRole) => boolean
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate()
  const { user, token, login: storeLogin, logout: storeLogout } = useAuthStore()

  const login = useCallback(async (credentials: LoginCredentials) => {
    await storeLogin(credentials)
    navigate('/')
  }, [storeLogin, navigate])

  const logout = useCallback(() => {
    storeLogout()
    navigate('/login')
  }, [storeLogout, navigate])

  const hasRole = useCallback((role: UserRole) => {
    return user?.role === role
  }, [user])

  return {
    user,
    isAuthenticated: !!token,
    login,
    logout,
    hasRole
  }
}
```

### Convenções de Hooks

- Prefixo `use` obrigatório
- Interface de retorno tipada
- `useCallback` para funções que são passadas como props
- `useMemo` para valores computados pesados
- Não fazer fetch direto - usar React Query

---

## Stores (Zustand)

### Template Base

```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiPost } from '@/services/api'

// Types
export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
}

export type UserRole = 'CLIENT' | 'SUPER_USER'

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  hasRole: (role: UserRole) => boolean
  updateUser: (userData: Partial<User>) => void
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,

      // Actions
      login: async (credentials) => {
        const response = await apiPost('/auth/login', credentials)
        set({
          user: mapUserFromApi(response.cliente),
          token: response.token,
          isAuthenticated: true
        })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.removeItem('auth-storage')
      },

      hasRole: (role) => get().user?.role === role,

      updateUser: (userData) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
```

### Convenções de Stores

- Separar **State** e **Actions** em interfaces
- Usar `persist` para dados que devem sobreviver refresh
- Actions são funções puras ou async
- Usar `get()` para acessar estado atual dentro de actions
- Mapear dados da API para formato do frontend

---

## Services (API)

### Template Base

```typescript
// services/api.ts
import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export const apiGet = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url)
  return response.data
}

export const apiPost = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.post<T>(url, data)
  return response.data
}

export const apiPut = async <T>(url: string, data?: unknown): Promise<T> => {
  const response = await api.put<T>(url, data)
  return response.data
}

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url)
  return response.data
}
```

---

## Formulários (React Hook Form + Zod)

### Template Base

```typescript
// components/forms/CreatePostForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Schema de validação
const createPostSchema = z.object({
  imagemUrl: z.string().url('URL inválida'),
  legenda: z.string().optional(),
  dataAgendada: z.string().datetime().optional()
})

type CreatePostFormData = z.infer<typeof createPostSchema>

interface CreatePostFormProps {
  onSubmit: (data: CreatePostFormData) => Promise<void>
  isLoading?: boolean
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ 
  onSubmit, 
  isLoading 
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    mode: 'onChange'
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="imagemUrl" className="block text-sm font-medium">
          URL da Imagem
        </label>
        <input
          id="imagemUrl"
          type="url"
          {...register('imagemUrl')}
          className="mt-1 block w-full rounded-md border-gray-300"
          aria-invalid={!!errors.imagemUrl}
          aria-describedby={errors.imagemUrl ? 'imagemUrl-error' : undefined}
        />
        {errors.imagemUrl && (
          <p id="imagemUrl-error" className="mt-1 text-sm text-red-600">
            {errors.imagemUrl.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="btn-primary disabled:opacity-50"
      >
        {isLoading ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}
```

### Convenções de Formulários

- **Zod** para validação de schema
- **zodResolver** para integrar com React Hook Form
- `mode: 'onChange'` para validação em tempo real
- **aria-invalid** e **aria-describedby** para acessibilidade
- Estados de loading no botão submit

---

## Estilização (TailwindCSS)

### Convenções

```typescript
// ✅ CORRETO - Classes organizadas por categoria
<button
  className={clsx(
    // Base
    'px-4 py-2 rounded-md font-medium',
    // Cores
    'bg-blue-600 text-white',
    // Hover/Focus
    'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
    // Estados
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Condicional
    isActive && 'ring-2 ring-blue-500'
  )}
>
  Enviar
</button>

// ✅ CORRETO - Usar clsx ou cn para classes condicionais
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

### Padrões de Classes

| Categoria | Ordem |
|-----------|-------|
| Layout | `flex`, `grid`, `block` |
| Spacing | `p-*`, `m-*`, `gap-*` |
| Sizing | `w-*`, `h-*` |
| Typography | `text-*`, `font-*` |
| Colors | `bg-*`, `text-*`, `border-*` |
| Effects | `shadow-*`, `opacity-*` |
| States | `hover:`, `focus:`, `disabled:` |

---

## Testes

> **📌 Detalhes completos:** Ver `agents/test-engineer.md`

### Convenções

| Aspecto | Convenção |
|---------|-----------|
| Padrão | **AAA**: Arrange, Act, Assert |
| Nomenclatura | `should [resultado] when [condição]` |
| Queries | Preferir `getByRole`, `getByLabelText` |
| Eventos | Usar `userEvent` ao invés de `fireEvent` |
| Async | Usar `waitFor` para operações assíncronas |

### Estrutura de Arquivos

```
__tests__/
├── components/       # Testes de componentes
├── hooks/            # Testes de hooks
├── stores/           # Testes de stores
├── setup.ts          # Setup global
└── test-utils.tsx    # Render customizado
```

### O que testar

| Camada | O que testar |
|--------|--------------|
| **Componentes** | Renderização, interações, estados |
| **Hooks** | Lógica, side effects |
| **Stores** | Actions, state changes |
| **Forms** | Validação, submissão |

---

## Acessibilidade (a11y)

### Checklist Obrigatório

- [ ] Todos os inputs têm `label` associado
- [ ] Imagens têm `alt` descritivo
- [ ] Botões têm texto ou `aria-label`
- [ ] Formulários têm `aria-invalid` e `aria-describedby`
- [ ] Modais têm `aria-modal` e focus trap
- [ ] Cores têm contraste mínimo 4.5:1
- [ ] Navegação por teclado funciona
- [ ] Focus visible em elementos interativos

### Padrões

```typescript
// ✅ CORRETO - Input acessível
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email
  </label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <p id="email-error" role="alert" className="text-red-600">
      {error}
    </p>
  )}
</div>

// ✅ CORRETO - Botão acessível
<button
  type="button"
  aria-label="Fechar modal"
  onClick={onClose}
>
  <XIcon aria-hidden="true" />
</button>
```

---

## Códigos HTTP (para tratamento de erros)

| Código | Tratamento no Frontend |
| ------ | ---------------------- |
| 200    | Sucesso - atualizar UI |
| 201    | Criado - redirecionar ou mostrar sucesso |
| 400    | Mostrar erros de validação |
| 401    | Redirecionar para login |
| 403    | Mostrar mensagem de acesso negado |
| 404    | Mostrar página/componente não encontrado |
| 500    | Mostrar erro genérico |

---

## Pipeline de Desenvolvimento

```
[1] spec-creator    → Desenha arquitetura e matura a ideia
[2] spec-developer  → Implementa o código
[3] test-engineer   → Cria os testes
[4] accessibility   → Analisa acessibilidade
[5] code-reviewer   → Valida e aprova ✅
```

> **📌 Checklists detalhados por etapa:**
> - [1] Especificação: `agents/spec-creator.md`
> - [2] Implementação: `agents/spec-developer.md`
> - [3] Testes: `agents/test-engineer.md`
> - [4] Acessibilidade: `agents/accessibility-expert.md`
> - [5] Validação: `agents/code-reviewer.md`

---
