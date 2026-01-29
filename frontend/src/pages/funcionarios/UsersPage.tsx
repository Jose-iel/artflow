// Página de Gerenciamento de Usuários (Clientes e Funcionários)
import React, { useState, useEffect, useMemo } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from '@/services/api'
import { UserRole } from '@/types/auth'
import { User, UserPlus, Briefcase, Trash2, Edit, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

// Interface para Clientes (tabela clientes)
interface ClienteData {
  id: string
  nome: string
  email: string
  ativo: boolean
  squadId?: string
  criadoEm: string
  atualizadoEm: string
}

// Interface para Funcionários (tabela users)
interface FuncionarioData {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  squadId?: string | null
  criadoEm: string
  atualizadoEm: string
  squad?: {
    id: string
    nome: string
  }
}

interface Squad {
  id: string
  nome: string
}

type ActiveTab = 'clientes' | 'funcionarios'

export const UsersPage: React.FC = () => {
  const { user } = useAuthStore()
  const [allClientes, setAllClientes] = useState<ClienteData[]>([])
  const [funcionarios, setFuncionarios] = useState<FuncionarioData[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('clientes')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null)
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioData | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    squadId: ''
  })

  const isFuncionario = user?.role === UserRole.FUNCIONARIO

  // Filtrar e ordenar clientes baseado no role do usuário
  const clientes = useMemo(() => {
    let filtered = allClientes
    if (isFuncionario && user?.squadId) {
      filtered = allClientes.filter(cliente => cliente.squadId === user.squadId)
    }
    // Ordenar: primeiro por status (ativos primeiro), depois por data de criação
    return [...filtered].sort((a, b) => {
      // Ativos primeiro
      if (a.ativo !== b.ativo) {
        return a.ativo ? -1 : 1
      }
      // Se ambos têm o mesmo status, ordenar por data de criação (mais antigo primeiro)
      return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()
    })
  }, [allClientes, isFuncionario, user?.squadId])

  const fetchClientes = async () => {
    try {
      const response = await apiGet('/admin/users')
      const clientesResponse = response as { usuarios: ClienteData[] }
      setAllClientes(clientesResponse.usuarios || [])
    } catch (err) {
      console.error('Error fetching clientes:', err)
    }
  }

  const fetchFuncionarios = async () => {
    try {
      const response = await apiGet('/users')
      const funcionariosResponse = response as FuncionarioData[]
      // Filtra apenas funcionários (não admin master)
      const filtered = funcionariosResponse.filter(u => u.role === UserRole.FUNCIONARIO)
      setFuncionarios(filtered)
    } catch (err) {
      console.error('Error fetching funcionarios:', err)
    }
  }

  const fetchSquads = async () => {
    try {
      const response = await apiGet('/squads')
      const squadsResponse = response as { data: Squad[] }
      setSquads(squadsResponse.data || [])
    } catch (err) {
      console.error('Error fetching squads:', err)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchClientes(), fetchFuncionarios(), fetchSquads()])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // Handlers para Clientes
  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiPost('/admin/users/create', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        squadId: isFuncionario ? user?.squadId : formData.squadId
      })
      setShowCreateModal(false)
      resetForm()
      fetchClientes()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao criar cliente')
    }
  }

  const handleEditCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCliente) return
    try {
      await apiPatch(`/admin/users/${selectedCliente.id}`, {
        nome: formData.nome,
        email: formData.email
      })
      setShowEditModal(false)
      setSelectedCliente(null)
      resetForm()
      fetchClientes()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao atualizar cliente')
    }
  }

  const handleDeleteCliente = async () => {
    if (!selectedCliente) return
    try {
      // Desativar cliente (não há endpoint de delete real para clientes)
      await apiPatch(`/admin/users/${selectedCliente.id}`, { ativo: false })
      setShowDeleteModal(false)
      setSelectedCliente(null)
      fetchClientes()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao desativar cliente')
    }
  }

  const handleToggleClienteStatus = async (clienteToToggle: ClienteData) => {
    try {
      // Atualização otimista: atualiza o estado local imediatamente
      setAllClientes(prevClientes => 
        prevClientes.map(c => 
          c.id === clienteToToggle.id 
            ? { ...c, ativo: !c.ativo } 
            : c
        )
      )
      
      // Envia a atualização para o backend
      await apiPatch(`/admin/users/${clienteToToggle.id}`, { ativo: !clienteToToggle.ativo })
    } catch (err: any) {
      // Se falhar, reverte a mudança e busca os dados novamente
      alert(err?.response?.data?.message || 'Erro ao alterar status')
      fetchClientes()
    }
  }

  // Handlers para Funcionários
  const handleCreateFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiPost('/users', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        role: UserRole.FUNCIONARIO,
        squadId: isFuncionario ? user?.squadId : (formData.squadId || null)
      })
      setShowCreateModal(false)
      resetForm()
      fetchFuncionarios()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao criar funcionário')
    }
  }

  const handleEditFuncionario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFuncionario) return
    try {
      await apiPut(`/users/${selectedFuncionario.id}`, {
        nome: formData.nome,
        email: formData.email,
        squadId: formData.squadId || null
      })
      setShowEditModal(false)
      setSelectedFuncionario(null)
      resetForm()
      fetchFuncionarios()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao atualizar funcionário')
    }
  }

  const handleDeleteFuncionario = async () => {
    if (!selectedFuncionario) return
    try {
      await apiDelete(`/users/${selectedFuncionario.id}`)
      setShowDeleteModal(false)
      setSelectedFuncionario(null)
      fetchFuncionarios()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao excluir funcionário')
    }
  }

  const handleToggleFuncionarioStatus = async (funcionario: FuncionarioData) => {
    try {
      await apiPut(`/users/${funcionario.id}`, { ativo: !funcionario.ativo })
      fetchFuncionarios()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao alterar status')
    }
  }

  // Helpers
  const resetForm = () => {
    setFormData({ nome: '', email: '', senha: '', squadId: '' })
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditClienteModal = (cliente: ClienteData) => {
    setSelectedCliente(cliente)
    setFormData({
      nome: cliente.nome,
      email: cliente.email,
      senha: '',
      squadId: cliente.squadId || ''
    })
    setShowEditModal(true)
  }

  const openEditFuncionarioModal = (funcionario: FuncionarioData) => {
    setSelectedFuncionario(funcionario)
    setFormData({
      nome: funcionario.nome,
      email: funcionario.email,
      senha: '',
      squadId: funcionario.squadId || ''
    })
    setShowEditModal(true)
  }

  const openDeleteClienteModal = (cliente: ClienteData) => {
    setSelectedCliente(cliente)
    setShowDeleteModal(true)
  }

  const openDeleteFuncionarioModal = (funcionario: FuncionarioData) => {
    setSelectedFuncionario(funcionario)
    setShowDeleteModal(true)
  }

  const getSquadNome = (squadId?: string | null) => {
    if (!squadId) return 'Sem squad'
    return squads.find(s => s.id === squadId)?.nome || 'N/A'
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowDeleteModal(false)
    setSelectedCliente(null)
    setSelectedFuncionario(null)
    resetForm()
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
        <p className="text-gray-600 mt-1">Cadastre e gerencie clientes e funcionários</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('clientes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'clientes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4" />
            Clientes ({clientes.length})
          </button>
          <button
            onClick={() => setActiveTab('funcionarios')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'funcionarios'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Funcionários ({funcionarios.length})
          </button>
        </nav>
      </div>

      {/* Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {activeTab === 'clientes' 
            ? 'Gerenciando todos os clientes' 
            : 'Gerenciando todos os funcionários'}
        </div>
        {(activeTab === 'clientes' || !isFuncionario) && (
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Novo {activeTab === 'clientes' ? 'Cliente' : 'Funcionário'}
          </button>
        )}
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
              {activeTab === 'funcionarios' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Squad
                </th>
              )}
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
            {activeTab === 'clientes' ? (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.email}
                  </td>
                  {/* Coluna Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      cliente.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openEditClienteModal(cliente)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                        type="button"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleToggleClienteStatus(cliente)
                        }}
                        className={cliente.ativo ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                        title={cliente.ativo ? 'Desativar' : 'Ativar'}
                        type="button"
                      >
                        {cliente.ativo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openDeleteClienteModal(cliente)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              funcionarios.map((funcionario) => (
                <tr key={funcionario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{funcionario.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {funcionario.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {funcionario.squad?.nome || getSquadNome(funcionario.squadId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      funcionario.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {funcionario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(funcionario.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!isFuncionario && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openEditFuncionarioModal(funcionario)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFuncionarioStatus(funcionario)
                          }}
                          className={funcionario.ativo ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                          title={funcionario.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {funcionario.ativo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => openDeleteFuncionarioModal(funcionario)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {((activeTab === 'clientes' && clientes.length === 0) || 
          (activeTab === 'funcionarios' && funcionarios.length === 0)) && (
          <div className="text-center py-8 text-gray-500">
            Nenhum {activeTab === 'clientes' ? 'cliente' : 'funcionário'} encontrado
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Criar Novo {activeTab === 'clientes' ? 'Cliente' : 'Funcionário'}
            </h2>
            <form onSubmit={activeTab === 'clientes' ? handleCreateCliente : handleCreateFuncionario}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {activeTab === 'funcionarios' && !isFuncionario && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Squad</label>
                  <select
                    value={formData.squadId}
                    onChange={(e) => setFormData({...formData, squadId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma squad</option>
                    {squads.map(squad => (
                      <option key={squad.id} value={squad.id}>{squad.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  Criar
                </button>
                <button type="button" onClick={closeModals} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (selectedCliente || selectedFuncionario) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Editar {activeTab === 'clientes' ? 'Cliente' : 'Funcionário'}
            </h2>
            <form onSubmit={activeTab === 'clientes' ? handleEditCliente : handleEditFuncionario}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {activeTab === 'funcionarios' && !isFuncionario && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Squad</label>
                  <select
                    value={formData.squadId}
                    onChange={(e) => setFormData({...formData, squadId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma squad</option>
                    {squads.map(squad => (
                      <option key={squad.id} value={squad.id}>{squad.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  Salvar
                </button>
                <button type="button" onClick={closeModals} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (selectedCliente || selectedFuncionario) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-red-600">
              Excluir {activeTab === 'clientes' ? 'Cliente' : 'Funcionário'}
            </h2>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir <strong>{selectedCliente?.nome || selectedFuncionario?.nome}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={activeTab === 'clientes' ? handleDeleteCliente : handleDeleteFuncionario}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Excluir
              </button>
              <button onClick={closeModals} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
