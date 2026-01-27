// Tab de Gerenciamento de Empresas
import React, { useState } from 'react'
import { useEmpresas, useDeleteEmpresa } from '@/hooks/useEmpresas'
import { EmpresaForm } from '@/features/admin'
import {
  ConfirmModal,
  SearchInput,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  ActionButton
} from '@/components/ui'
import type { Empresa } from '@/types/admin'

export const EmpresasTab: React.FC = () => {
  const { data: empresas, isLoading, error } = useEmpresas()
  const deleteEmpresa = useDeleteEmpresa()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)
  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEmpresas = empresas?.filter(
    (empresa) =>
      empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.cnpj.includes(searchTerm)
  )

  const handleDelete = async () => {
    if (!deletingEmpresa) return
    try {
      await deleteEmpresa.mutateAsync(deletingEmpresa.id)
      setDeletingEmpresa(null)
    } catch (err) {
      console.error('Erro ao excluir empresa:', err)
    }
  }

  if (isLoading) return <LoadingState message="Carregando empresas..." />
  if (error) return <ErrorState message="Erro ao carregar empresas" />

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nome ou CNPJ..."
          ariaLabel="Buscar empresas"
        />
        <ActionButton onClick={() => setShowCreateModal(true)} label="Nova Empresa" icon="+" variant="primary" />
      </div>

      {filteredEmpresas && filteredEmpresas.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmpresas.map((empresa) => (
            <div
              key={empresa.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{empresa.nome}</h3>
                  <p className="text-sm text-gray-500">{empresa.cnpj}</p>
                </div>
                <StatusBadge active={empresa.ativo} activeLabel="Ativa" inactiveLabel="Inativa" />
              </div>
              {empresa.descricao && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{empresa.descricao}</p>
              )}
              <div className="text-xs text-gray-500 mb-3">
                <span>Squads: {empresa.squads?.length || 0}</span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => setEditingEmpresa(empresa)} className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium py-1">
                  Editar
                </button>
                <button onClick={() => setDeletingEmpresa(empresa)} className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium py-1">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState hasFilters={!!searchTerm} message="Nenhuma empresa cadastrada" filteredMessage="Nenhuma empresa encontrada com esse termo" />
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingEmpresa) && (
        <EmpresaForm
          empresa={editingEmpresa}
          onClose={() => {
            setShowCreateModal(false)
            setEditingEmpresa(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmpresa && (
        <ConfirmModal
          title="Excluir Empresa"
          message={`Tem certeza que deseja excluir a empresa "${deletingEmpresa.nome}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={deleteEmpresa.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingEmpresa(null)}
        />
      )}
    </div>
  )
}
