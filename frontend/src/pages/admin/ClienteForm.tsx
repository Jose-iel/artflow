// Formulário de Cliente (Criar/Editar)
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateCliente, useUpdateCliente } from '@/hooks/useClientes'
import { Modal, FormField, FormSelect, FormCheckbox, FormActions } from '@/components/ui'
import type { Cliente } from '@/services/adminApi'
import type { Squad } from '@/types/admin'

const createSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  squadId: z.string().min(1, 'Squad é obrigatório')
})

const updateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  ativo: z.boolean().optional()
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = z.infer<typeof updateSchema>

interface ClienteFormProps {
  cliente?: Cliente | null
  squads: Squad[]
  onClose: () => void
}

export const ClienteForm: React.FC<ClienteFormProps> = ({ cliente, squads, onClose }) => {
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const isEditing = !!cliente

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: {
      nome: cliente?.nome || '',
      email: cliente?.email || '',
      ...(isEditing ? { ativo: cliente?.ativo !== false } : { squadId: '', senha: '' })
    }
  })

  const squadOptions = squads.map(s => ({ value: s.id, label: s.nome }))

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (isEditing && cliente) {
        await updateCliente.mutateAsync({
          id: cliente.id,
          data: { nome: data.nome, email: data.email, ativo: (data as UpdateFormData).ativo }
        })
      } else {
        const createData = data as CreateFormData
        await createCliente.mutateAsync({
          squadId: createData.squadId,
          data: { nome: createData.nome, email: createData.email, senha: createData.senha }
        })
      }
      onClose()
    } catch (err) {
      console.error('Erro ao salvar cliente:', err)
    }
  }

  return (
    <Modal title={isEditing ? 'Editar Cliente' : 'Novo Cliente'} titleId="cliente-form-title">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField id="cliente-nome" label="Nome" register={register('nome')} error={errors.nome} />
        <FormField id="cliente-email" label="Email" type="email" register={register('email')} error={errors.email} />
        {!isEditing && (
          <>
            <FormField
              id="cliente-senha"
              label="Senha"
              type="password"
              register={register('senha' as keyof CreateFormData)}
              error={(errors as any).senha}
            />
            <FormSelect
              id="cliente-squad"
              label="Squad"
              options={squadOptions}
              placeholder="Selecione uma squad"
              register={register('squadId' as keyof CreateFormData)}
              error={(errors as any).squadId}
            />
          </>
        )}
        {isEditing && (
          <FormCheckbox id="cliente-ativo" label="Cliente ativo" register={register('ativo' as keyof UpdateFormData)} />
        )}
        <FormActions onCancel={onClose} isSubmitting={isSubmitting} isEditing={isEditing} />
      </form>
    </Modal>
  )
}
