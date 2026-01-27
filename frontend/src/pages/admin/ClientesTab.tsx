// Tab de Gerenciamento de Clientes
import React, { useState } from 'react'
import { useClientes, useDeleteCliente } from '@/hooks/useClientes'
import { useSquads } from '@/hooks/useSquads'
import { ClienteForm } from '@/features/admin'
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
import type { Cliente } from '@/services/adminApi'

export const ClientesTab: React.FC = () => {
  const { data: clientes, isLoading, error } = useClientes()
  const { data: squads } = useSquads()
  const deleteCliente = useDeleteCliente()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClientes = clientes?.filter((cliente) => {
    return (
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleDelete = async () => {
    if (!deletingCliente || !deletingCliente.squadId) return

    try {
      await deleteCliente.mutateAsync({ 
        squadId: deletingCliente.squadId, 
        clienteId: deletingCliente.id 
      })
      setDeletingCliente(null)
    } catch (err) {
      console.error('Erro ao excluir cliente:', err)
    }
  }

  const getSquadNome = (squadId?: string) => {
    if (!squadId) return 'Sem squad'
    return squads?.find((s) => s.id === squadId)?.nome || 'N/A'
  }

  const columns: Column<Cliente>[] = [
    {
      key: 'nome',
      header: 'Cliente',
      render: (cliente) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
          <div className="text-sm text-gray-500">{cliente.email}</div>
        </div>
      )
    },
    {
      key: 'squadId',
      header: 'Squad',
      render: (cliente) => (
        <span className="text-sm text-gray-500">{getSquadNome(cliente.squadId)}</span>
      )
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (cliente) => <StatusBadge active={cliente.ativo !== false} />
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (cliente) => (
        <div className="space-x-3">
          <button
            onClick={() => setEditingCliente(cliente)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Editar
          </button>
          <button
            onClick={() => setDeletingCliente(cliente)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Excluir
          </button>
        </div>
      )
    }
  ]

  if (isLoading) return <LoadingState message="Carregando clientes..." />
  if (error) return <ErrorState message="Erro ao carregar clientes" />

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nome ou email..."
          ariaLabel="Buscar clientes"
        />
        <ActionButton
          onClick={() => setShowCreateModal(true)}
          label="Novo Cliente"
          icon="+"
          variant="success"
        />
      </div>

      {/* Clientes Table */}
      {filteredClientes && filteredClientes.length > 0 ? (
        <DataTable
          data={filteredClientes}
          columns={columns}
          keyExtractor={(cliente) => cliente.id}
        />
      ) : (
        <EmptyState
          hasFilters={!!searchTerm}
          message="Nenhum cliente cadastrado"
          filteredMessage="Nenhum cliente encontrado com esse filtro"
        />
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCliente) && (
        <ClienteForm
          cliente={editingCliente}
          squads={squads || []}
          onClose={() => {
            setShowCreateModal(false)
            setEditingCliente(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCliente && (
        <ConfirmModal
          title="Excluir Cliente"
          message={`Tem certeza que deseja excluir o cliente "${deletingCliente.nome}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          confirmVariant="danger"
          isLoading={deleteCliente.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCliente(null)}
        />
      )}
    </div>
  )
}
