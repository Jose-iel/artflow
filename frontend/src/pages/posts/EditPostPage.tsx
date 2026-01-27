import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PostForm, CreatePostData, Client } from '@/features/posts'
import { useAuthStore } from '@/stores/authStore'
import { apiGet, apiPut, apiDelete } from '@/services/api'
import { UserRole } from '@/types/auth'

interface Post {
  id: string
  imagemUrl: string
  legenda: string | null
  dataAgendada: string | null
  clienteId: string
  squadId?: string
  status: string
}

export const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole, user } = useAuthStore()
  const [post, setPost] = useState<Post | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const isAdminMaster = hasRole(UserRole.ADMIN_MASTER) || hasRole(UserRole.SUPER_USER)
  const isFuncionario = hasRole(UserRole.FUNCIONARIO)

  // Fetch post data and clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch post data
        const postResponse = await apiGet(`/posts/${id}`) as { post: Post }
        setPost(postResponse.post)

        // Fetch clients for admin/funcionario users
        if (isAdminMaster) {
          const clientsResponse = await apiGet('/admin/clientes') as { clients: Client[] }
          setClients(clientsResponse.clients || [])
        } else if (isFuncionario && user?.squadId) {
          const membrosResponse = await apiGet(`/squads/${user.squadId}/membros`) as { 
            squad: { id: string; nome: string }
            funcionarios: Client[]
            clientes: Client[] 
          }
          setClients(membrosResponse.clientes || [])
        }
      } catch (error) {
        console.error('Error fetching post data:', error)
        navigate('/posts')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id, isAdminMaster, isFuncionario, user?.squadId, navigate])

  const handleSubmit = async (data: CreatePostData) => {
    if (!id) return

    setSubmitting(true)
    try {
      await apiPut(`/admin/posts/${id}`, data)
      navigate('/posts')
    } catch (error) {
      console.error('Error updating post:', error)
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/posts')
  }

  const handleDelete = async () => {
    if (!id) return
    
    if (window.confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
      try {
        await apiDelete(`/admin/posts/${id}`)
        navigate('/posts')
      } catch (error) {
        console.error('Error deleting post:', error)
        alert('Erro ao excluir post. Tente novamente.')
      }
    }
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

  return (
    <PostForm 
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onDelete={handleDelete}
      isAdminMaster={isAdminMaster}
      isFuncionario={isFuncionario}
      funcionarioSquadId={user?.squadId}
      clients={clients}
      initialData={initialData}
      isEditing={true}
      submitting={submitting}
    />
  )
}
