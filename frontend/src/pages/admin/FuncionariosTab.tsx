// Tab de Gerenciamento de Funcionários
import React, { useState } from 'react'
import { useAdminUsers, useDeleteAdminUser } from '@/hooks/useAdminUsers'
import { useSquads } from '@/hooks/useSquads'
import { FuncionarioForm } from './FuncionarioForm'
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
import type { AdminUser } from '@/types/admin'

export const FuncionariosTab: React.FC = () => {
  const { data: allUsers, isLoading, error } = useAdminUsers()
  const { data: squads } = useSquads()
  const deleteUser = useDeleteAdminUser()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const funcionarios = allUsers?.filter((user) => user.role === 'FUNCIONARIO')

  const filteredFuncionarios = funcionarios?.filter((user) => {
    return (
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleDelete = async () => {
    if (!deletingUser) return
    try {
      await deleteUser.mutateAsync(deletingUser.id)
      setDeletingUser(null)
    } catch (err) {
      console.error('Erro ao excluir funcionário:', err)
    }
  }

  const getSquadNome = (squadId?: string) => {
    if (!squadId) return 'Sem squad'
    return squads?.find((s) => s.id === squadId)?.nome || 'N/A'
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'nome',
      header: 'Funcionário',
      render: (user) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{user.nome}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )
    },
    {
      key: 'squadId',
      header: 'Squad',
      render: (user) => (
        <span className="text-sm text-gray-500">{getSquadNome(user.squadId)}</span>
      )
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (user) => <StatusBadge active={user.ativo} />
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (user) => (
        <div className="space-x-3">
          <button
            onClick={() => setEditingUser(user)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Editar
          </button>
          <button
            onClick={() => setDeletingUser(user)}
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
          keyExtractor={(user) => user.id}
        />
      ) : (
        <EmptyState
          hasFilters={!!searchTerm}
          message="Nenhum funcionário cadastrado"
          filteredMessage="Nenhum funcionário encontrado com esse filtro"
        />
      )}

      {(showCreateModal || editingUser) && (
        <FuncionarioForm
          user={editingUser}
          squads={squads || []}
          onClose={() => {
            setShowCreateModal(false)
            setEditingUser(null)
          }}
        />
      )}

      {deletingUser && (
        <ConfirmModal
          title="Excluir Funcionário"
          message={`Tem certeza que deseja excluir o funcionário "${deletingUser.nome}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={deleteUser.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  )
}
