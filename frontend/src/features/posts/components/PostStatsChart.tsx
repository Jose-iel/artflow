import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PostStats {
  'Aprovado': number
  'Não aprovado': number
  'Alteração': number
  'Agendado': number
  'Publicado': number
}

interface PostStatsChartProps {
  data: PostStats
  loading?: boolean
}

export const PostStatsChart: React.FC<PostStatsChartProps> = React.memo(({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Transform data for charts
  const barData = Object.entries(data).map(([status, count]) => ({
    status,
    count,
    name: status
  }))

  const pieData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count
    }))

  // Colors for different statuses
  const statusColors = {
    'Aprovado': '#10b981', // green-500
    'Não aprovado': '#f59e0b', // amber-500
    'Alteração': '#ef4444', // red-500
    'Agendado': '#3b82f6', // blue-500
    'Publicado': '#06b6d4' // cyan-500
  }

  const totalPosts = Object.values(data).reduce((sum, count) => sum + count, 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Estatísticas de Posts</h3>
        <p className="text-sm text-gray-600">Total de posts: {totalPosts}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Posts por Status</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="status" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value} posts`, 'Quantidade']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="count" name="Posts">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.status as keyof typeof statusColors]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Distribuição Percentual</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.name as keyof typeof statusColors]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value} posts (${((value / totalPosts) * 100).toFixed(1)}%)`, 
                  name
                ]}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {Object.entries(data).map(([status, count]) => (
          <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
            <div 
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
            />
            <p className="text-xs text-gray-600">{status}</p>
            <p className="text-lg font-semibold text-gray-900">{count}</p>
          </div>
        ))}
      </div>
    </div>
  )
})
