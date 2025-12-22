import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PostForm, CreatePostData, Client } from '@/components/PostForm'
import { useAuthStore } from '@/stores/authStore'
import { apiGet, apiPut } from '@/services/api'

interface Post {
  id: string
  imagemUrl: string
  legenda: string | null
  dataAgendada: string | null
  clienteId: string
  status: string
}

export const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole } = useAuthStore()
  const [post, setPost] = useState<Post | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch post data and clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch post data
        const postResponse = await apiGet(`/posts/${id}`) as { post: Post }
        setPost(postResponse.post)

        // Fetch clients for admin users
        if (hasRole('SUPER_USER')) {
          const clientsResponse = await apiGet('/admin/clientes') as { clients: Client[] }
          setClients(clientsResponse.clients || [])
        } else {
          setClients([]) // Set empty array for non-admin users
        }
      } catch (error) {
        console.error('Error fetching post data:', error)
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id, hasRole, navigate])

  const handleSubmit = async (data: CreatePostData) => {
    if (!id) return

    setSubmitting(true)
    try {
      await apiPut(`/admin/posts/${id}`, data)
      navigate('/dashboard')
    } catch (error) {
      console.error('Error updating post:', error)
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/dashboard')
  }

  if (loading || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post não encontrado</h1>
          <p className="text-gray-600">O post que você está tentando editar não existe.</p>
        </div>
      </div>
    )
  }

  // Utility function to convert ISO string to datetime-local format
  const convertToDateTimeLocal = (isoString: string): string => {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Convert post data to form format
  const initialData: CreatePostData = {
    imagemUrl: post.imagemUrl,
    legenda: post.legenda,
    dataAgendada: post.dataAgendada ? convertToDateTimeLocal(post.dataAgendada) : '',
    clienteId: post.clienteId
  }

  console.log('EditPostPage Debug:')
  console.log('- Post clienteId:', post.clienteId)
  console.log('- Clients array:', clients)
  console.log('- Found client:', clients.find(c => c.id === post.clienteId))

  return (
    <PostForm 
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isAdmin={hasRole('SUPER_USER')}
      clients={clients}
      initialData={initialData}
      isEditing={true}
      submitting={submitting}
    />
  )
}
