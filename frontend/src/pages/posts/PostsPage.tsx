// Página de Gerenciamento de Posts
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { TruncateText } from '@/components'

interface Post {
  id: string
  imagePath: string
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
  squad?: {
    id: string
    nome: string
    empresa?: {
      id: string
      nome: string
    }
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

const statusStyles: Record<string, string> = {
  'Aprovado': 'bg-green-100 text-green-800',
  'Não aprovado': 'bg-yellow-100 text-yellow-800',
  'Agendado': 'bg-blue-100 text-blue-800',
  'Publicado': 'bg-purple-100 text-purple-800'
}

// Prioridade de ordenação dos status
const statusPriority: Record<string, number> = {
  'Não aprovado': 1,
  'Aprovado': 2,
  'Agendado': 3,
  'Publicado': 4
}

export const PostsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isFuncionario = user?.role === 'FUNCIONARIO'
  const [posts, setPosts] = useState<Post[]>([])
  const [sortedPosts, setSortedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [clienteNome, setClienteNome] = useState('')
  const [status, setStatus] = useState('')
  const [debouncedClienteNome, setDebouncedClienteNome] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Debounce filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClienteNome(clienteNome)
    }, 300)
    return () => clearTimeout(timer)
  }, [clienteNome])

  // Fetch posts
  const fetchPosts = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true)
        setCurrentPage(1)
        setPosts([])
      }
      
      const params = new URLSearchParams()
      if (debouncedClienteNome.trim()) params.append('clienteNome', debouncedClienteNome.trim())
      if (status) params.append('status', status)
      params.append('page', reset ? '1' : currentPage.toString())
      params.append('limit', '20')
      
      const url = `/admin/posts${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiGet(url)
      const postsResponse = response as { posts: Post[], pagination: Pagination }
      
      const newPosts = postsResponse.posts || []
      if (reset) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      
      setTotalItems(postsResponse.pagination?.totalItems || 0)
      setHasMore(postsResponse.pagination?.hasNextPage || false)
    } catch (err) {
      console.error('Error fetching posts:', err)
      setError('Erro ao carregar posts')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [debouncedClienteNome, status])

  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setCurrentPage(prev => prev + 1)
    
    const params = new URLSearchParams()
    if (debouncedClienteNome.trim()) params.append('clienteNome', debouncedClienteNome.trim())
    if (status) params.append('status', status)
    params.append('page', (currentPage + 1).toString())
    params.append('limit', '20')
    
    try {
      const url = `/admin/posts${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiGet(url)
      const postsResponse = response as { posts: Post[], pagination: Pagination }
      
      const newPosts = postsResponse.posts || []
      setPosts(prev => [...prev, ...newPosts])
      setHasMore(postsResponse.pagination?.hasNextPage || false)
    } catch (err) {
      console.error('Error loading more posts:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Ordenar posts por prioridade de status
  useEffect(() => {
    const sorted = [...posts].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 999
      const priorityB = statusPriority[b.status] || 999
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      // Se mesmo status, ordenar por data de criação (mais recente primeiro)
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    })
    setSortedPosts(sorted)
  }, [posts])

  const clearFilters = () => {
    setClienteNome('')
    setStatus('')
  }

  const getStatusBadge = (postStatus: string) => (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
      statusStyles[postStatus] || 'bg-gray-100 text-gray-800'
    }`}>
      {postStatus}
    </span>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os posts do sistema</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-600 mt-1">
            {isFuncionario ? 'Posts da sua squad' : 'Gerencie todos os posts do sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/posts/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>Novo Post</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <input
              type="text"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Buscar por cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="Não aprovado">Não aprovado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Publicado">Publicado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 invisible">
              Ação
            </label>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        {totalItems} {totalItems === 1 ? 'post encontrado' : 'posts encontrados'}
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {sortedPosts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum post encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Colunas para Admin Master */}
                  {!isFuncionario && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Squad
                      </th>
                    </>
                  )}
                  {/* Colunas para Funcionário */}
                  {isFuncionario && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  {isFuncionario && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                  )}
                  {!isFuncionario && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado por
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {isFuncionario && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retorno Cliente
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isFuncionario ? 'Data/Hora Postagem' : 'Data'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    {/* Colunas para Admin Master */}
                    {!isFuncionario && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {post.squad?.empresa?.nome || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {post.squad?.nome || '-'}
                        </td>
                      </>
                    )}
                    {/* Miniatura para Funcionário */}
                    {isFuncionario && (
                      <td className="px-6 py-4">
                        <div
                          className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/posts/edit/${post.id}`)}
                        >
                          {post.imagePath ? (
                            post.imagePath.match(/\.(mp4|mov|avi|webm)$/i) ? (
                              <div className="h-16 w-16 flex items-center justify-center bg-gray-800 text-white">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            ) : (
                              <img
                                className="h-16 w-16 object-cover"
                                src={`/uploads/${post.imagePath}`}
                                alt={post.legenda || 'Post'}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.parentElement!.innerHTML = '<div class="h-16 w-16 flex items-center justify-center text-gray-400 text-xs">Sem img</div>'
                                }}
                              />
                            )
                          ) : (
                            <div className="h-16 w-16 flex items-center justify-center text-gray-400 text-xs">
                              Sem img
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {post.cliente.nome}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.cliente.email}
                      </div>
                    </td>
                    {/* Descrição expansível para Funcionário */}
                    {isFuncionario && (
                      <td className="px-6 py-4 max-w-xs">
                        {post.legenda ? (
                          <TruncateText text={post.legenda} maxLength={80} className="text-sm text-gray-700" />
                        ) : (
                          <span className="text-sm text-gray-400">Sem descrição</span>
                        )}
                      </td>
                    )}
                    {!isFuncionario && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.createdBy?.nome || 'Cliente'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(post.status)}
                    </td>
                    {/* Retorno do cliente para Funcionário */}
                    {isFuncionario && (
                      <td className="px-6 py-4 max-w-xs">
                        {post.status === 'Não aprovado' && post.comentarioCliente ? (
                          <TruncateText 
                            text={post.comentarioCliente} 
                            maxLength={60} 
                            className="text-sm text-red-600" 
                          />
                        ) : post.comentarioCliente ? (
                          <TruncateText 
                            text={post.comentarioCliente} 
                            maxLength={60} 
                            className="text-sm text-gray-600" 
                          />
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isFuncionario ? (
                        post.dataAgendada ? (
                          new Date(post.dataAgendada).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : (
                          <span className="text-gray-400">Não agendado</span>
                        )
                      ) : (
                        new Date(post.criadoEm).toLocaleDateString('pt-BR')
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => navigate(`/posts/edit/${post.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Ver/Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? 'Carregando...' : 'Carregar Mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
