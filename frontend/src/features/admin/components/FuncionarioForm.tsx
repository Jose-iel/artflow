// Formulário de Funcionário (Criar/Editar)
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateFuncionario, useUpdateFuncionario } from '@/hooks/useFuncionarios'
import { Modal, FormField, FormSelect, FormCheckbox, FormActions } from '@/components/ui'
import type { Funcionario } from '@/types/funcionario'
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
  squadId: z.string().min(1, 'Squad é obrigatório'),
  ativo: z.boolean().optional()
})

type CreateFormData = z.infer<typeof createSchema>
type UpdateFormData = z.infer<typeof updateSchema>

interface FuncionarioFormProps {
  funcionario?: Funcionario | null
  squads: Squad[]
  onClose: () => void
}

export const FuncionarioForm: React.FC<FuncionarioFormProps> = ({ 
  funcionario, 
  squads, 
  onClose 
}) => {
  const createFuncionario = useCreateFuncionario()
  const updateFuncionario = useUpdateFuncionario()
  const isEditing = !!funcionario

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: {
      nome: funcionario?.nome || '',
      email: funcionario?.email || '',
      squadId: funcionario?.squadId || '',
      ...(isEditing ? { ativo: funcionario?.ativo } : { senha: '' })
    }
  })

  const squadOptions = squads.map(s => ({ value: s.id, label: s.nome }))

  const handleFormSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (isEditing && funcionario) {
        await updateFuncionario.mutateAsync({ id: funcionario.id, data })
      } else {
        await createFuncionario.mutateAsync(data as CreateFormData)
      }
      onClose()
    } catch (err) {
      console.error('Erro ao salvar funcionário:', err)
    }
  }

  return (
    <Modal 
      title={isEditing ? 'Editar Funcionário' : 'Novo Funcionário'} 
      titleId="funcionario-form-title"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField 
          id="func-nome" 
          label="Nome" 
          register={register('nome')} 
          error={errors.nome} 
        />
        <FormField 
          id="func-email" 
          label="Email" 
          type="email" 
          register={register('email')} 
          error={errors.email} 
        />
        {!isEditing && (
          <FormField
            id="func-senha"
            label="Senha"
            type="password"
            register={register('senha' as keyof CreateFormData)}
            error={(errors as any).senha}
          />
        )}
        <FormSelect
          id="func-squad"
          label="Squad"
          options={squadOptions}
          placeholder="Selecione uma squad"
          register={register('squadId')}
          error={errors.squadId}
        />
        {isEditing && (
          <FormCheckbox
            id="func-ativo"
            label="Funcionário ativo"
            register={register('ativo' as keyof UpdateFormData)}
          />
        )}
        <FormActions 
          onCancel={onClose} 
          isSubmitting={isSubmitting} 
          isEditing={isEditing} 
        />
      </form>
    </Modal>
  )
}
