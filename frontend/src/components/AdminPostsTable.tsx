import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '@/services/api'
import { PostModal } from '@/components/PostModal'
import { TruncateText } from '@/components/TruncateText'

interface Post {
  id: string
  imagemUrl: string
  legenda: string | null
  dataAgendada: string | null
  status: string
  comentarioAdmin: string | null
  comentarioCliente: string | null
  criadoEm: string
  atualizadoEm: string
  cliente: {
    id: string
    nome: string
    email: string
  }
  createdBy: {
    id: string
    nome: string
    email: string
  } | null
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface AdminPostsTableProps {
  onUpdatePostStatus: (postId: string, status: string, comment?: string) => void
}

export const AdminPostsTable: React.FC<AdminPostsTableProps> = ({ onUpdatePostStatus }) => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Filters with debounce
  const [clienteNome, setClienteNome] = useState('')
  const [postContent, setPostContent] = useState('')
  const [status, setStatus] = useState('')
  const [debouncedClienteNome, setDebouncedClienteNome] = useState('')
  const [debouncedPostContent, setDebouncedPostContent] = useState('')
  
  // Load More pattern
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClienteNome(clienteNome)
    }, 300)
    return () => clearTimeout(timer)
  }, [clienteNome])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPostContent(postContent)
    }, 300)
    return () => clearTimeout(timer)
  }, [postContent])

  // Fetch posts with filters
  const fetchPosts = async () => {
    try {
      setLoading(true)
      setCurrentPage(1)
      setPosts([]) // Reset posts when filters change
      
      const params = new URLSearchParams()
      if (debouncedClienteNome.trim()) params.append('clienteNome', debouncedClienteNome.trim())
      if (debouncedPostContent.trim()) params.append('postContent', debouncedPostContent.trim())
      if (status) params.append('status', status)
      params.append('page', '1')
      params.append('limit', '15')
      
      const url = `/admin/posts${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiGet(url)
      const postsResponse = response as { posts: Post[], pagination: Pagination }
      setPosts(postsResponse.posts || [])
      setTotalItems(postsResponse.pagination?.totalItems || 0)
      setHasMore(postsResponse.pagination?.hasNextPage || false)
    } catch (err) {
      console.error('Error fetching admin posts:', err)
      setError('Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }

  // Initial load and filter changes
  useEffect(() => {
    fetchPosts()
  }, [debouncedClienteNome, debouncedPostContent, status])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts()
    }, 300000) // 5 minutes (300 seconds)

    return () => clearInterval(interval)
  }, [debouncedClienteNome, debouncedPostContent, status])

  // Load more posts
  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    
    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1
      
      const params = new URLSearchParams()
      if (debouncedClienteNome.trim()) params.append('clienteNome', debouncedClienteNome.trim())
      if (debouncedPostContent.trim()) params.append('postContent', debouncedPostContent.trim())
      if (status) params.append('status', status)
      params.append('page', nextPage.toString())
      params.append('limit', '15')
      
      const url = `/admin/posts${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiGet(url)
      const postsResponse = response as { posts: Post[], pagination: Pagination }
      
      // Accumulate posts
      setPosts(prev => [...prev, ...(postsResponse.posts || [])])
      setCurrentPage(nextPage)
      setHasMore(postsResponse.pagination?.hasNextPage || false)
    } catch (err) {
      console.error('Error loading more posts:', err)
      setError('Erro ao carregar mais posts')
    } finally {
      setLoadingMore(false)
    }
  }

  
  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPost(null)
  }

  // Clear filters
  const clearFilters = () => {
    setClienteNome('')
    setPostContent('')
    setStatus('')
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'Aprovado': 'bg-green-100 text-green-800',
      'Não aprovado': 'bg-yellow-100 text-yellow-800',
      'Alteração': 'bg-orange-100 text-orange-800',
      'Agendado': 'bg-blue-100 text-blue-800',
      'Publicado': 'bg-purple-100 text-purple-800'
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Filters Section */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente
            </label>
            <input
              type="text"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo do Post
            </label>
            <input
              type="text"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Buscar por legenda..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Não aprovado">Não aprovado</option>
              <option value="Alteração">Alteração</option>
              <option value="Agendado">Agendado</option>
              <option value="Publicado">Publicado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              &nbsp;
            </label>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {totalItems} {totalItems === 1 ? 'post encontrado' : 'posts encontrados'}
            {posts.length > 0 && posts.length < totalItems && (
              <span className="ml-2">({posts.length} carregados)</span>
            )}
          </p>
          <p className="text-sm text-gray-500">
            Carregando 15 itens por vez
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {posts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Nenhum post encontrado com os filtros selecionados</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Agendada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comentário Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {post.cliente.nome}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.cliente.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={post.imagemUrl}
                          alt={post.legenda || 'Post image'}
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/48x48?text=Imagem'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {post.legenda ? (
                          <TruncateText text={post.legenda} maxLength={80} />
                        ) : (
                          'Sem legenda'
                        )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.dataAgendada ? 
                      new Date(post.dataAgendada).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      'Pendente'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(post.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    {post.comentarioCliente ? (
                      <TruncateText text={post.comentarioCliente} maxLength={100} />
                    ) : (
                      <span className="text-gray-400">Sem comentário</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/posts/edit/${post.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                loadingMore
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {loadingMore ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Carregando...
                </span>
              ) : (
                `Carregar Mais (${Math.min(15, totalItems - posts.length)} restantes)`
              )}
            </button>
          </div>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && posts.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ✅ Todos os {totalItems} posts foram carregados
            </p>
          </div>
        </div>
      )}

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateStatus={onUpdatePostStatus}
      />
    </div>
  )
}
