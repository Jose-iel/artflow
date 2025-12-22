import { http } from 'msw'
import { createMockUser, createMockAdmin } from '@/__tests__/test-utils'

// Base URL for API
const API_BASE = 'http://localhost:3333/api'

// Auth handlers
export const authHandlers = [
  // Login endpoint
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const { email, senha } = await request.json()
    
    // Mock authentication logic
    if (email === 'admin@example.com' && senha === 'password123') {
      return Response.json({
        message: 'Login realizado com sucesso',
        token: 'mock-admin-jwt-token',
        cliente: {
          id: 'test-admin-id',
          name: 'Test Admin',
          email: 'admin@example.com',
          active: true,
          role: 'SUPER_USER',
          createdAt: '2023-12-09T12:00:00.000Z',
          updatedAt: '2023-12-09T12:00:00.000Z'
        }
      })
    }
    
    if (email === 'test@example.com' && senha === 'password123') {
      return Response.json({
        message: 'Login realizado com sucesso',
        token: 'mock-client-jwt-token',
        cliente: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          active: true,
          role: 'CLIENT',
          createdAt: '2023-12-09T12:00:00.000Z',
          updatedAt: '2023-12-09T12:00:00.000Z'
        }
      })
    }
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Credenciais inválidas'
      }),
      { status: 401 }
    )
  }),

  // Register endpoint
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const { nome, email, senha } = await request.json()
    
    // Validate required fields
    if (!nome || !email || !senha) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Todos os campos são obrigatórios'
        }),
        { status: 400 }
      )
    }
    
    // Validate email format
    if (!email.includes('@')) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Email inválido'
        }),
        { status: 400 }
      )
    }
    
    // Validate password length
    if (senha.length < 8) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Senha deve ter pelo menos 8 caracteres'
        }),
        { status: 400 }
      )
    }
    
    return Response.json({
      message: 'Cliente criado com sucesso',
      token: 'mock-new-user-token',
      cliente: {
        id: 'new-user-id',
        name: nome,
        email: email,
        active: true,
        role: 'CLIENT',
        createdAt: '2023-12-09T12:00:00.000Z',
        updatedAt: '2023-12-09T12:00:00.000Z'
      }
    })
  }),

  // Health check
  http.get(`${API_BASE}/health`, () => {
    return Response.json({ status: 'ok' })
  })
]

// Admin handlers
export const adminHandlers = [
  // Get all users
  http.get(`${API_BASE}/admin/users`, ({ request }) => {
    // Check authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('mock-admin-jwt-token')) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Acesso negado: usuário não é SUPER_USER'
        }),
        { status: 403 }
      )
    }
    
    return Response.json({
      status: 'success',
      usuarios: [createMockAdmin(), createMockUser()]
    })
  }),

  // Create new user
  http.post(`${API_BASE}/admin/users`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('mock-admin-jwt-token')) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Acesso negado: usuário não é SUPER_USER'
        }),
        { status: 403 }
      )
    }
    
    const { nome, email, senha, role = 'CLIENT' } = await request.json()
    
    return Response.json({
      status: 'success',
      message: 'Cliente criado com sucesso',
      cliente: createMockUser({ nome, email, role })
    })
  })
]

// Client handlers
export const clientHandlers = [
  // Get client posts
  http.get(`${API_BASE}/posts`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Token não fornecido'
        }),
        { status: 401 }
      )
    }
    
    return Response.json({
      posts: [
        {
          id: 'mock-post-1',
          imagem_url: 'https://example.com/image1.jpg',
          legenda: 'Mock post 1',
          data_agendada: '2023-12-15T10:00:00.000Z',
          status: 'Não aprovado',
          comentario_cliente: null,
          comentario_admin: null,
          criado_em: '2023-12-09T12:00:00.000Z',
          atualizado_em: '2023-12-09T12:00:00.000Z'
        }
      ]
    })
  })
]

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...adminHandlers,
  ...clientHandlers
]
