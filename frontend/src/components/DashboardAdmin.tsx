import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiGet, apiPatch } from '@/services/api'
import { PostStatsChart } from '@/components/PostStatsChart'
import { AdminPostsTable } from '@/components/AdminPostsTable'

interface PostStats {
  'Aprovado': number
  'Não aprovado': number
  'Alteração': number
  'Agendado': number
  'Publicado': number
}

export const DashboardAdmin: React.FC = () => {
  const { user } = useAuthStore()
  console.log('DashboardAdmin render - user:', user)
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
    const fetchPostStats = async () => {
      try {
        setStatsLoading(true)
        const response = await apiGet('/admin/posts/stats')
        const statsResponse = response as PostStats
        setPostStats(statsResponse || {
          'Aprovado': 0,
          'Não aprovado': 0,
          'Alteração': 0,
          'Agendado': 0,
          'Publicado': 0
        })
      } catch (err) {
        console.error('Error fetching post stats:', err)
        // Don't show error for stats, just use empty data
      } finally {
        setStatsLoading(false)
      }
    }

    // Only fetch if user is available
    if (user) {
      fetchPostStats()
    }
  }, [user])

  // Handle post status update - refreshes stats after update
  const handleUpdatePostStatus = async (postId: string, status: string, comment?: string) => {
    try {
      await apiPatch(`/posts/${postId}/status`, {
        status,
        comentario_admin: comment || null
      })
      
      // Refresh stats after update
      const response = await apiGet('/admin/posts/stats')
      const statsResponse = response as PostStats
      setPostStats(statsResponse || postStats)
    } catch (err) {
      console.error('Error updating post status:', err)
    }
  }

  if (!user) {
    return <div>Carregando...</div>
  }

  
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Bem-vindo, {user.nome}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Painel Administrativo
          </p>
        </div>

        
        {/* Post Statistics Chart */}
        <div className="mb-6 sm:mb-8">
          <PostStatsChart data={postStats} loading={statsLoading} />
        </div>

        {/* Posts Table Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Todos os Posts
          </h2>
          
          <AdminPostsTable onUpdatePostStatus={handleUpdatePostStatus} />
        </div>
      </div>
    </div>
  )
}
