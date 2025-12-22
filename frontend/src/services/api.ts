import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/authStore'

// API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api'

// Types for API responses
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message?: string
  data?: T
}

export interface ApiError {
  status: 'error'
  message: string
}

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Don't throw on 4xx/5xx errors in test environment - let MSW handle them
  validateStatus: import.meta.env.MODE === 'test' ? () => true : undefined,
})

// Request interceptor to add auth token (disabled in tests)
if (import.meta.env.MODE !== 'test') {
  api.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling (disabled in tests)
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    (error) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        const authStore = useAuthStore.getState()
        authStore.logout()
        // Redirect to login page
        window.location.href = '/login'
        return Promise.reject(new Error('Session expired. Please login again.'))
      }

      // Handle 403 Forbidden - insufficient permissions
      if (error.response?.status === 403) {
        return Promise.reject(new Error('Access denied. Insufficient permissions.'))
      }

      // Handle network errors
      if (!error.response) {
        return Promise.reject(new Error('Network error. Please check your connection.'))
      }

      // Handle other API errors
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred'
      return Promise.reject(new Error(errorMessage))
    }
  )
}

// Utility functions for common API patterns
export const apiGet = async <T>(url: string): Promise<T> => {
  const response = await api.get<ApiResponse<T>>(url)
  return (response.data.data || response.data) as T
}

export const apiPost = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.post<ApiResponse<T>>(url, data)
  
  // Handle error responses manually in test environment
  if (response.status >= 400 && response.data) {
    const errorData = response.data as ApiError
    throw new Error(errorData.message || 'Request failed')
  }
  
  return (response.data.data || response.data) as T
}

export const apiPut = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.put<ApiResponse<T>>(url, data)
  return (response.data.data || response.data) as T
}

export const apiPatch = async <T>(url: string, data?: any): Promise<T> => {
  const response = await api.patch<ApiResponse<T>>(url, data)
  return (response.data.data || response.data) as T
}

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await api.delete<ApiResponse<T>>(url)
  return (response.data.data || response.data) as T
}

export default api
