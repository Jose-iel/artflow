import React, { useState, useEffect, useMemo } from 'react'
import { apiPost } from '@/services/api'

export interface CreatePostData {
  imagemUrl: string
  legenda: string | null
  dataAgendada: string | null
  clienteId?: string
  squadId?: string
}

export interface Client {
  id: string
  nome: string
  email: string
  squadId?: string
}

export interface Empresa {
  id: string
  nome: string
}

export interface Squad {
  id: string
  nome: string
  empresaId: string
}

interface PostFormProps {
  onSubmit?: (data: CreatePostData) => Promise<void>
  onCancel?: () => void
  isAdminMaster?: boolean
  isFuncionario?: boolean
  funcionarioSquadId?: string
  clients?: Client[]
  empresas?: Empresa[]
  squads?: Squad[]
  initialData?: CreatePostData
  isEditing?: boolean
  submitting?: boolean
}

interface FormErrors {
  imagemUrl?: string
  legenda?: string
  dataAgendada?: string
  empresaId?: string
  squadId?: string
  clienteId?: string
  general?: string
}

export const PostForm: React.FC<PostFormProps> = ({
  onSubmit,
  onCancel,
  isAdminMaster = false,
  isFuncionario = false,
  funcionarioSquadId,
  clients = [],
  empresas = [],
  squads = [],
  initialData,
  isEditing = false,
  submitting = false
}) => {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('')
  const [selectedSquadId, setSelectedSquadId] = useState<string>(funcionarioSquadId || '')
  const [formData, setFormData] = useState<CreatePostData>({
    imagemUrl: initialData?.imagemUrl || '',
    legenda: initialData?.legenda || '',
    dataAgendada: initialData?.dataAgendada || '',
    clienteId: initialData?.clienteId || '',
    squadId: funcionarioSquadId || ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(submitting)

  const isAdmin = isAdminMaster || isFuncionario

  console.log('PostForm - isAdminMaster:', isAdminMaster)
  console.log('PostForm - empresas:', empresas)
  console.log('PostForm - squads:', squads)
  console.log('PostForm - clients:', clients)

  // Filtra squads pela empresa selecionada (apenas para Admin Master)
  const filteredSquads = useMemo(() => {
    if (!isAdminMaster || !selectedEmpresaId) return []
    return squads.filter(s => s.empresaId === selectedEmpresaId)
  }, [isAdminMaster, selectedEmpresaId, squads])

  // Filtra clientes pela squad selecionada
  const filteredClients = useMemo(() => {
    if (isFuncionario) {
      // Funcionário já recebe apenas clientes da sua squad
      return clients
    }
    if (isAdminMaster && selectedSquadId) {
      return clients.filter(c => c.squadId === selectedSquadId)
    }
    return []
  }, [isAdminMaster, isFuncionario, selectedSquadId, clients])

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        imagemUrl: initialData.imagemUrl || '',
        legenda: initialData.legenda || '',
        dataAgendada: initialData.dataAgendada || '',
        clienteId: initialData.clienteId || '',
        squadId: initialData.squadId || funcionarioSquadId || ''
      })
    }
  }, [initialData, funcionarioSquadId])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.imagemUrl.trim()) {
      newErrors.imagemUrl = 'URL da imagem é obrigatória'
    } else if (!formData.imagemUrl.match(/^https?:\/\/.+/)) {
      newErrors.imagemUrl = 'URL da imagem inválida'
    }

    if (isAdminMaster) {
      if (!selectedEmpresaId) {
        newErrors.empresaId = 'Empresa é obrigatória'
      }
      if (!selectedSquadId) {
        newErrors.squadId = 'Squad é obrigatória'
      }
    }

    if (isAdmin && !formData.clienteId) {
      newErrors.clienteId = 'Cliente é obrigatório'
    }

    if (formData.dataAgendada) {
      const scheduledDate = new Date(formData.dataAgendada)
      if (scheduledDate <= new Date()) {
        newErrors.dataAgendada = 'Data agendada deve ser futura'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      // Convert datetime-local to timezone-aware string for Brazil timezone
      const submissionData: CreatePostData = {
        imagemUrl: formData.imagemUrl,
        legenda: formData.legenda,
        dataAgendada: formData.dataAgendada ? `${formData.dataAgendada}:00-03:00` : null,
        clienteId: formData.clienteId,
        squadId: isFuncionario ? funcionarioSquadId : selectedSquadId
      }
      
      if (onSubmit) {
        await onSubmit(submissionData)
      } else {
        // Default API call
        await apiPost('/posts', submissionData)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ general: 'Erro ao criar post. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreatePostData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getPreviewDate = () => {
    return formData.dataAgendada 
      ? new Date(formData.dataAgendada).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Pendente'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-2xl font-bold">{isEditing ? 'Editar Post' : 'Criar Novo Post'}</h1>
            <p className="text-blue-100">Crie seu post e veja o preview em tempo real</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Form Section */}
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Empresa Selection - Admin Master Only */}
                {isAdminMaster && !isEditing && (
                  <div>
                    <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa *
                    </label>
                    <select
                      id="empresa"
                      value={selectedEmpresaId}
                      onChange={(e) => {
                        setSelectedEmpresaId(e.target.value)
                        setSelectedSquadId('')
                        handleInputChange('clienteId', '')
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.empresaId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione uma empresa</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </option>
                      ))}
                    </select>
                    {errors.empresaId && (
                      <p className="mt-1 text-sm text-red-600">{errors.empresaId}</p>
                    )}
                  </div>
                )}

                {/* Squad Selection - Admin Master Only */}
                {isAdminMaster && !isEditing && (
                  <div>
                    <label htmlFor="squad" className="block text-sm font-medium text-gray-700 mb-2">
                      Squad *
                    </label>
                    <select
                      id="squad"
                      value={selectedSquadId}
                      onChange={(e) => {
                        setSelectedSquadId(e.target.value)
                        handleInputChange('clienteId', '')
                      }}
                      disabled={!selectedEmpresaId}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.squadId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione uma squad</option>
                      {filteredSquads.map((squad) => (
                        <option key={squad.id} value={squad.id}>
                          {squad.nome}
                        </option>
                      ))}
                    </select>
                    {errors.squadId && (
                      <p className="mt-1 text-sm text-red-600">{errors.squadId}</p>
                    )}
                    {!selectedEmpresaId && (
                      <p className="mt-1 text-xs text-gray-500">Selecione uma empresa primeiro</p>
                    )}
                  </div>
                )}

                {/* Client Selection - Admin/Funcionario */}
                {isAdmin && (
                  <div>
                    <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    {isEditing ? (
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        {clients.find(c => c.id === formData.clienteId)?.nome || 'Cliente não encontrado'}
                      </div>
                    ) : (
                      <select
                        id="cliente"
                        value={formData.clienteId || ''}
                        onChange={(e) => handleInputChange('clienteId', e.target.value)}
                        disabled={isAdminMaster && !selectedSquadId}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.clienteId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecione um cliente</option>
                        {filteredClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.nome} ({client.email})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.clienteId && !isEditing && (
                      <p className="mt-1 text-sm text-red-600">{errors.clienteId}</p>
                    )}
                    {isAdminMaster && !selectedSquadId && !isEditing && (
                      <p className="mt-1 text-xs text-gray-500">Selecione uma squad primeiro</p>
                    )}
                  </div>
                )}

                {/* Image URL */}
                <div>
                  <label htmlFor="imagemUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem *
                  </label>
                  <input
                    id="imagemUrl"
                    type="url"
                    value={formData.imagemUrl}
                    onChange={(e) => handleInputChange('imagemUrl', e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.imagemUrl ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.imagemUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.imagemUrl}</p>
                  )}
                </div>

                {/* Caption */}
                <div>
                  <label htmlFor="legenda" className="block text-sm font-medium text-gray-700 mb-2">
                    Legenda do Post
                  </label>
                  <textarea
                    id="legenda"
                    value={formData.legenda || ''}
                    onChange={(e) => handleInputChange('legenda', e.target.value)}
                    placeholder="Digite a legenda do seu post..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {(formData.legenda || '').length}/220 caracteres
                  </p>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label htmlFor="dataAgendada" className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Agendamento
                  </label>
                  <input
                    id="dataAgendada"
                    type="datetime-local"
                    value={formData.dataAgendada || ''}
                    onChange={(e) => handleInputChange('dataAgendada', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.dataAgendada ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dataAgendada && (
                    <p className="mt-1 text-sm text-red-600">{errors.dataAgendada}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Deixe em branco para postar imediatamente
                  </p>
                </div>

                {/* Error Message */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Post')}
                  </button>
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Mobile Preview Section */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Mobile</h3>
                <p className="text-sm text-gray-600">Veja como seu post ficará no Instagram</p>
              </div>

              {/* Mobile Frame */}
              <div className="bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-sm mx-auto">
                  {/* Mobile Instagram Header */}
                  <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      <span className="font-semibold text-xs">artflow</span>
                    </div>
                    <button className="text-gray-600 hover:text-gray-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Mobile Post Image */}
                  <div className="bg-black">
                    {formData.imagemUrl ? (
                      <img 
                        src={formData.imagemUrl} 
                        alt="Preview"
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagem+Inválida'
                        }}
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500">URL da imagem</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Post Actions */}
                  <div className="bg-white px-3 py-2 flex items-center space-x-3 border-b border-gray-100">
                    <button className="text-gray-700 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <button className="text-gray-700 hover:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <button className="text-gray-700 hover:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Mobile Post Content */}
                  <div className="bg-white px-3 py-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <span className="font-semibold text-xs">artflow</span>
                    </div>
                    <p className="text-xs text-gray-800 mb-2">
                      <span className="font-semibold text-xs">artflow</span> {formData.legenda || 'Sem legenda'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                      <span>{getPreviewDate()}</span>
                    </div>
                    
                    {/* Mobile Status Badge */}
                    <div className="mb-3">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Não aprovado
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Dicas</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use imagens com proporção 1:1 ou 4:5</li>
                  <li>• Legendas com até 220 caracteres funcionam melhor</li>
                  <li>• Agende posts para horários de pico do seu público</li>
                  <li>• Use hashtags relevantes para aumentar a visibilidade</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
