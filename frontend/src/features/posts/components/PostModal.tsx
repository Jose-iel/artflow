import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { getPreviewUrl } from '@/utils/googleDriveUtils'

interface PostModalProps {
  post: {
    id: string
    imagemUrl: string
    legenda: string | null
    dataAgendada: string | null
    status: string
    comentarioCliente: string | null
    comentarioAdmin: string | null
    criadoEm: string
  } | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (postId: string, status: string, comment?: string) => void
}

export const PostModal: React.FC<PostModalProps> = ({ 
  post, 
  isOpen, 
  onClose, 
  onUpdateStatus 
}) => {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [comment, setComment] = useState('')

  // Sync selectedStatus with current post status when modal opens
  React.useEffect(() => {
    if (post && isOpen) {
      setSelectedStatus(post.status)
      setComment('')
    }
  }, [post, isOpen])

  if (!post) return null

  const handleStatusUpdate = () => {
    if (selectedStatus && post.id) {
      onUpdateStatus(post.id, selectedStatus, comment)
      setSelectedStatus('')
      setComment('')
      onClose()
    }
  }

  const getPostagemInfo = () => {
    if (post.dataAgendada) {
      return {
        label: 'Postagem agendada para',
        date: new Date(post.dataAgendada).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
    
    switch (post.status) {
      case 'Aprovado':
        return {
          label: 'Postagem',
          date: 'Publicação imediata'
        }
      case 'Agendado':
        return {
          label: 'Postagem',
          date: 'Aguardando agendamento'
        }
      case 'Não aprovado':
        return {
          label: 'Postagem',
          date: 'Aguardando aprovação'
        }
      default:
        return {
          label: 'Postagem',
          date: 'Pendente'
        }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado': return 'text-green-600 bg-green-100'
      case 'Não aprovado': return 'text-red-600 bg-red-100'
      case 'Agendado': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-start justify-center p-4 pt-8">
        {/* The actual modal panel */}
        <Dialog.Panel className="mx-auto max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
          {/* Mobile Layout - Stacked */}
          <div className="lg:hidden flex flex-col h-[90vh] max-h-[800px]">
            {/* Mobile Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Gerenciar Post
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Mobile Post Preview */}
              <div className="bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                    {(() => {
                      const preview = getPreviewUrl(post.imagemUrl)
                      
                      // Para vídeos do Google Drive, usar iframe
                      if (preview.isDriveFile && preview.useIframe) {
                        return (
                          <iframe
                            src={preview.url}
                            width="100%"
                            height="256"
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title="Preview"
                            className="w-full h-64"
                          />
                        )
                      }
                      
                      // Para imagens do Google Drive ou URLs diretas de imagem
                      if (!preview.isVideo) {
                        return (
                          <img 
                            src={preview.url} 
                            alt="Post"
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagem+não+disponível'
                            }}
                          />
                        )
                      }
                      
                      // Para URLs diretas de vídeo (não Drive)
                      return (
                        <video 
                          src={preview.url}
                          className="w-full h-64 object-cover"
                          controls
                          muted
                        />
                      )
                    })()}
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
                      <span className="font-semibold text-xs">artflow</span> {post.legenda || 'Sem legenda'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                      <span>{new Date(post.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    {/* Mobile Status Badge */}
                    <div className="mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                    
                    {/* Mobile Comments */}
                    {(post.comentarioCliente || post.comentarioAdmin) && (
                      <div className="space-y-2 border-t border-gray-100 pt-3">
                        {post.comentarioCliente && (
                          <div className="text-xs">
                            <span className="font-semibold">Cliente:</span> {post.comentarioCliente}
                          </div>
                        )}
                        {post.comentarioAdmin && (
                          <div className="text-xs">
                            <span className="font-semibold">Admin:</span> {post.comentarioAdmin}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mobile Actions */}
              <div className="bg-white p-4 border-t border-gray-200">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Ações do Post</h3>
                  
                  {/* Mobile Status Selection */}
                  <div className="space-y-2 mb-4">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="status-mobile"
                        value="Aprovado"
                        checked={selectedStatus === 'Aprovado'}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-4 h-4 appearance-auto"
                        style={{ accentColor: '#16a34a' }}
                      />
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Aprovar Post</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="status-mobile"
                        value="Não aprovado"
                        checked={selectedStatus === 'Não aprovado'}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-4 h-4 appearance-auto"
                        style={{ accentColor: '#dc2626' }}
                      />
                      <XCircleIcon className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium">Solicitar Alteração</span>
                    </label>
                    
                  </div>
                  
                  {/* Mobile Comment */}
                  {selectedStatus === 'Não aprovado' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentário <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                          !comment.trim() ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Descreva detalhadamente as alterações necessárias: cores, texto, layout, proporções, elementos que devem ser adicionados ou removidos, etc."
                      />
                      {!comment.trim() && (
                        <p className="mt-1 text-xs text-red-600">Comentário obrigatório ao solicitar alteração no post</p>
                      )}
                    </div>
                  )}

                  {/* Histórico do Cliente - Mobile */}
                  {post.comentarioCliente && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Sua última solicitação:</p>
                          <p className="text-sm text-gray-600 mt-1">{post.comentarioCliente}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Enviado em: {new Date(post.criadoEm).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Mobile Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={!selectedStatus || (selectedStatus === 'Não aprovado' && !comment.trim())}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                    >
                      {selectedStatus === 'Aprovado' ? 'Aprovar' : 
                       selectedStatus === 'Não aprovado' ? 'Reprovar' : 
                       'Selecionar uma Ação'}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Layout - Side by Side */}
          <div className="hidden lg:flex flex-row h-[90vh] max-h-[800px]">
            {/* Left Side - Phone Mockup */}
            <div className="flex-initial lg:w-[400px] bg-gray-100 p-8 flex items-center justify-center">
              {/* Phone Frame */}
              <div className="relative mx-auto border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                
                {/* Phone Screen */}
                <div className="rounded-[2rem] overflow-hidden h-full bg-white flex flex-col">
                  {/* Instagram Header */}
                  <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      <span className="font-semibold text-sm">artflow</span>
                    </div>
                    <button className="text-gray-600 hover:text-gray-800">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Post Image */}
                    <div className="bg-black">
                      {(() => {
                        const preview = getPreviewUrl(post.imagemUrl)
                        
                        // Para vídeos do Google Drive, usar iframe
                        if (preview.isDriveFile && preview.useIframe) {
                          return (
                            <iframe
                              src={preview.url}
                              width="100%"
                              height="300"
                              frameBorder="0"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              title="Preview"
                              className="w-full h-[300px]"
                            />
                          )
                        }
                        
                        // Para imagens do Google Drive ou URLs diretas de imagem
                        if (!preview.isVideo) {
                          return (
                            <img 
                              src={preview.url} 
                              alt="Post"
                              className="w-full h-[300px] object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Imagem+não+disponível'
                              }}
                            />
                          )
                        }
                        
                        // Para URLs diretas de vídeo (não Drive)
                        return (
                          <video 
                            src={preview.url}
                            className="w-full h-[300px] object-cover"
                            controls
                            muted
                          />
                        )
                      })()}
                    </div>
                    
                    {/* Post Actions */}
                    <div className="bg-white px-4 py-2 flex items-center space-x-4 border-b border-gray-100">
                      <button className="text-gray-700 hover:text-red-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      <button className="text-gray-700 hover:text-blue-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                      <button className="text-gray-700 hover:text-blue-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Post Content */}
                    <div className="bg-white px-4 py-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        <span className="font-semibold text-sm">artflow</span>
                      </div>
                      <p className="text-sm text-gray-800 mb-2">
                        <span className="font-semibold text-sm">artflow</span> {post.legenda || 'Sem legenda'}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{new Date(post.criadoEm).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="mt-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                      </div>
                      
                      {/* Comments */}
                      {(post.comentarioCliente || post.comentarioAdmin) && (
                        <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                          {post.comentarioCliente && (
                            <div className="text-sm">
                              <span className="font-semibold">Cliente:</span> {post.comentarioCliente}
                            </div>
                          )}
                          {post.comentarioAdmin && (
                            <div className="text-sm">
                              <span className="font-semibold">Admin:</span> {post.comentarioAdmin}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Admin Controls */}
            <div className="flex-1 bg-white p-6 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Gerenciar Post
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Post Info */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Informações do Post</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Status:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Criado em:</strong> {new Date(post.criadoEm).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>{getPostagemInfo().label}:</strong> 
                    <span className={`ml-2 ${post.dataAgendada ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                      {getPostagemInfo().date}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Admin Actions */}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Ações do Post</h3>
                
                {/* Status Selection */}
                <div className="space-y-2 mb-4">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="status-desktop"
                      value="Aprovado"
                      checked={selectedStatus === 'Aprovado'}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-4 h-4 appearance-auto"
                      style={{ accentColor: '#16a34a' }}
                    />
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Aprovar Post</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="status-desktop"
                      value="Não aprovado"
                      checked={selectedStatus === 'Não aprovado'}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-4 h-4 appearance-auto"
                      style={{ accentColor: '#dc2626' }}
                    />
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium">Solicitar Alteração</span>
                  </label>
                  
                </div>
                
                {/* Admin Comment */}
                {selectedStatus === 'Não aprovado' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentário <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !comment.trim() ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Descreva detalhadamente as alterações necessárias: cores, texto, layout, proporções, elementos que devem ser adicionados ou removidos, etc."
                    />
                    {!comment.trim() && (
                      <p className="mt-1 text-xs text-red-600">Comentário obrigatório ao solicitar alteração no post</p>
                    )}
                  </div>
                )}

                {/* Histórico do Cliente */}
                {post.comentarioCliente && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Sua última solicitação:</p>
                        <p className="text-sm text-gray-600 mt-1">{post.comentarioCliente}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Enviado em: {new Date(post.criadoEm).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!selectedStatus || (selectedStatus === 'Não aprovado' && !comment.trim())}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    {selectedStatus === 'Aprovado' ? 'Aprovar' : 
                     selectedStatus === 'Não aprovado' ? 'Reprovar' : 
                     'Selecionar uma Ação'}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
