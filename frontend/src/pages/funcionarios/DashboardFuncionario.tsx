// Dashboard do Funcionário - Mostra squad e dados filtrados
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { apiGet } from '@/services/api'
import { PostStatsChart } from '@/features/posts'
import { Users, FileText, CheckCircle, User, Settings, Clock, ClipboardList, Plus, Send } from 'lucide-react'

interface Squad {
  id: string
  nome: string
  descricao?: string
  empresa?: {
    id: string
    nome: string
  }
}

interface Cliente {
  id: string
  nome: string
  email: string
}

interface PostStats {
  'Aprovado': number
  'Não aprovado': number
  'Agendado': number
  'Publicado': number
}

export const DashboardFuncionario: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [squad, setSquad] = useState<Squad | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [postStats, setPostStats] = useState<PostStats>({
    'Aprovado': 0,
    'Não aprovado': 0,
    'Agendado': 0,
    'Publicado': 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.squadId) {
        setError('Você não está vinculado a nenhuma squad')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Busca dados da squad com membros
        const squadResponse = await apiGet(`/squads/${user.squadId}`)
        setSquad(squadResponse as Squad)

        // Busca membros da squad (funcionários e clientes)
        try {
          const membrosResponse = await apiGet(`/squads/${user.squadId}/membros`) as { 
            squad: { id: string; nome: string }
            funcionarios: Cliente[]
            clientes: Cliente[] 
          }
          setClientes(membrosResponse.clientes || [])
        } catch {
          // Pode falhar se não houver permissão
          console.log('Não foi possível carregar membros da squad')
        }

        // Busca estatísticas de posts (já filtrado pela squad no backend)
        try {
          const statsResponse = await apiGet('/admin/posts/stats')
          setPostStats(statsResponse as PostStats)
        } catch {
          // Stats pode falhar se não houver posts
        }

      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Erro ao carregar dados do dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  if (!user) {
    return <div className="p-6">Carregando...</div>
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Carregando dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  const totalPosts = Object.values(postStats).reduce((sum, val) => sum + (val || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header com informações do funcionário e squad */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Olá, {user.nome}!
        </h1>
        <p className="text-blue-100 mt-1">Painel do Funcionário</p>
        
        {/* Squad Info - Destaque */}
        <div className="mt-4 bg-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <div>
              <p className="text-sm text-blue-200">Sua Squad</p>
              <p className="text-xl font-bold">{squad?.nome || 'Não definida'}</p>
              {squad?.empresa && (
                <p className="text-sm text-blue-200">
                  Empresa: {squad.empresa.nome}
                </p>
              )}
            </div>
          </div>
          {squad?.descricao && (
            <p className="mt-2 text-sm text-blue-100">{squad.descricao}</p>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Posts</p>
              <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aprovados</p>
              <p className="text-2xl font-bold text-gray-900">{postStats['Aprovado']}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{postStats['Não aprovado']}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-cyan-100 text-cyan-600">
              <Send className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Publicados</p>
              <p className="text-2xl font-bold text-gray-900">{postStats['Publicado']}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <User className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Clientes na Squad</p>
              <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/posts')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ver Posts</h3>
              <p className="text-sm text-gray-500">Gerenciar posts da squad</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/posts/create')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Criar Post</h3>
              <p className="text-sm text-gray-500">Novo post para cliente</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Meu Perfil</h3>
              <p className="text-sm text-gray-500">Editar informações</p>
            </div>
          </div>
        </button>
      </div>

      {/* Gráfico de Posts */}
      {totalPosts > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição de Posts por Status
          </h2>
          <PostStatsChart data={postStats} loading={false} />
        </div>
      )}

      {/* Lista de Clientes da Squad */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Clientes da Squad ({clientes.length})
        </h2>
        
        {clientes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum cliente vinculado à sua squad
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {cliente.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-gray-900 truncate">{cliente.nome}</p>
                  <p className="text-sm text-gray-500 truncate">{cliente.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
