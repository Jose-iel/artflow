import React, { useState, useEffect } from 'react'
import { apiGet, apiPost, apiPatch } from '@/services/api'
import { UserRole } from '@/types/auth'

interface User {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

interface CreateUserDto {
  nome: string
  email: string
  senha: string
  role: UserRole
}

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'clients' | 'admins'>('clients')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<CreateUserDto>({
    nome: '',
    email: '',
    senha: '',
    role: UserRole.CLIENT
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/admin/users')
      const usersResponse = response as { usuarios: User[] }
      setUsers(usersResponse.usuarios || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => 
    activeTab === 'clients' ? user.role === UserRole.CLIENT : user.role === UserRole.SUPER_USER
  )

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await apiPost('/admin/users/create', formData)
      setShowCreateModal(false)
      setFormData({ nome: '', email: '', senha: '', role: UserRole.CLIENT })
      fetchUsers()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao criar usuário')
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser) return
    
    try {
      const updateData = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
        ativo: selectedUser.ativo
      }
      
      await apiPatch(`/admin/users/${selectedUser.id}`, updateData)
      setShowEditModal(false)
      setSelectedUser(null)
      setFormData({ nome: '', email: '', senha: '', role: UserRole.CLIENT })
      fetchUsers()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao atualizar usuário')
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      await apiPatch(`/admin/users/${user.id}`, { ativo: !user.ativo })
      fetchUsers()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao alterar status do usuário')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      role: user.role
    })
    setShowEditModal(true)
  }

  const getStatusBadge = (ativo: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${
        ativo 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {ativo ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  const getRoleBadge = (role: UserRole) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${
        role === UserRole.SUPER_USER
          ? 'bg-purple-100 text-purple-800'
          : 'bg-blue-100 text-blue-800'
      }`}>
        {role === UserRole.SUPER_USER ? 'Admin' : 'Cliente'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
        <p className="text-gray-600 mt-1">Cadastre e gerencie clientes e administradores</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Clientes ({users.filter(u => u.role === UserRole.CLIENT).length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admins'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Administradores ({users.filter(u => u.role === UserRole.SUPER_USER).length})
          </button>
        </nav>
      </div>

      {/* Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {activeTab === 'clients' ? 'Gerenciando todos os clientes' : 'Gerenciando todos os administradores'}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          Novo {activeTab === 'clients' ? 'Cliente' : 'Administrador'}
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data de Criação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                  <div className="text-sm text-gray-500 mt-1">{getRoleBadge(user.role)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.ativo)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`${
                      user.ativo 
                        ? 'text-red-600 hover:text-red-900' 
                        : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {user.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum {activeTab === 'clients' ? 'cliente' : 'administrador'} encontrado
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Criar Novo {activeTab === 'clients' ? 'Cliente' : 'Administrador'}
            </h2>
            <form onSubmit={handleCreateUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={UserRole.CLIENT}>Cliente</option>
                  <option value={UserRole.SUPER_USER}>Administrador</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ nome: '', email: '', senha: '', role: UserRole.CLIENT })
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Editar {selectedUser.role === UserRole.CLIENT ? 'Cliente' : 'Administrador'}
            </h2>
            <form onSubmit={handleEditUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={UserRole.CLIENT}>Cliente</option>
                  <option value={UserRole.SUPER_USER}>Administrador</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                    setFormData({ nome: '', email: '', senha: '', role: UserRole.CLIENT })
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
