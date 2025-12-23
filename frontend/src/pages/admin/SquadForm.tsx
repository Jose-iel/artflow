// Formulário de Squad (Criar/Editar)
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateSquad, useUpdateSquad } from '@/hooks/useSquads'
import { Modal, FormField, FormSelect, FormActions } from '@/components/ui'
import type { Squad, Empresa } from '@/types/admin'

const squadSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  empresaId: z.string().min(1, 'Selecione uma empresa')
})

type SquadFormData = z.infer<typeof squadSchema>

interface SquadFormProps {
  squad?: Squad | null
  empresas: Empresa[]
  onClose: () => void
}

export const SquadForm: React.FC<SquadFormProps> = ({ squad, empresas, onClose }) => {
  const createSquad = useCreateSquad()
  const updateSquad = useUpdateSquad()
  const isEditing = !!squad

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SquadFormData>({
    resolver: zodResolver(squadSchema),
    defaultValues: {
      nome: squad?.nome || '',
      descricao: squad?.descricao || '',
      empresaId: squad?.empresaId || ''
    }
  })

  const empresaOptions = empresas.map(e => ({ value: e.id, label: e.nome }))

  const onSubmit = async (data: SquadFormData) => {
    try {
      if (isEditing && squad) {
        await updateSquad.mutateAsync({ id: squad.id, data: { nome: data.nome, descricao: data.descricao } })
      } else {
        await createSquad.mutateAsync(data)
      }
      onClose()
    } catch (err) {
      console.error('Erro ao salvar squad:', err)
    }
  }

  return (
    <Modal title={isEditing ? 'Editar Squad' : 'Nova Squad'} titleId="squad-form-title">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField id="squad-nome" label="Nome da Squad" register={register('nome')} error={errors.nome} />
        <div>
          <FormSelect
            id="squad-empresa"
            label="Empresa"
            options={empresaOptions}
            placeholder="Selecione uma empresa"
            register={register('empresaId')}
            error={errors.empresaId}
            disabled={isEditing}
          />
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500">A empresa não pode ser alterada após a criação</p>
          )}
        </div>
        <div>
          <label htmlFor="squad-descricao" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição (opcional)
          </label>
          <textarea
            id="squad-descricao"
            rows={3}
            {...register('descricao')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <FormActions onCancel={onClose} isSubmitting={isSubmitting} isEditing={isEditing} />
      </form>
    </Modal>
  )
}
