import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiGet } from '@/services/api'
import { PostStatsChart } from '@/components/PostStatsChart'

interface PostStats {
  'Aprovado': number
  'Não aprovado': number
  'Alteração': number
  'Agendado': number
  'Publicado': number
}

export const DashboardAdmin: React.FC = () => {
  const { user } = useAuthStore()
  const [postStats, setPostStats] = useState<PostStats>({
    'Aprovado': 0,
    'Não aprovado': 0,
    'Alteração': 0,
    'Agendado': 0,
    'Publicado': 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch post statistics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setStatsLoading(true)
        const statsResponse = await apiGet('/admin/posts/stats')
        setPostStats(statsResponse as PostStats || {
          'Aprovado': 0,
          'Não aprovado': 0,
          'Alteração': 0,
          'Agendado': 0,
          'Publicado': 0
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  if (!user) {
    return <div>Carregando...</div>
  }

  const totalPosts = Object.values(postStats).reduce((sum, val) => sum + (val || 0), 0)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Bem-vindo, {user.nome}
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Painel Administrativo - Métricas e Estatísticas
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Posts</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : totalPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aprovados</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : postStats['Aprovado']}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : postStats['Não aprovado']}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Agendados</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : postStats['Agendado']}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Post Statistics Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Distribuição de Posts por Status
        </h2>
        <PostStatsChart data={postStats} loading={statsLoading} />
      </div>
    </div>
  )
}
