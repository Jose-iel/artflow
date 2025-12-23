import React, { useState, useEffect } from 'react'
import { PostForm, CreatePostData, Client, Empresa, Squad } from '@/components/PostForm'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { apiPost, apiGet } from '@/services/api'
import { UserRole } from '@/types/auth'

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasRole, user } = useAuthStore()
  const [clients, setClients] = useState<Client[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [loading, setLoading] = useState(true)

  const isAdminMaster = hasRole(UserRole.ADMIN_MASTER) || hasRole(UserRole.SUPER_USER)
  const isFuncionario = hasRole(UserRole.FUNCIONARIO)
  const canCreatePost = isAdminMaster || isFuncionario

  console.log('CreatePostPage - user:', user)
  console.log('CreatePostPage - isAdminMaster:', isAdminMaster)
  console.log('CreatePostPage - isFuncionario:', isFuncionario)

  useEffect(() => {
    const fetchData = async () => {
      if (!canCreatePost) {
        setLoading(false)
        return
      }

      try {
        // Admin Master: busca empresas, squads e clientes
        if (isAdminMaster) {
          console.log('Fetching empresas, squads, clients for Admin Master...')
          const [empresasRes, squadsRes, clientsRes] = await Promise.all([
            apiGet('/empresas'),
            apiGet('/squads'),
            apiGet('/admin/clientes')
          ])
          // A API retorna arrays diretamente para empresas/squads
          // e { clients: [...] } para clientes
          const empresasData = Array.isArray(empresasRes) ? empresasRes : []
          const squadsData = Array.isArray(squadsRes) ? squadsRes : []
          const clientsData = (clientsRes as any).clients || []
          
          setEmpresas(empresasData as Empresa[])
          setSquads(squadsData as Squad[])
          setClients(clientsData)
        }
        // Funcionário: busca apenas clientes da sua squad
        else if (isFuncionario && user?.squadId) {
          const clientsRes = await apiGet(`/squads/${user.squadId}/clientes`) as { clientes: Client[] }
          setClients(clientsRes.clientes || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [canCreatePost, isAdminMaster, isFuncionario, user?.squadId])

  if (!canCreatePost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
          <p className="text-gray-600">Apenas administradores e funcionários podem criar posts.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: CreatePostData) => {
    try {
      await apiPost('/posts', data)
      navigate('/posts')
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  const handleCancel = () => {
    navigate('/posts')
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
      isAdminMaster={isAdminMaster}
      isFuncionario={isFuncionario}
      funcionarioSquadId={user?.squadId}
      clients={clients}
      empresas={empresas}
      squads={squads}
    />
  )
}
