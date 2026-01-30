import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiGet, apiPatch } from '@/services/api'
import { PostModal } from '@/features/posts'
import { getPreviewUrl } from '@/utils/googleDriveUtils'

interface Post {
  id: string
  imagemUrl: string
  legenda: string | null
  dataAgendada: string | null
  status: string
  comentarioCliente: string | null
  comentarioAdmin: string | null
  criadoEm: string
  atualizadoEm: string
}

interface DashboardAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

export const DashboardContent: React.FC = () => {
  const { user, hasRole } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch posts from database
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        // Backend only supports authenticated user's posts
        const response = await apiGet('/posts')
        console.log('API Response:', response) // Debug log
        // Backend returns {posts: [...]} directly, not wrapped in data
        const postsResponse = response as { posts: Post[] }
        console.log('Posts from API:', postsResponse.posts) // Debug log
        console.log('First post dataAgendada:', postsResponse.posts?.[0]?.dataAgendada) // Debug specific field
        setPosts(postsResponse.posts || [])
      } catch (err) {
        console.error('Error fetching posts:', err) // Debug log
        setError('Erro ao carregar posts')
        console.error('Error fetching posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [user])

  // Handle post status update
  const handleUpdatePostStatus = async (postId: string, status: string, comment?: string) => {
    try {
      const requestBody: any = { status }
      
      if (isAdmin) {
        requestBody.comentarioAdmin = comment || null
      } else {
        requestBody.comentarioCliente = comment || null
      }
      
      await apiPatch(`/posts/${postId}/status`, requestBody)
      
      // Refresh posts after update
      const response = await apiGet('/posts')
      const postsResponse = response as { posts: Post[] }
      setPosts(postsResponse.posts || [])
    } catch (err: any) {
      console.error('Error updating post status:', err)
      setError('Erro ao atualizar status do post')
    }
  }

  // Handle post click to open modal
  const handlePostClick = (post: Post) => {
    setSelectedPost(post)
    setIsModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPost(null)
  }

  if (!user) {
    return <div>Carregando...</div>
  }

  const getClientActions = (): DashboardAction[] => [
    // Client dashboard simplified - no action buttons needed
  ]

  const getAdminActions = (): DashboardAction[] => [
    ...getClientActions(),
    {
      label: 'Gerenciar Usuários',
      onClick: () => console.log('Navigate to user management'),
      variant: 'primary'
    },
    {
      label: 'Todos os Posts',
      onClick: () => console.log('Navigate to all posts'),
      variant: 'primary'
    },
    {
      label: 'Relatórios',
      onClick: () => console.log('Navigate to reports'),
      variant: 'secondary'
    },
    {
      label: 'Configurações do Sistema',
      onClick: () => console.log('Navigate to system settings'),
      variant: 'secondary'
    }
  ]

  const actions = hasRole('SUPER_USER') ? getAdminActions() : getClientActions()
  const isAdmin = hasRole('SUPER_USER')

  const getButtonVariant = (variant?: 'primary' | 'secondary' | 'danger') => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white'
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Bem-vindo, {user.nome}
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              {isAdmin ? 'Painel Administrativo' : 'Painel do Cliente'}
            </p>
          </div>

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${getButtonVariant(
                    action.variant
                  )}`}
                >
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-medium mb-2">{action.label}</h3>
                    <p className="text-xs sm:text-sm opacity-90">
                      {action.label === 'Meus Posts' && 'Visualize e gerencie seus posts'}
                      {action.label === 'Criar Novo Post' && 'Crie um novo post'}
                      {action.label === 'Meu Perfil' && 'Edite suas informações'}
                      {action.label === 'Gerenciar Usuários' && 'Administre usuários do sistema'}
                      {action.label === 'Todos os Posts' && 'Visualize todos os posts'}
                      {action.label === 'Relatórios' && 'Veja relatórios e estatísticas'}
                      {action.label === 'Configurações do Sistema' && 'Configure o sistema'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Posts Section */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              {isAdmin ? 'Todos os Posts' : 'Seus Posts'}
            </h2>
            
            {loading && (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-600 text-sm sm:text-base">Carregando posts...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
                <p className="text-red-800 text-sm sm:text-base">{error}</p>
              </div>
            )}
            
            {!loading && !error && posts.length === 0 && (
              <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm sm:text-base">
                  {isAdmin ? 'Nenhum post encontrado' : 'Você não tem posts atribuídos'}
                </p>
              </div>
            )}
            
            {!loading && !error && posts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="bg-gray-200">
                      {(() => {
                        const preview = getPreviewUrl(post.imagemUrl)
                        
                        // Para vídeos, mostrar ícone de play sobre fundo escuro
                        if (preview.isVideo) {
                          return (
                            <div className="w-full h-40 sm:h-48 flex items-center justify-center bg-gray-800 text-white">
                              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          )
                        }
                        
                        // Para imagens, usar thumbnail otimizado
                        return (
                          <img 
                            src={preview.url} 
                            alt={post.legenda || 'Post image'}
                            className="w-full h-40 sm:h-48 object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Imagem+não+disponível'
                            }}
                          />
                        )
                      })()}
                    </div>
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Criado: {new Date(post.criadoEm).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                        <span>Postagem: {post.dataAgendada ? 
                          new Date(post.dataAgendada).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 
                          'Pendente'
                        }</span>
                      </div>
                      <p className="text-sm sm:text-base text-gray-800 mb-3 line-clamp-2">
                        {post.legenda || 'Sem legenda'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          post.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                          post.status === 'Não aprovado' ? 'bg-yellow-100 text-yellow-800' :
                          post.status === 'Agendado' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                        {isAdmin && (
                          <button 
                            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePostClick(post)
                            }}
                          >
                            Gerenciar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdatePostStatus}
      />
    </>
  )
}
