import React, { useState, useEffect } from 'react'
import { PostForm, CreatePostData, Client } from '@/components/PostForm'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { apiPost, apiGet } from '@/services/api'

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasRole } = useAuthStore()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch clients for admin users
  useEffect(() => {
    const fetchClients = async () => {
      if (hasRole('SUPER_USER')) {
        try {
          const response = await apiGet('/admin/clientes') as { clients: Client[] }
          setClients(response.clients || [])
        } catch (error) {
          console.error('Error fetching clients:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchClients()
  }, [hasRole])

  // Only admin users can create posts
  if (!hasRole('SUPER_USER')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
          <p className="text-gray-600">Apenas administradores podem criar posts.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: CreatePostData) => {
    try {
      await apiPost('/posts', data)
      // Redirect to admin dashboard after successful creation
      navigate('/dashboard')
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  const handleCancel = () => {
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <PostForm 
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isAdmin={hasRole('SUPER_USER')}
      clients={clients}
    />
  )
}
