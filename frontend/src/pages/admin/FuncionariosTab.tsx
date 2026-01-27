// Tab de Gerenciamento de Funcionários
import React, { useState } from 'react'
import { useFuncionarios, useDeleteFuncionario } from '@/hooks/useFuncionarios'
import { useSquads } from '@/hooks/useSquads'
import { FuncionarioForm } from '@/components/funcionarios'
import {
  ConfirmModal,
  SearchInput,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  ActionButton,
  DataTable,
  Column
} from '@/components/ui'
import type { Funcionario } from '@/types/funcionario'

export const FuncionariosTab: React.FC = () => {
  const { data: funcionarios, isLoading, error } = useFuncionarios()
  const { data: squads } = useSquads()
  const deleteFuncionario = useDeleteFuncionario()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null)
  const [deletingFuncionario, setDeletingFuncionario] = useState<Funcionario | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFuncionarios = funcionarios?.filter((func) => {
    return (
      func.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleDelete = async () => {
    if (!deletingFuncionario) return
    try {
      await deleteFuncionario.mutateAsync(deletingFuncionario.id)
      setDeletingFuncionario(null)
    } catch (err) {
      console.error('Erro ao excluir funcionário:', err)
    }
  }

  const getSquadNome = (squadId?: string) => {
    if (!squadId) return 'Sem squad'
    return squads?.find((s) => s.id === squadId)?.nome || 'N/A'
  }

  const columns: Column<Funcionario>[] = [
    {
      key: 'nome',
      header: 'Funcionário',
      render: (func) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{func.nome}</div>
          <div className="text-sm text-gray-500">{func.email}</div>
        </div>
      )
    },
    {
      key: 'squadId',
      header: 'Squad',
      render: (func) => (
        <span className="text-sm text-gray-500">{getSquadNome(func.squadId)}</span>
      )
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (func) => <StatusBadge active={func.ativo} />
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (func) => (
        <div className="space-x-3">
          <button
            onClick={() => setEditingFuncionario(func)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Editar
          </button>
          <button
            onClick={() => setDeletingFuncionario(func)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Excluir
          </button>
        </div>
      )
    }
  ]

  if (isLoading) return <LoadingState message="Carregando funcionários..." />
  if (error) return <ErrorState message="Erro ao carregar funcionários" />

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nome ou email..."
          ariaLabel="Buscar funcionários"
        />
        <ActionButton
          onClick={() => setShowCreateModal(true)}
          label="Novo Funcionário"
          icon="+"
          variant="primary"
        />
      </div>

      {filteredFuncionarios && filteredFuncionarios.length > 0 ? (
        <DataTable
          data={filteredFuncionarios}
          columns={columns}
          keyExtractor={(func) => func.id}
        />
      ) : (
        <EmptyState
          hasFilters={!!searchTerm}
          message="Nenhum funcionário cadastrado"
          filteredMessage="Nenhum funcionário encontrado com esse filtro"
        />
      )}

      {(showCreateModal || editingFuncionario) && (
        <FuncionarioForm
          funcionario={editingFuncionario}
          squads={squads || []}
          onClose={() => {
            setShowCreateModal(false)
            setEditingFuncionario(null)
          }}
        />
      )}

      {deletingFuncionario && (
        <ConfirmModal
          title="Excluir Funcionário"
          message={`Tem certeza que deseja excluir o funcionário "${deletingFuncionario.nome}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={deleteFuncionario.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingFuncionario(null)}
        />
      )}
    </div>
  )
}
