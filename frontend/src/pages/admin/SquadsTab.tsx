// Tab de Gerenciamento de Squads
import React, { useState } from 'react'
import { useSquads, useDeleteSquad } from '@/hooks/useSquads'
import { useEmpresas } from '@/hooks/useEmpresas'
import { SquadForm } from './SquadForm'
import {
  ConfirmModal,
  SearchInput,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  ActionButton
} from '@/components/ui'
import type { Squad } from '@/types/admin'

export const SquadsTab: React.FC = () => {
  const { data: squads, isLoading, error } = useSquads()
  const { data: empresas } = useEmpresas()
  const deleteSquad = useDeleteSquad()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null)
  const [deletingSquad, setDeletingSquad] = useState<Squad | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [empresaFilter, setEmpresaFilter] = useState<string>('')

  const filteredSquads = squads?.filter((squad) => {
    const matchesSearch = squad.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmpresa = empresaFilter ? squad.empresaId === empresaFilter : true
    return matchesSearch && matchesEmpresa
  })

  const handleDelete = async () => {
    if (!deletingSquad) return
    try {
      await deleteSquad.mutateAsync(deletingSquad.id)
      setDeletingSquad(null)
    } catch (err) {
      console.error('Erro ao excluir squad:', err)
    }
  }

  const getEmpresaNome = (empresaId: string) => {
    return empresas?.find((e) => e.id === empresaId)?.nome || 'N/A'
  }

  if (isLoading) return <LoadingState message="Carregando squads..." />
  if (error) return <ErrorState message="Erro ao carregar squads" />

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar por nome..." ariaLabel="Buscar squads" />
          <select
            value={empresaFilter}
            onChange={(e) => setEmpresaFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filtrar por empresa"
          >
            <option value="">Todas as empresas</option>
            {empresas?.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
            ))}
          </select>
        </div>
        <ActionButton onClick={() => setShowCreateModal(true)} label="Nova Squad" icon="+" variant="primary" />
      </div>

      {filteredSquads && filteredSquads.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSquads.map((squad) => (
            <div key={squad.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{squad.nome}</h3>
                  <p className="text-sm text-blue-600">{getEmpresaNome(squad.empresaId)}</p>
                </div>
                <StatusBadge active={squad.ativo} activeLabel="Ativa" inactiveLabel="Inativa" />
              </div>
              {squad.descricao && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{squad.descricao}</p>}
              <div className="text-xs text-gray-500 mb-3 flex gap-4">
                <span>Funcionários: {squad.funcionarios?.length || 0}</span>
                <span>Clientes: {squad.clientes?.length || 0}</span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => setEditingSquad(squad)} className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium py-1">
                  Editar
                </button>
                <button onClick={() => setDeletingSquad(squad)} className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium py-1">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState hasFilters={!!(searchTerm || empresaFilter)} message="Nenhuma squad cadastrada" filteredMessage="Nenhuma squad encontrada com esses filtros" />
      )}

      {(showCreateModal || editingSquad) && (
        <SquadForm squad={editingSquad} empresas={empresas || []} onClose={() => { setShowCreateModal(false); setEditingSquad(null) }} />
      )}

      {deletingSquad && (
        <ConfirmModal
          title="Excluir Squad"
          message={`Tem certeza que deseja excluir a squad "${deletingSquad.nome}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={deleteSquad.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingSquad(null)}
        />
      )}
    </div>
  )
}
