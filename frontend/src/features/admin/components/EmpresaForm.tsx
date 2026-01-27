// Formulário de Empresa (Criar/Editar)
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateEmpresa, useUpdateEmpresa } from '@/hooks/useEmpresas'
import { Modal, FormField, FormActions } from '@/components/ui'
import type { Empresa } from '@/types/admin'

const empresaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos').max(18, 'CNPJ inválido'),
  descricao: z.string().optional()
})

type EmpresaFormData = z.infer<typeof empresaSchema>

interface EmpresaFormProps {
  empresa?: Empresa | null
  onClose: () => void
}

export const EmpresaForm: React.FC<EmpresaFormProps> = ({ empresa, onClose }) => {
  const createEmpresa = useCreateEmpresa()
  const updateEmpresa = useUpdateEmpresa()
  const isEditing = !!empresa

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome: empresa?.nome || '',
      cnpj: empresa?.cnpj || '',
      descricao: empresa?.descricao || ''
    }
  })

  const onSubmit = async (data: EmpresaFormData) => {
    try {
      if (isEditing && empresa) {
        await updateEmpresa.mutateAsync({ id: empresa.id, data })
      } else {
        await createEmpresa.mutateAsync(data)
      }
      onClose()
    } catch (err) {
      console.error('Erro ao salvar empresa:', err)
    }
  }

  return (
    <Modal title={isEditing ? 'Editar Empresa' : 'Nova Empresa'} titleId="empresa-form-title">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField id="empresa-nome" label="Nome da Empresa" register={register('nome')} error={errors.nome} />
        <FormField id="empresa-cnpj" label="CNPJ" placeholder="00.000.000/0001-00" register={register('cnpj')} error={errors.cnpj} />
        <div>
          <label htmlFor="empresa-descricao" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição (opcional)
          </label>
          <textarea
            id="empresa-descricao"
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
